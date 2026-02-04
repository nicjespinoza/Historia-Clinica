import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Stethoscope, Users, User, Lock, MapPin, AlertTriangle, ChevronRight, Loader2, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { FloatingLabelInput } from '../../components/premium-ui/FloatingLabelInput';

export const StaffPortalScreen = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [accessStatus, setAccessStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');
    const [clientIp, setClientIp] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    // Login State
    const [selectedRole, setSelectedRole] = useState<'doctor' | 'assistant' | 'reception' | null>(null);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            const checkSystemAccess = httpsCallable(functions, 'checkSystemAccess');
            const result = await checkSystemAccess();
            const data = result.data as any;

            if (data.allowed) {
                setAccessStatus('allowed');
                setClientIp(data.ip);
            } else {
                setAccessStatus('denied');
                setClientIp(data.ip);
                setErrorMsg(data.reason || 'Ubicación no autorizada.');
            }
        } catch (error) {
            console.error('Error verifying access:', error);
            // Default to denied for security, revert if testing needed
            setAccessStatus('denied');
            setErrorMsg('Error de conexión o configuración.');
        }
    };

    const handleRoleSelect = (role: 'doctor' | 'assistant' | 'reception') => {
        if (accessStatus !== 'allowed') return;
        if (selectedRole === role) {
            setSelectedRole(null); // Deselect if verified
        } else {
            setSelectedRole(role);
            setEmail('');
            setPass('');
            setLoginError('');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        try {
            await signIn(email, pass);

            // Redirect based on selected role
            if (selectedRole === 'doctor') {
                navigate('/app');
            } else if (selectedRole === 'assistant' || selectedRole === 'reception') {
                navigate('/app/assistant');
            }
        } catch (err: any) {
            console.error(err);
            setLoginError('Credenciales incorrectas o error de acceso.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (accessStatus === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Validando Acceso al Sistema</h2>
                <p className="text-gray-500">Verificando seguridad y ubicación...</p>
                <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                    <Shield size={16} />
                    <span>Conexión Segura TLS 1.3</span>
                </div>
            </div>
        );
    }

    if (accessStatus === 'denied') {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-red-600 p-6 text-center">
                        <Shield size={48} className="text-white mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white">Acceso Restringido</h1>
                    </div>
                    <div className="p-8 text-center space-y-6">
                        <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 text-left">
                            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-bold text-sm">Ubicación No Autorizada</p>
                                <p className="text-xs mt-1">Su dirección IP ({clientIp}) no está registrada en la lista blanca de seguridad del sistema.</p>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm">
                            Este portal es para uso exclusivo del personal autorizado dentro de las instalaciones clínicas o redes privadas aprobadas.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                            Reintentar Conexión
                        </button>

                        <div className="pt-6 border-t border-gray-100 flex justify-center gap-4 text-xs text-gray-400">
                            <span>ID: {clientIp}</span>
                            <span>•</span>
                            <span>V 2.0.1</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Colors for roles
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'doctor': return 'blue';
            case 'assistant': return 'purple';
            case 'reception': return 'teal';
            default: return 'gray';
        }
    };


    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* Left Side - Brand/Image (White Background) */}
            <div className="lg:w-1/2 p-6 lg:p-12 flex flex-col bg-white relative overflow-hidden min-h-screen">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 z-50 flex items-center gap-2 text-gray-500 hover:text-[#083c79] transition-colors p-2 rounded-lg hover:bg-gray-50"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium text-sm">Regresar</span>
                </button>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 z-0"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50 z-0"></div>

                <div className="z-10 relative w-full max-w-lg mx-auto flex flex-col h-full">

                    {/* Logo Section - Arriba */}
                    <div className="pt-8 lg:pt-12 flex justify-center">
                        <img
                            src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                            alt="Dr. Milton Mairena Valle"
                            className="h-16 md:h-20 w-auto object-contain"
                        />
                    </div>

                    {/* Main Title Section - Centro absoluto */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                            Portal Administrativo<br />
                            <span className="text-[#083c79]">Centralizado</span>
                        </h1>
                    </div>

                    {/* Bottom Section - Badge y Copyright abajo */}
                    <div className="pb-8 lg:pb-12 flex flex-col items-center space-y-6">

                        {/* Connection Status Badge */}
                        <div className="flex items-center gap-3 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-6 py-3 rounded-full shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <Shield size={16} />
                            <span>Conexión Autorizada: {clientIp}</span>
                        </div>

                        {/* Divider */}
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#083c79] to-transparent opacity-20"></div>

                        {/* Footer Copyright */}
                        <div className="text-center space-y-1">
                            <p className="text-sm text-gray-400 font-medium tracking-wide">
                                © 2026 Sistema CENLAE. Todos los derechos reservados.
                            </p>
                            <p className="text-xs text-gray-300">
                                v2.0.1 • Secure TLS 1.3
                            </p>
                        </div>

                        {/* Made with love - WhatsApp Link */}
                        <a
                            href="https://wa.me/50589776879?text=Hola%2C%20Joseph%20me%20gustaria%20saber%20mas%20de%20tus%20Servicios%20de%20desarrollo%20Web"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-[#083c79] transition-colors duration-300 flex items-center gap-1.5 group mt-4"
                        >
                            <span>Hecho con</span>
                            <span className="text-red-500 group-hover:scale-110 transition-transform duration-300 text-base">♥</span>
                            <span>en Nicaragua</span>
                        </a>
                    </div>

                </div>
            </div>

            {/* Right Side - Role Selection (Blue Background) */}
            <div className="lg:w-1/2 bg-[#083c79] p-6 lg:p-12 flex items-center justify-center relative overflow-hidden">
                {/* Decorative background visual for the blue side */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/4"></div>
                </div>

                <div className="max-w-md w-full space-y-8 relative z-10">

                    <div className="text-center lg:text-left mb-8">
                        <h3 className="text-xl font-bold text-white">Seleccione su Perfil</h3>

                    </div>

                    <div className="space-y-4">
                        {/* Doctor Card */}
                        <RoleCard
                            role="doctor"
                            title="Personal Médico"
                            subtitle="Doctores y especialistas"
                            icon={<Stethoscope size={28} />}
                            isSelected={selectedRole === 'doctor'}
                            onSelect={() => handleRoleSelect('doctor')}
                            color="blue"
                            children={selectedRole === 'doctor' && (
                                <LoginForm
                                    email={email} setEmail={setEmail}
                                    pass={pass} setPass={setPass}
                                    showPassword={showPassword} setShowPassword={setShowPassword}
                                    error={loginError} setError={setLoginError}
                                    loading={isLoggingIn}
                                    onSubmit={handleLogin}
                                    requiredEmail="dr@cenlae.com"
                                />
                            )}
                        />

                        {/* Assistant Card */}
                        <RoleCard
                            role="assistant"
                            title="Administración"
                            subtitle="Asistentes y Auxiliares"
                            icon={<Users size={28} />}
                            isSelected={selectedRole === 'assistant'}
                            onSelect={() => handleRoleSelect('assistant')}
                            color="purple"
                            children={selectedRole === 'assistant' && (
                                <LoginForm
                                    email={email} setEmail={setEmail}
                                    pass={pass} setPass={setPass}
                                    showPassword={showPassword} setShowPassword={setShowPassword}
                                    error={loginError} setError={setLoginError}
                                    loading={isLoggingIn}
                                    onSubmit={handleLogin}
                                    requiredEmail="asistente@cenlae.com"
                                />
                            )}
                        />

                        {/* Reception Card */}
                        <RoleCard
                            role="reception"
                            title="Recepción"
                            subtitle="Atención al Paciente"
                            icon={<User size={28} />}
                            isSelected={selectedRole === 'reception'}
                            onSelect={() => handleRoleSelect('reception')}
                            color="teal"
                            children={selectedRole === 'reception' && (
                                <LoginForm
                                    email={email} setEmail={setEmail}
                                    pass={pass} setPass={setPass}
                                    showPassword={showPassword} setShowPassword={setShowPassword}
                                    error={loginError} setError={setLoginError}
                                    loading={isLoggingIn}
                                    onSubmit={handleLogin}
                                    requiredEmail="recepcion@cenlae.com" // Inferring for consistency
                                />
                            )}
                        />
                    </div>

                    <div className="pt-8 border-t border-blue-800">
                        <div className="flex items-center justify-center gap-2 text-xs text-blue-300">
                            <Lock size={12} />
                            <span>Acceso monitoreado y registrado por IP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components for cleaner code

interface RoleCardProps {
    role: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onSelect: () => void;
    children?: React.ReactNode;
    color: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, subtitle, icon, isSelected, onSelect, children, color }) => {
    return (
        <motion.div
            layout
            initial={false}
            animate={{
                backgroundColor: isSelected ? 'white' : 'white',
                scale: isSelected ? 1.02 : 1
            }}
            className={`w-full rounded-2xl overflow-hidden shadow-sm transition-all ${isSelected ? 'shadow-xl' : 'shadow-md border border-gray-200'}`}
        >
            <button
                onClick={onSelect}
                className="w-full p-6 text-left flex items-center gap-5 focus:outline-none"
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shrink-0
                    ${isSelected ? `bg-${color}-50 text-${color}-600` : `bg-${color}-50 text-${color}-600`}
                `}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className={`text-lg font-bold transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>{title}</h4>
                    <p className={`text-sm transition-colors ${isSelected ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
                </div>
                <ChevronRight className={`transition-transform duration-300 ${isSelected ? 'rotate-90 text-gray-400' : 'text-gray-400'}`} />
            </button>

            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 pb-6 pt-0">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

interface LoginFormProps {
    email: string; setEmail: (v: string) => void;
    pass: string; setPass: (v: string) => void;
    showPassword: boolean; setShowPassword: (v: boolean) => void;
    error: string; setError: (v: string) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    requiredEmail?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ email, setEmail, pass, setPass, showPassword, setShowPassword, error, setError, loading, onSubmit, requiredEmail }) => {

    // Check if email matches requirement
    const isValidEmail = !requiredEmail || email === requiredEmail;

    return (
        <form onSubmit={onSubmit} className="space-y-4 mt-2">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <FloatingLabelInput
                    label="Correo Electrónico"
                    type="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    icon={<Mail size={18} />}
                    containerClassName="!mb-0"
                />

                <div className="relative">
                    <FloatingLabelInput
                        label="Contraseña"
                        type={showPassword ? "text" : "password"}
                        required
                        value={pass}
                        onChange={e => { setPass(e.target.value); setError(''); }}
                        icon={<Lock size={18} />}
                        containerClassName="!mb-0"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !isValidEmail}
                className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-2
                    ${isValidEmail && !loading
                        ? 'bg-[#083c79] hover:bg-blue-900 text-white shadow-blue-900/20 active:scale-[0.98]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Ingresar al Portal'}
            </button>
            {!isValidEmail && email.length > 0 && (
                <p className="text-xs text-red-500 text-center mt-1">
                    Ingrese el Correo Electrónico Asignado para acceder al Portal
                </p>
            )}
        </form>
    );
};
