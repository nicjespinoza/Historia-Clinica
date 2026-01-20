import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Users, Clock, Activity, TrendingUp,
    UserPlus, FileText, Stethoscope, ChevronRight,
    CheckCircle, AlertCircle, Video, MapPin, DollarSign
} from 'lucide-react';
import { api } from '../lib/api';
import { Patient, Appointment, InitialHistory, SubsequentConsult } from '../types';

interface QuickStat {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

export const DoctorHomeScreen = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [histories, setHistories] = useState<InitialHistory[]>([]);
    const [consults, setConsults] = useState<SubsequentConsult[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStage, setLoadingStage] = useState<string>('Iniciando...');

    useEffect(() => {
        loadDataProgressive();
    }, []);

    // Progressive loading - show data as it arrives for faster perceived performance
    const loadDataProgressive = async () => {
        try {
            // Stage 1: Load appointments first (most critical for today's view)
            setLoadingStage('Cargando citas...');
            const appointmentsData = await api.getAppointments();
            setAppointments(appointmentsData);

            // Stage 2: Load patients (needed for appointment display)
            setLoadingStage('Cargando pacientes...');
            const patientsData = await api.getPatients();
            setPatients(patientsData);

            // Mark as loaded - main content is ready
            setLoading(false);

            // Stage 3: Load histories in background (for billing stats)
            const historiesData = await api.getHistories();
            setHistories(historiesData);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setLoading(false);
        }
    };

    // Today's date
    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString('es-NI', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Today's appointments
    const todayAppointments = useMemo(() =>
        appointments
            .filter(a => a.date === today)
            .sort((a, b) => a.time.localeCompare(b.time)),
        [appointments, today]
    );

    // Upcoming appointments (next 7 days)
    const upcomingCount = useMemo(() => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return appointments.filter(a => {
            const aptDate = new Date(a.date + 'T12:00:00');
            return aptDate >= new Date() && aptDate <= nextWeek;
        }).length;
    }, [appointments]);

    // Stats
    const stats: QuickStat[] = [
        {
            label: 'Pacientes Totales',
            value: patients.length,
            icon: <Users size={24} />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            label: 'Citas Hoy',
            value: todayAppointments.length,
            icon: <Calendar size={24} />,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            label: 'Próximos 7 días',
            value: upcomingCount,
            icon: <Clock size={24} />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            label: 'Historias Clínicas',
            value: histories.length,
            icon: <FileText size={24} />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ];

    // Recent patients (last 5)
    const recentPatients = useMemo(() =>
        [...patients]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
        [patients]
    );

    // Billing statistics
    const billingStats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Start of week (Monday)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        // Start of month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        // Calculate earnings from histories with consultationCost
        let todayEarnings = 0;
        let weekEarnings = 0;
        let monthEarnings = 0;
        let todayConsults = 0;
        let weekConsults = 0;
        let monthConsults = 0;

        histories.forEach(h => {
            const cost = (h as any).consultationCost || 0;
            const date = h.date;

            if (date >= monthStartStr) {
                monthEarnings += cost;
                monthConsults++;
            }
            if (date >= weekStartStr) {
                weekEarnings += cost;
                weekConsults++;
            }
            if (date === todayStr) {
                todayEarnings += cost;
                todayConsults++;
            }
        });

        return {
            todayEarnings,
            weekEarnings,
            monthEarnings,
            todayConsults,
            weekConsults,
            monthConsults
        };
    }, [histories]);

    // Quick actions
    const quickActions = [
        { label: 'Ver Pacientes', icon: <Users size={20} />, path: '/app/patients', color: 'bg-blue-600 hover:bg-blue-700' },
        { label: 'Nueva Cita', icon: <Calendar size={20} />, path: '/app/agenda', color: 'bg-green-600 hover:bg-green-700' },
        { label: 'Registrar Paciente', icon: <UserPlus size={20} />, path: '/app/register', color: 'bg-purple-600 hover:bg-purple-700' },
        { label: 'Ver Reportes', icon: <TrendingUp size={20} />, path: '/app/reports', color: 'bg-orange-600 hover:bg-orange-700' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#083c79] to-[#0a5199] flex items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20">
                    <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-white text-xl font-bold mb-2">Preparando Dashboard</h2>
                    <p className="text-blue-200 font-medium animate-pulse">{loadingStage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#083c79] to-[#0a5199] rounded-2xl p-6 md:p-8 text-white shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">¡Bienvenido, Doctor!</h1>
                            <p className="text-blue-100 capitalize">{todayFormatted}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <Activity size={32} className="text-green-400" />
                            <div>
                                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                                <p className="text-sm text-blue-200">citas programadas hoy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
                                <span className={stat.color}>{stat.icon}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Today's Appointments */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="text-green-600" size={20} />
                                Citas de Hoy
                            </h2>
                            <button
                                onClick={() => navigate('/app/agenda')}
                                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                            >
                                Ver agenda <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="p-5">
                            {todayAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {todayAppointments.slice(0, 5).map(apt => {
                                        const patient = patients.find(p => p.id === apt.patientId);
                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={() => patient && navigate(`/app/profile/${patient.id}`)}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors border border-gray-100 hover:border-blue-200"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#083c79] to-[#0a5199] flex items-center justify-center text-white font-bold text-lg">
                                                    {patient ? patient.firstName.charAt(0) : '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">
                                                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">{apt.reason || 'Sin motivo especificado'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono font-bold text-[#083c79]">{apt.time}</p>
                                                    <div className="flex items-center gap-1 text-xs mt-1">
                                                        {apt.type === 'virtual' ? (
                                                            <span className="flex items-center gap-1 text-purple-600">
                                                                <Video size={12} /> Virtual
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-blue-600">
                                                                <MapPin size={12} /> Presencial
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`w-3 h-3 rounded-full ${apt.confirmed ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    title={apt.confirmed ? 'Confirmada' : 'Pendiente'}
                                                />
                                            </div>
                                        );
                                    })}
                                    {todayAppointments.length > 5 && (
                                        <button
                                            onClick={() => navigate('/app/agenda')}
                                            className="w-full py-3 text-center text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors"
                                        >
                                            Ver {todayAppointments.length - 5} citas más
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={28} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium mb-2">No hay citas programadas para hoy</p>
                                    <button
                                        onClick={() => navigate('/app/agenda')}
                                        className="text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        Ir a la agenda
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="text-purple-600" size={20} />
                                Acciones Rápidas
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(action.path)}
                                        className={`${action.color} text-white p-3 rounded-xl font-medium text-sm flex flex-col items-center gap-2 transition-all hover:scale-105 hover:shadow-lg`}
                                    >
                                        {action.icon}
                                        <span className="text-xs">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Patients */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="text-blue-600" size={20} />
                                    Pacientes Recientes
                                </h2>
                            </div>
                            <div className="p-3">
                                {recentPatients.map(patient => (
                                    <button
                                        key={patient.id}
                                        onClick={() => navigate(`/app/profile/${patient.id}`)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                                            {patient.firstName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {patient.firstName} {patient.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500">{patient.ageDetails}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
