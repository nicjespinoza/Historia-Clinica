import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MessageCircle, FileText, Lock, CheckCircle, AlertCircle, RefreshCw, X, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updatePassword, getAuth } from 'firebase/auth';
import { toast } from 'sonner';
import { useChatStore } from '../../store/chatStore';

export const DoctorHomeScreen = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const auth = getAuth();
    const chats = useChatStore(state => state.activeChats);

    // Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Password Change State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [assistantPassword, setAssistantPassword] = useState('');
    const [confirmAssistantPassword, setConfirmAssistantPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingAssistant, setLoadingAssistant] = useState(false);

    const isDrMilton = currentUser?.email === 'dr@cenlae.com';

    // Calculate unread chats (active chats with unread messages)
    const unreadChatsCount = chats.filter(c => c.status === 'active' && c.unreadCount > 0).length;

    const menuItems = [
        {
            title: 'Mis Pacientes',
            path: '/app/patients',
            icon: <Users size={64} className="text-blue-600 drop-shadow-sm" />,
            color: 'hover:border-blue-500 hover:shadow-blue-500/30',
            bgColor: 'bg-white'
        },
        {
            title: 'Agenda',
            path: '/app/agenda',
            icon: <Calendar size={64} className="text-orange-500 drop-shadow-sm" />,
            color: 'hover:border-orange-500 hover:shadow-orange-500/30',
            bgColor: 'bg-white'
        },
        {
            title: 'Chat',
            path: '/app/chat',
            icon: <MessageCircle size={64} className="text-green-600 drop-shadow-sm" />,
            color: 'hover:border-green-500 hover:shadow-green-500/30',
            bgColor: 'bg-white',
            badge: unreadChatsCount > 0 ? unreadChatsCount : null
        },
        {
            title: 'Reportes',
            path: '/app/reports',
            icon: <FileText size={64} className="text-purple-600 drop-shadow-sm" />,
            color: 'hover:border-purple-500 hover:shadow-purple-500/30',
            bgColor: 'bg-white'
        },
    ];

    const handleUpdateMyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mínimo 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await updatePassword(user, newPassword);
                toast.success('Contraseña personal actualizada');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            toast.error(error.message);
            if (error.code === 'auth/requires-recent-login') {
                toast.error('Por favor cierre sesión e inicie nuevamente para cambiar la contraseña.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAssistantPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (assistantPassword !== confirmAssistantPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        if (assistantPassword.length < 6) {
            toast.error('Mínimo 6 caracteres');
            return;
        }

        setLoadingAssistant(true);
        // Simulate API Call delay
        setTimeout(() => {
            toast.error('No se pudo actualizar asistente: Requiere permisos de admin o función cloud.');
            setLoadingAssistant(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center font-sans overflow-hidden p-4 md:p-10" style={{ backgroundColor: '#0A4A88' }}>

            {/* Background Decorative Elements (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px]" />
            </div>

            {/* Header Area */}
            <div className="w-full max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="text-center md:text-left mb-6 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md flex items-center justify-center md:justify-start gap-3">
                        <Users className="w-10 h-10 md:w-12 md:h-12 text-blue-100" />
                        Bienvenido
                    </h1>
                    <p className="text-blue-100 text-lg font-medium opacity-90">Dr. Milton Mairena</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-0 relative z-20">
                    {/* Password Change Button (Dr Only) */}
                    {isDrMilton && (
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 group text-sm whitespace-nowrap"
                        >
                            <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                                <KeyRound size={18} />
                            </div>
                            <span>Cambio Contraseña</span>
                        </button>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={async () => {
                            try {
                                await logout();
                                navigate('/');
                            } catch (e) { console.error(e); }
                        }}
                        className="bg-red-500/80 hover:bg-red-600 text-white border border-red-400/30 backdrop-blur-sm px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 group text-sm whitespace-nowrap"
                    >
                        <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                            <LogOut size={18} />
                        </div>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Main Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-8 relative z-10 flex-1 content-center">
                {menuItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(item.path)}
                        className={`relative ${item.bgColor} rounded-[2rem] p-6 flex flex-col items-center justify-center gap-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-4 border-transparent ${item.color} group aspect-square md:aspect-auto md:h-72`}
                    >
                        {/* Elegant Unread Badge */}
                        {item.badge && (
                            <div className="absolute top-6 right-6 z-20">
                                <span className="relative flex h-8 w-8">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-8 w-8 bg-red-500 text-white text-sm font-bold items-center justify-center border-2 border-white shadow-sm">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                </span>
                            </div>
                        )}

                        <div className="p-6 bg-gray-50 rounded-full shadow-inner ring-1 ring-gray-100 group-hover:bg-blue-50 transition-colors relative z-10">
                            {item.icon}
                        </div>
                        <span className="text-2xl font-bold text-gray-800 text-center tracking-tight group-hover:text-blue-700 transition-colors relative z-10">
                            {item.title}
                        </span>

                        {/* Hover Effect Background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-white opacity-0 group-hover:opacity-100 rounded-[1.8rem] transition-opacity duration-500 pointer-events-none" />
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="relative z-10 text-white/40 text-xs font-medium tracking-wide mt-auto pt-8">
                © 2026 HC JE v2.0.0
            </div>

            {/* MODAL: Password Management */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowPasswordModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300 transform scale-100">
                        {/* Modal Header */}
                        <div className="bg-[#0A4A88] p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Gestión de Credenciales</h3>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-gray-100">

                                {/* Section 1: Doctor Password */}
                                <form onSubmit={handleUpdateMyPassword} className="space-y-5 px-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Users size={16} />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-800">Mi Contraseña (Dr)</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !newPassword}
                                        className="w-full mt-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle size={20} />}
                                        Actualizar Mi Clave
                                    </button>
                                </form>

                                {/* Section 2: Assistant Password */}
                                <form onSubmit={handleUpdateAssistantPassword} className="space-y-5 px-2 md:pl-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Users size={16} />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-800">Contraseña Asistente</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={assistantPassword}
                                                onChange={(e) => setAssistantPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-600 mb-1">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                value={confirmAssistantPassword}
                                                onChange={(e) => setConfirmAssistantPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loadingAssistant || !assistantPassword}
                                        className="w-full mt-2 bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loadingAssistant ? <RefreshCw className="animate-spin" /> : <AlertCircle size={20} />}
                                        Actualizar Asistente
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
