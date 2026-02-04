import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { FloatingLabelInput } from '../../components/premium-ui/FloatingLabelInput';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginScreenProps {
    onLogin: (email: string) => void;
    onPatientAccess: () => void;
    initialRole?: 'clinic' | 'doctor' | 'assistant';
}

export const LoginScreen = ({ initialRole }: LoginScreenProps) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useAuth();

    const getRoleTitle = () => {
        if (initialRole === 'doctor') return 'Personal Médico';
        if (initialRole === 'assistant') return 'Administración'; // Map assistant string if needed, or stick to 'clinic'/'doctor' types
        return 'Acceso al Sistema';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signIn(email, pass);
        } catch (err: any) {
            console.error(err);
            setError('Error al iniciar sesión: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cenlae-primary p-4 font-sans relative overflow-hidden">
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-xl border border-white/50 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">

                    <div className="text-center mb-10">
                        <img
                            src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                            alt="Dr. Milton Mairena Valle"
                            className="h-16 md:h-20 w-auto mx-auto object-contain mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                            {getRoleTitle()}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium text-center border border-red-100 flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <FloatingLabelInput
                                label="Correo Electrónico"
                                type="email"
                                required
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                icon={<Mail size={20} />}
                                error={error ? " " : undefined}
                                containerClassName="!mb-0"
                            />

                            <div className="relative">
                                <FloatingLabelInput
                                    label="Contraseña"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={pass}
                                    onChange={e => { setPass(e.target.value); setError(''); }}
                                    icon={<Lock size={20} />}
                                    error={error ? " " : undefined}
                                    containerClassName="!mb-0"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cenlae-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-cenlae-primary hover:bg-[#0d3d6e] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98] text-lg"
                        >
                            Ingresar al Sistema
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} /> Salir
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
