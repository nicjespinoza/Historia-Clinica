import React, { useState } from 'react';
import { User, Lock, ArrowRight, Phone, Mail, Eye, EyeOff, ArrowLeft, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { api } from '../../lib/api'; //
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Importaciones para consultas seguras a Firestore
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase'; //

// --- LOGIN SCREEN ---
export const PatientLoginScreen = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Autenticar primero (Esto valida credenciales)
            await signIn(email, password);

            // 2. Consulta Única y Segura: Buscar perfil del paciente
            // En lugar de bajar todos los pacientes (prohibido), buscamos SOLO este email.
            const patientsRef = collection(db, 'patients');
            const q = query(patientsRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Perfil encontrado y autorizado
                const patientDoc = querySnapshot.docs[0];
                const patientData = { id: patientDoc.id, ...patientDoc.data() } as any;
                localStorage.setItem('currentPatient', JSON.stringify(patientData));

                // Redirigir según el estado de registro
                const status = patientData.registrationStatus || 'Paciente';

                if (status === 'Proceso1') {
                    // Ficha clínica no completada - ir al dashboard para completar
                    navigate('/app/patient/dashboard');
                } else if (status === 'Proceso2') {
                    // Historia clínica pendiente - enviar a completar historia
                    navigate('/app/patient/history');
                } else if (status === 'Proceso3') {
                    // Signos vitales pendientes - enviar a completar signos
                    navigate('/app/patient/dashboard');
                } else {
                    // Registro completo - ir al dashboard
                    navigate('/app/patient/dashboard');
                }
            } else {
                // Usuario existe en Auth pero no tiene ficha médica
                setError(t('auth.email_taken'));
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError(t('auth.invalid_credential_error', { defaultValue: 'Correo o contraseña incorrectos.' }));
            } else {
                setError(t('auth.login_error', { defaultValue: 'Error al iniciar sesión. Intente nuevamente.' }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // MODIFICADO: Agregado color de texto y color de focus a #084286
    const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl border-2 border-black font-medium text-[#084286] placeholder-gray-400 focus:border-[#084286] focus:ring-2 focus:ring-[#084286] outline-none transition-all";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#083c79] p-4 font-sans">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 relative">

                <div className="absolute top-4 right-4 z-10">
                    <LanguageSwitcher />
                </div>

                <div className="mb-8">
                    <div className="flex justify-center mb-6 pt-2">
                        <img
                            src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_10,y_7,w_390,h_61/fill/w_545,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                            alt="Logo Dr. Milton Mairena Valle"
                            className="h-12 md:h-14 object-contain"
                        />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight text-center">
                        {t('auth.patient_portal_title')}
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium text-center">{t('auth.patient_portal_subtitle')}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-[#000000] mb-2">{t('auth.email')}</label>
                        <div className="relative">
                            {/* ICONO MODIFICADO */}
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#084286] w-5 h-5" />
                            <input
                                type="email"
                                required
                                className={inputClass}
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#000000] mb-2">{t('auth.password')}</label>
                        <div className="relative">
                            {/* ICONO MODIFICADO */}
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#084286] w-5 h-5" />
                            <input
                                type="password"
                                required
                                className={inputClass}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>{t('auth.enter')} <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-gray-500 text-sm">
                        {t('auth.dont_have_account')}{' '}
                        <button onClick={() => navigate('/app/patient/register')} className="text-blue-600 font-bold hover:underline">
                            {t('auth.register_here')}
                        </button>
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} /> {t('auth.go_back')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- REGISTER SCREEN ---
export const PatientRegisterScreen = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    // Errores específicos por campo
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [generalError, setGeneralError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validación de Nombre (mín. 3 caracteres)
    const handleFirstNameBlur = () => {
        if (!formData.firstName) return;
        setFieldErrors(prev => ({ ...prev, firstName: '' }));
        if (formData.firstName.length < 3) {
            setFieldErrors(prev => ({ ...prev, firstName: t('auth.min_chars') }));
        }
    };

    // Validación de Apellido (mín. 3 caracteres)
    const handleLastNameBlur = () => {
        if (!formData.lastName) return;
        setFieldErrors(prev => ({ ...prev, lastName: '' }));
        if (formData.lastName.length < 3) {
            setFieldErrors(prev => ({ ...prev, lastName: t('auth.min_chars') }));
        }
    };

    // Validación de Email y Disponibilidad
    const handleEmailBlur = async () => {
        if (!formData.email) return;
        setFieldErrors(prev => ({ ...prev, email: '' }));
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailRegex.test(formData.email)) {
            setFieldErrors(prev => ({ ...prev, email: t('auth.invalid_email') }));
            return;
        }

        try {
            const { exists } = await api.checkEmailAvailability(formData.email);
            if (exists) {
                setFieldErrors(prev => ({
                    ...prev,
                    email: t('auth.email_taken')
                }));
            }
        } catch (error) {
            console.error("Error validando email:", error);
        }
    };

    // Handler para teléfono - solo acepta números
    const handlePhoneChange = (value: string) => {
        const onlyNumbers = value.replace(/\D/g, '');
        setFormData({ ...formData, phone: onlyNumbers });
    };

    // Validación de teléfono: código de área + número = 11 dígitos
    const handlePhoneBlur = () => {
        if (!formData.phone) return;
        setFieldErrors(prev => ({ ...prev, phone: '' }));

        const phoneRegex = /^\d{11}$/;
        if (!phoneRegex.test(formData.phone)) {
            setFieldErrors(prev => ({
                ...prev,
                phone: t('auth.invalid_phone')
            }));
        }
    };

    // Validación de contraseña robusta
    const handlePasswordBlur = () => {
        if (!formData.password) return;
        setFieldErrors(prev => ({ ...prev, password: '' }));

        const hasMinLength = formData.password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecial = /[@&#$%*!]/.test(formData.password);

        if (!hasMinLength || !hasLetter || !hasNumber || !hasSpecial) {
            setFieldErrors(prev => ({ ...prev, password: t('auth.password_requirements') }));
        }
    };

    // Validación de confirmación de contraseña
    const handleConfirmPasswordBlur = () => {
        if (!formData.confirmPassword) return;
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));

        if (formData.password !== formData.confirmPassword) {
            setFieldErrors(prev => ({
                ...prev,
                confirmPassword: t('auth.passwords_dont_match')
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        setFieldErrors({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });

        // Validaciones
        const hasMinLength = formData.password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecial = /[@&#$%*!]/.test(formData.password);

        if (!hasMinLength || !hasLetter || !hasNumber || !hasSpecial) {
            setFieldErrors(prev => ({ ...prev, password: 'Contraseña no cumple los requisitos de seguridad' }));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await signUp(formData.email, formData.password);
            const user = userCredential.user;

            try {
                const patientsRef = collection(db, 'patients');
                const emailQuery = query(patientsRef, where('email', '==', formData.email));
                const emailCheckSnapshot = await getDocs(emailQuery);

                if (!emailCheckSnapshot.empty) {
                    await user.delete();
                    setFieldErrors(prev => ({
                        ...prev,
                        email: 'Este correo ya existe en el sistema.'
                    }));
                    setIsLoading(false);
                    return;
                }

                const patientData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    registrationSource: 'online' as const,
                    isOnline: true,
                    birthDate: '',
                    ageDetails: '',
                    sex: '',
                    profession: '',
                    address: '',
                    initialReason: '',
                    createdAt: new Date().toISOString(),
                    registrationStatus: 'Proceso1',
                    registrationMessage: 'Ficha clínica no completada'
                };

                const createdPatient = await api.createPatient(patientData as any);
                localStorage.setItem('currentPatient', JSON.stringify(createdPatient));
                navigate('/app/patient/dashboard');

            } catch (dbError) {
                console.error("Error en base de datos:", dbError);
                await user.delete().catch(() => { });
                setGeneralError('Error al guardar sus datos. Intente nuevamente.');
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setFieldErrors(prev => ({ ...prev, email: 'Este correo electrónico ya está registrado.' }));
            } else if (err.code === 'auth/weak-password') {
                setGeneralError('La contraseña es muy débil.');
            } else {
                setGeneralError('Error al registrarse: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Estilo del wrapper consistente con RegisterScreen
    const wrapperClass = "border-2 border-gray-900 bg-white";
    const errorWrapperClass = "border-2 border-red-500 bg-white";

    return (
        <div className="min-h-screen py-6 px-4 flex items-center justify-center font-sans relative" style={{ backgroundColor: '#083c79' }}>
            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[10%] left-[-5%] w-[25%] h-[25%] bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-white/10 relative z-10">
                <div className="absolute top-4 right-4 z-10">
                    <LanguageSwitcher />
                </div>
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div className="flex-1 text-center pl-10">
                            <img
                                src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_10,y_7,w_390,h_61/fill/w_545,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                                alt="Logo Dr. Milton Mairena Valle"
                                className="h-10 md:h-12 object-contain mx-auto mb-2"
                            />
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{t('auth.patient_register_title')}</h2>
                            <p className="text-xs md:text-sm text-gray-500 font-medium">{t('auth.patient_register_subtitle')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/app/patient/login')}
                            className="bg-[#083c79] hover:bg-[#062a54] p-2 rounded-lg text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Row 1: Nombre y Apellido */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className={`rounded-xl px-4 py-3 ${fieldErrors.firstName ? errorWrapperClass : wrapperClass}`}>
                                    <label className="block text-xs text-gray-500 font-medium mb-1">{t('auth.first_name')}</label>
                                    <div className="flex items-center gap-2">
                                        <User className={`w-5 h-5 ${fieldErrors.firstName ? 'text-red-400' : 'text-[#084286]'}`} />
                                        <input
                                            required
                                            className="flex-1 text-gray-900 font-semibold bg-transparent outline-none placeholder-gray-400"
                                            placeholder="Ej: Juan"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            onBlur={handleFirstNameBlur}
                                        />
                                    </div>
                                </div>
                                {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{fieldErrors.firstName}</p>}
                            </div>
                            <div>
                                <div className={`rounded-xl px-4 py-3 ${fieldErrors.lastName ? errorWrapperClass : wrapperClass}`}>
                                    <label className="block text-xs text-gray-500 font-medium mb-1">{t('auth.last_name')}</label>
                                    <div className="flex items-center gap-2">
                                        <User className={`w-5 h-5 ${fieldErrors.lastName ? 'text-red-400' : 'text-[#084286]'}`} />
                                        <input
                                            required
                                            className="flex-1 text-gray-900 font-semibold bg-transparent outline-none placeholder-gray-400"
                                            placeholder="Ej: Pérez"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            onBlur={handleLastNameBlur}
                                        />
                                    </div>
                                </div>
                                {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{fieldErrors.lastName}</p>}
                            </div>
                        </div>

                        {/* Row 2: Email y Teléfono */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className={`rounded-xl px-4 py-3 ${fieldErrors.email ? errorWrapperClass : wrapperClass}`}>
                                    <label className="block text-xs text-gray-500 font-medium mb-1">{t('auth.email')}</label>
                                    <div className="flex items-center gap-2">
                                        <Mail className={`w-5 h-5 ${fieldErrors.email ? 'text-red-400' : 'text-[#084286]'}`} />
                                        <input
                                            type="email"
                                            required
                                            className="flex-1 text-gray-900 font-semibold bg-transparent outline-none placeholder-gray-400"
                                            placeholder="ejemplo@correo.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            onBlur={handleEmailBlur}
                                        />
                                    </div>
                                </div>
                                {fieldErrors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{fieldErrors.email}</p>}
                            </div>
                            <div>
                                <div className={`rounded-xl px-4 py-3 ${fieldErrors.phone ? errorWrapperClass : wrapperClass}`}>
                                    <label className="block text-xs text-gray-500 font-medium mb-1">{t('auth.phone')}</label>
                                    <div className="flex items-center gap-2">
                                        <Phone className={`w-5 h-5 ${fieldErrors.phone ? 'text-red-400' : 'text-[#084286]'}`} />
                                        <input
                                            type="tel"
                                            required
                                            className="flex-1 text-gray-900 font-semibold bg-transparent outline-none placeholder-gray-400"
                                            placeholder="50588888888"
                                            value={formData.phone}
                                            onChange={e => handlePhoneChange(e.target.value)}
                                            onBlur={handlePhoneBlur}
                                        />
                                    </div>
                                </div>
                                {fieldErrors.phone && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{fieldErrors.phone}</p>}
                            </div>
                        </div>

                        {/* Row 3: Contraseñas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className={`rounded-xl px-4 py-3 ${fieldErrors.password ? errorWrapperClass : wrapperClass}`}>
                                    <label className="block text-xs text-gray-500 font-medium mb-1">{t('auth.password')}</label>
                                    <div className="flex items-center gap-2">
                                        <Lock className={`w-5 h-5 ${fieldErrors.password ? 'text-red-400' : 'text-[#084286]'}`} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="flex-1 text-gray-900 font-semibold bg-transparent outline-none"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            onBlur={handlePasswordBlur}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-[#084286] hover:text-[#063266]"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <p className={`text-xs mt-1 ml-1 ${fieldErrors.password ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                    {fieldErrors.password || t('auth.password_requirements')}
                                </p>
                            </div>
                            <div>
                                <div className={`rounded-xl px-4 py-3 ${fieldErrors.confirmPassword ? errorWrapperClass : wrapperClass}`}>
                                    <label className="block text-xs text-gray-500 font-medium mb-1">{t('auth.confirm_password')}</label>
                                    <div className="flex items-center gap-2">
                                        <Lock className={`w-5 h-5 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-[#084286]'}`} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            className="flex-1 text-gray-900 font-semibold bg-transparent outline-none"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            onBlur={handleConfirmPasswordBlur}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="text-[#084286] hover:text-[#063266]"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{fieldErrors.confirmPassword}</p>}
                            </div>
                        </div>

                        {generalError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 font-medium">
                                {generalError}
                            </div>
                        )}

                        {/* Submit Button - Same style as RegisterScreen */}
                        <div className="flex justify-center mt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !!fieldErrors.firstName || !!fieldErrors.lastName || !!fieldErrors.email || !!fieldErrors.phone || !!fieldErrors.password || !!fieldErrors.confirmPassword}
                                className="px-12 bg-[#083c79] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#062a54] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <User size={20} />
                                        {t('auth.register')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="pb-6 text-center">
                    <p className="text-gray-500 text-sm">
                        {t('auth.already_have_account')}{' '}
                        <button onClick={() => navigate('/app/patient/login')} className="text-[#083c79] font-bold hover:underline">
                            {t('auth.login_here')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};