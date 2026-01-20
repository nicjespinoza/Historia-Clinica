import React, { useState } from 'react';
import { ArrowLeft, UserPlus, User, Mail, Phone, MapPin, Briefcase, Calendar, Heart, Globe, Users, Thermometer, Scale, Ruler, Activity, Save } from 'lucide-react';
import { Patient } from '../types';
import { api } from '../lib/api';
import { calculateAge } from '../lib/helpers';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormData, getDefaultPatientValues } from '../schemas/patientSchemas';

export const RegisterScreen = () => {
    const navigate = useNavigate();
    const [showVitalSigns, setShowVitalSigns] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema) as any, // Type cast for Zod v4 compatibility
        defaultValues: {
            ...getDefaultPatientValues(),
            sex: '' as any // Sin valor por defecto
        },
        mode: 'onBlur'
    });

    const birthDate = watch('birthDate');
    const calculatedAge = birthDate ? calculateAge(birthDate) : '';
    const weight = watch('vitalSigns.weight');
    const height = watch('vitalSigns.height');

    const calculatedIMC = React.useMemo(() => {
        if (weight && height) {
            const w = parseFloat(weight);
            const h = parseFloat(height) / 100;
            if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
        }
        return '';
    }, [weight, height]);

    const onSubmit = async (data: PatientFormData) => {
        const patientData: Patient = {
            id: '',
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: data.birthDate,
            ageDetails: calculateAge(data.birthDate),
            sex: data.sex,
            nationality: data.nationality,
            profession: data.profession,
            email: data.email,
            phone: data.phone,
            phoneSecondary: data.phoneSecondary,
            address: data.address,
            initialReason: data.initialReason,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactEmail: data.emergencyContactEmail,
            emergencyContactRelation: data.emergencyContactRelation,
            createdAt: new Date().toISOString(),
            registrationSource: 'manual',
            vitalSigns: showVitalSigns ? { ...data.vitalSigns!, imc: calculatedIMC } : undefined
        };

        try {
            const createdPatient = await api.createPatient(patientData);
            // setPatients(prev => [...prev, createdPatient]); // State update no longer needed, using cache validation
            navigate(`/app/history/${createdPatient.id}`);
        } catch (e) {
            console.error(e);
            alert("Error al guardar paciente");
        }
    };

    // Componente de Input con icono (estilo dashboard)
    const InputWithIcon = ({
        label, icon: Icon, placeholder, error, required, children, className = ''
    }: {
        label: string; icon: any; placeholder?: string; error?: string; required?: boolean; children?: React.ReactNode; className?: string;
    }) => (
        <div className={className}>
            <label className="block text-sm font-semibold text-[#0a3d7c] mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`flex items-center gap-2 border-2 ${error ? 'border-red-400' : 'border-gray-300'} rounded-xl px-3 py-2.5 bg-white hover:border-[#0a3d7c] focus-within:border-[#0a3d7c] transition-colors`}>
                <Icon className="w-5 h-5 text-[#0a3d7c] flex-shrink-0" />
                {children}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );

    return (
        <div className="min-h-screen py-4 px-4 flex items-center justify-center font-sans relative" style={{ backgroundColor: '#083c79' }}>
            <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[10%] left-[-5%] w-[25%] h-[25%] bg-purple-500/10 rounded-full blur-[80px]" />

            <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-white/10 relative z-10">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <button
                            type="button"
                            onClick={() => navigate('/app/patients')}
                            className="bg-gray-50 hover:bg-gray-100 p-2 rounded-lg text-gray-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Ficha Clínica - Nuevo Paciente</h2>
                            <p className="text-sm text-gray-500">Complete la información del expediente</p>
                        </div>
                    </div>

                    {/* DATOS PERSONALES */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-[#0a3d7c] uppercase mb-3 flex items-center gap-2">
                            <User size={16} /> Datos Personales
                        </h3>

                        {/* Row 1: Nombre, Apellidos, Fecha Nac, Edad */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <Controller
                                name="firstName"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Nombre" icon={User} required error={errors.firstName?.message}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. Juan"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="lastName"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Apellidos" icon={User} required error={errors.lastName?.message}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. Pérez"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="birthDate"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Fecha de Nacimiento" icon={Calendar} required error={errors.birthDate?.message}>
                                        <input
                                            type="date"
                                            className={`flex-1 outline-none bg-transparent ${field.value ? 'text-gray-800' : 'text-gray-400'}`}
                                            placeholder="Seleccione fecha"
                                            style={{
                                                colorScheme: 'light'
                                            }}
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <InputWithIcon label="Edad Calculada" icon={Calendar}>
                                <span className="flex-1 text-gray-500">{calculatedAge || 'Automático'}</span>
                            </InputWithIcon>
                        </div>

                        {/* Row 2: Sexo, Profesión, Nacionalidad, Tel Secundario */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <Controller
                                name="sex"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Sexo" icon={Heart} required error={errors.sex?.message}>
                                        <select
                                            className="flex-1 outline-none text-gray-800 bg-transparent"
                                            {...field}
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                        </select>
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="profession"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Profesión/Ocupación" icon={Briefcase}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. Ingeniero"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="nationality"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="País de Nacionalidad" icon={Globe}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. Nicaragua"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="phoneSecondary"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Teléfono Secundario" icon={Phone}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. 50588888888"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />
                        </div>

                        {/* Row 3: Email, Teléfono, Dirección (más ancha) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Email" icon={Mail} error={errors.email?.message}>
                                        <input
                                            type="email"
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="correo@ejemplo.com"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Teléfono Principal" icon={Phone}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. 50588888888"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Dirección" icon={MapPin} className="sm:col-span-2">
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Dirección completa"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />
                        </div>
                    </div>

                    {/* CONTACTO DE EMERGENCIA */}
                    <div className="mb-6 bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                        <h3 className="text-sm font-bold text-orange-700 uppercase mb-3 flex items-center gap-2">
                            <Users size={16} /> Contacto de Emergencia
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Controller
                                name="emergencyContactName"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Nombre Completo" icon={User}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Nombre del contacto"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="emergencyContactRelation"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Relación" icon={Users}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Familiar, Amistad..."
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="emergencyContactPhone"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Teléfono del Contacto" icon={Phone}>
                                        <input
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="Ej. 50588888888"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />

                            <Controller
                                name="emergencyContactEmail"
                                control={control}
                                render={({ field }) => (
                                    <InputWithIcon label="Correo de Contacto" icon={Mail}>
                                        <input
                                            type="email"
                                            className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                                            placeholder="correo@ejemplo.com"
                                            {...field}
                                        />
                                    </InputWithIcon>
                                )}
                            />
                        </div>
                    </div>

                    {/* MOTIVO DE CONSULTA */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-[#0a3d7c] mb-1.5">
                            Motivo de Consulta (Inicial)
                        </label>
                        <Controller
                            name="initialReason"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    rows={2}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 outline-none text-gray-800 placeholder-gray-400 hover:border-[#0a3d7c] focus:border-[#0a3d7c] transition-colors resize-none"
                                    placeholder="Describa brevemente el motivo de la consulta..."
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    {/* SIGNOS VITALES (Toggle) */}
                    <div className="mb-6 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-blue-700 uppercase flex items-center gap-2">
                                <Activity size={16} /> Signos Vitales
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowVitalSigns(!showVitalSigns)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${showVitalSigns ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                            >
                                {showVitalSigns ? 'Ocultar' : 'Agregar'}
                            </button>
                        </div>

                        {showVitalSigns && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                {[
                                    { name: 'vitalSigns.fc', label: 'FC (lpm)', placeholder: '70' },
                                    { name: 'vitalSigns.fr', label: 'FR (rpm)', placeholder: '16' },
                                    { name: 'vitalSigns.temp', label: 'Temp (°C)', placeholder: '36.5' },
                                    { name: 'vitalSigns.pa', label: 'PA (mmHg)', placeholder: '120/80' },
                                    { name: 'vitalSigns.pam', label: 'PAM', placeholder: '93' },
                                    { name: 'vitalSigns.sat02', label: 'SatO2 (%)', placeholder: '98' },
                                    { name: 'vitalSigns.weight', label: 'Peso (kg)', placeholder: '70' },
                                    { name: 'vitalSigns.height', label: 'Talla (cm)', placeholder: '170' },
                                ].map(({ name, label, placeholder }) => (
                                    <Controller
                                        key={name}
                                        name={name as any}
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                                <input
                                                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 outline-none text-gray-800 placeholder-gray-400 text-sm hover:border-[#0a3d7c] focus:border-[#0a3d7c]"
                                                    placeholder={placeholder}
                                                    {...field}
                                                />
                                            </div>
                                        )}
                                    />
                                ))}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">IMC (auto)</label>
                                    <div className="w-full border-2 border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-gray-600 font-bold text-sm">
                                        {calculatedIMC || '—'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BOTÓN GUARDAR */}
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#0a3d7c] text-white px-12 py-3.5 rounded-xl font-bold text-base hover:bg-[#083060] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar y Continuar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
