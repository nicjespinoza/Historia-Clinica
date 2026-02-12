import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Trash2, Edit2, Plus, Users, Video, MapPin, AlertTriangle, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { Patient, Appointment } from '../../types';
import { GlassCard } from '../../components/premium-ui/GlassCard';
import { FloatingLabelInput } from '../../components/premium-ui/FloatingLabelInput';
import { FloatingLabelSelect } from '../../components/premium-ui/FloatingLabelSelect';
import { Autocomplete } from '../../components/premium-ui/Autocomplete';
import { WeeklyCalendar } from './WeeklyCalendar';
import { PageTransition } from '../../components/ui/PageTransition';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';

// Available time slots for appointments (60 min intervals)
// Each appointment blocks 60 minutes of doctor's time
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Appointment duration in minutes
const APPOINTMENT_DURATION = 60;


interface AgendaScreenProps {
    patients?: Patient[];
}

export const AgendaScreen = ({ patients: propPatients = [] }: AgendaScreenProps) => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [localPatients, setLocalPatients] = useState<Patient[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
    const [view, setView] = useState<'month' | 'week'>('month');

    // Merge prop patients with fetched patients
    const patients = propPatients.length > 0 ? propPatients : localPatients;

    // Data Fetching Logic
    const fetchAppointmentsForMonth = async (date: Date) => {
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            // Calculate start and end of month formatted as YYYY-MM-DD
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;



            const apps = await api.getAppointmentsByDateRange(startDate, endDate);

            const mappedApps = apps.map((a, i) => ({
                ...a,
                confirmed: a.confirmed ?? (i % 2 === 0), // Fallback logic preserved, though ideally should come from DB
                uniqueId: a.uniqueId || `CITA-${1000 + i}`
            }));

            setAppointments(mappedApps);
        } catch (error) {
            console.error("Error loading agenda data:", error);
        }
    };

    // Initial Load & Patient Data
    useEffect(() => {
        const loadPatients = async () => {
            if (propPatients.length === 0) {
                try {
                    const fetchedPatients = await api.getPatients();
                    setLocalPatients(fetchedPatients);
                } catch (error) {
                    console.error("Error loading patients:", error);
                }
            }
        };

        loadPatients();
        // Initial fetch for current date
        fetchAppointmentsForMonth(currentDate);
    }, []); // Run once on mount

    // Fetch when currentDate (month) changes
    // We use a ref or separate effect to avoid infinite loops if we were changing state inside
    useEffect(() => {
        fetchAppointmentsForMonth(currentDate);
    }, [currentDate]); // Re-fetch when month changes

    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
        // Note: fetchAppointmentsForMonth is triggered by the useEffect on currentDate
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const getAppointmentsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return appointments.filter(a => a.date === dateStr);
    };

    // Upcoming List Logic
    const upcomingAppointments = appointments
        .filter(a => new Date(a.date + 'T' + a.time) >= new Date())
        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

    // Stats for today
    const todayStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.date === today);
        return {
            total: todayAppts.length,
            confirmed: todayAppts.filter(a => a.confirmed).length,
            virtual: todayAppts.filter(a => a.type === 'virtual').length,
            presencial: todayAppts.filter(a => a.type === 'presencial').length
        };
    }, [appointments]);

    // Selected day's appointments
    const selectedDayStr = useMemo(() => {
        return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    }, [currentDate, selectedDay]);

    const selectedDayAppointmentsList = useMemo(() => {
        return appointments
            .filter(a => a.date === selectedDayStr)
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, selectedDayStr]);

    const selectedDayFormatted = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
        return date.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' });
    }, [currentDate, selectedDay]);

    // Edit Modal State
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // New Appointment Modal State
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
    const [newAppointment, setNewAppointment] = useState({
        patientId: '',
        date: '',
        time: '',
        type: 'presencial' as 'presencial' | 'virtual' | 'cirugia' | 'bloqueo',
        reason: ''
    });
    const [conflictWarning, setConflictWarning] = useState<string | null>(null);

    // Check for time conflicts (verifies 60-minute window)
    const checkTimeConflict = (date: string, time: string, excludeId?: string): boolean => {
        const requestedTime = new Date(`${date}T${time}:00`);
        const requestedEnd = new Date(requestedTime.getTime() + APPOINTMENT_DURATION * 60000);

        const conflict = appointments.find(a => {
            if (a.date !== date || a.id === excludeId) return false;

            const existingStart = new Date(`${a.date}T${a.time}:00`);
            const existingEnd = new Date(existingStart.getTime() + APPOINTMENT_DURATION * 60000);

            // Check if times overlap
            return (requestedTime < existingEnd && requestedEnd > existingStart);
        });

        return !!conflict;
    };

    // Get available time slots for a specific date (checks 60-minute windows)
    const getAvailableSlots = (date: string) => {
        const bookedSlots = new Set<string>();

        appointments.filter(a => a.date === date).forEach(apt => {
            // Mark the slot as booked
            bookedSlots.add(apt.time);
        });

        return TIME_SLOTS.filter(slot => !bookedSlots.has(slot));
    };

    // Handle new appointment creation
    const handleCreateAppointment = async () => {
        if (!newAppointment.date || !newAppointment.time || !newAppointment.reason) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        // Patient ID is required only for non-blocked appointments
        if (newAppointment.type !== 'bloqueo' && !newAppointment.patientId) {
            toast.error('Por favor seleccione un paciente');
            return;
        }

        // Check for conflicts
        if (checkTimeConflict(newAppointment.date, newAppointment.time)) {
            setConflictWarning('Ya existe una cita o bloqueo para esta fecha y hora');
            toast.warning('Conflicto de horario detectado');
            return;
        }

        setIsSaving(true);
        try {
            const created = await api.createAppointment({
                patientId: newAppointment.patientId || 'BLOQUEO', // Fallback for blocked slots
                date: newAppointment.date,
                time: newAppointment.time,
                type: newAppointment.type,
                reason: newAppointment.reason
            });
            setAppointments(prev => [...prev, created]);
            setShowNewAppointmentModal(false);
            setNewAppointment({ patientId: '', date: '', time: '', type: 'presencial', reason: '' });
            setConflictWarning(null);
            toast.success(newAppointment.type === 'bloqueo' ? 'Horario bloqueado exitosamente' : 'Cita creada exitosamente');
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error('Error al crear la cita');
        } finally {
            setIsSaving(false);
        }
    };


    const handleEditAppointment = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const apt = appointments.find(a => a.id === id);
        if (apt) {
            setEditingAppointment(apt);
        }
    };

    const handleUpdateAppointment = async () => {
        if (!editingAppointment) return;
        setIsSaving(true);
        try {
            await api.updateAppointment(editingAppointment.id, {
                date: editingAppointment.date,
                time: editingAppointment.time,
                type: editingAppointment.type,
                reason: editingAppointment.reason
            });
            setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? editingAppointment : a));
            setEditingAppointment(null);
            toast.success('Cita actualizada con éxito');
        } catch (error) {
            console.error("Error updating appointment:", error);
            toast.error("Error al actualizar la cita");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAppointment = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('¿Está seguro de eliminar esta cita permanentemente?')) {
            try {
                await api.deleteAppointment(id);
                setAppointments(prev => prev.filter(a => a.id !== id));
                toast.success('Cita eliminada');
            } catch (error: any) {
                console.error("Error deleting appointment:", error);
                if (error.code === 'permission-denied') {
                    toast.error("Permisos insuficientes para eliminar.");
                } else {
                    toast.error("Error al eliminar la cita: " + error.message);
                }
            }
        }
    };

    // Confirm appointment
    const handleConfirmAppointment = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.updateAppointment(id, { confirmed: true });
            setAppointments(prev => prev.map(a =>
                a.id === id ? { ...a, confirmed: true } : a
            ));
            toast.success('Cita confirmada');
        } catch (error) {
            console.error("Error confirming appointment:", error);
            toast.error("Error al confirmar la cita");
        }
    };

    // Mark appointment as completed
    const handleCompleteAppointment = async (id: string, patientId: string) => {
        try {
            // Mark as completed in local state (you could add a 'status' field)
            setAppointments(prev => prev.map(a =>
                a.id === id ? { ...a, confirmed: true } : a
            ));
            toast.success('Cita marcada como completada');
            // Navigate to create new consult for follow-up
            if (window.confirm('¿Desea crear una consulta de seguimiento para este paciente?')) {
                window.location.href = `/app/createsubsecuente/${patientId}`;
            }
        } catch (error) {
            console.error("Error completing appointment:", error);
        }
    };

    // Cancel/reschedule appointment
    const handleCancelAppointment = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const action = window.confirm(
            'Opciones:\n\n- OK: Cancelar la cita\n- Cancelar: Volver'
        );
        if (action) {
            try {
                await api.deleteAppointment(id);
                setAppointments(prev => prev.filter(a => a.id !== id));
                toast.success('Cita cancelada exitosamente');
            } catch (error) {
                console.error("Error canceling appointment:", error);
                toast.error("Error al cancelar la cita");
            }
        }
    };

    // Modal Logic
    const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[] | null>(null);

    const handleDayClick = (dayApts: Appointment[]) => {
        const sorted = [...dayApts].sort((a, b) => a.time.localeCompare(b.time));
        setSelectedDayAppointments(sorted);
    };

    // Appointment Styles Helper
    const getAppointmentStyles = (type: 'presencial' | 'virtual' | 'cirugia' | 'bloqueo') => {
        if (type === 'virtual') {
            return {
                bg: 'bg-purple-50',
                text: 'text-purple-700',
                border: 'border-purple-200',
                dot: 'bg-purple-500',
                lightBg: 'bg-purple-500/10'
            };
        }
        if (type === 'bloqueo') {
            return {
                bg: 'bg-gray-100',
                text: 'text-gray-500',
                border: 'border-gray-200',
                dot: 'bg-gray-400',
                lightBg: 'bg-gray-200'
            };
        }
        if (type === 'cirugia') {
            return {
                bg: 'bg-red-50',
                text: 'text-red-700',
                border: 'border-red-200',
                dot: 'bg-red-500',
                lightBg: 'bg-red-500/10'
            };
        }
        return {
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            border: 'border-blue-200',
            dot: 'bg-blue-500',
            lightBg: 'bg-[#083c79]/10'
        };
    };

    return (
        <PageTransition className="min-h-screen font-sans bg-gradient-to-br from-[#083c79] via-[#0a4d8c] to-[#062d5a]">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
            </div>

            <div className="relative p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6">
                {/* Premium Header */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Title Section */}
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-white/30 to-white/10 p-4 rounded-2xl shadow-lg backdrop-blur-sm">
                                <CalendarIcon className="text-white" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                    Agenda Médica
                                </h2>
                                <p className="text-blue-200/80 mt-1">Gestiona tus citas y disponibilidad</p>
                            </div>
                        </div>

                        {/* Stats Section - Scrollable on mobile */}
                        <div className="flex flex-nowrap md:flex-wrap items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide snap-x">
                            {/* Today's Count */}
                            <div className="flex-none snap-center flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 shadow-lg min-w-[140px]">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-white">{todayStats.total}</span>
                                    <p className="text-xs text-blue-200">citas hoy</p>
                                </div>
                            </div>

                            {/* Confirmed */}
                            <div className="flex-none snap-center flex items-center gap-3 bg-green-500/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-green-400/30 shadow-lg min-w-[140px]">
                                <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-300" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-green-200">{todayStats.confirmed}</span>
                                    <p className="text-xs text-green-300/80">confirmadas</p>
                                </div>
                            </div>

                            {/* Virtual */}
                            <div className="flex-none snap-center flex items-center gap-3 bg-purple-500/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-purple-400/30 shadow-lg min-w-[140px]">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-purple-300" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-purple-200">{todayStats.virtual}</span>
                                    <p className="text-xs text-purple-300/80">virtuales</p>
                                </div>
                            </div>

                            {/* New Appointment Button - Fixed or standard */}
                            <button
                                onClick={() => setShowNewAppointmentModal(true)}
                                className="flex-none snap-center flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-green-500/30 whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Nueva Cita</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content: Calendar + Day Details */}
                <div className="flex flex-col gap-8">
                    {/* Calendar */}
                    <div className="w-full">
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                            {/* Calendar Header */}
                            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-[#083c79] via-[#0a4d8c] to-[#0a5199] text-white">
                                <div>
                                    <h3 className="text-2xl font-bold capitalize tracking-tight">
                                        {monthNames[currentDate.getMonth()]}
                                    </h3>
                                    <p className="text-blue-200/70 text-sm">{currentDate.getFullYear()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* View Toggle */}
                                    <div className="flex bg-white/20 rounded-xl p-1 mr-4">
                                        <button
                                            onClick={() => setView('month')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'month' ? 'bg-white text-[#083c79]' : 'text-white hover:bg-white/10'}`}
                                        >
                                            Mes
                                        </button>
                                        <button
                                            onClick={() => setView('week')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'week' ? 'bg-white text-[#083c79]' : 'text-white hover:bg-white/10'}`}
                                        >
                                            Semana
                                        </button>
                                    </div>
                                    <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-white/20 rounded-xl transition-all hover:scale-110 active:scale-95">
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCurrentDate(new Date());
                                            setSelectedDay(new Date().getDate());
                                        }}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 border border-white/20"
                                    >
                                        Hoy
                                    </button>
                                    <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-white/20 rounded-xl transition-all hover:scale-110 active:scale-95">
                                        <ChevronRight size={22} />
                                    </button>
                                </div>
                            </div>

                            {view === 'week' ? (
                                <WeeklyCalendar
                                    currentDate={currentDate}
                                    appointments={appointments}
                                    patients={patients}
                                    onDateChange={setCurrentDate}
                                    onAppointmentClick={(apt) => {
                                        setEditingAppointment(apt);
                                    }}
                                    onSlotClick={(date, time) => {
                                        const dateStr = date.toISOString().split('T')[0];
                                        setNewAppointment(prev => ({ ...prev, date: dateStr, time }));
                                        setShowNewAppointmentModal(true);
                                    }}
                                />
                            ) : (
                                <>
                                    {/* Day Names */}
                                    <div className="grid grid-cols-7 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
                                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
                                            <div key={d} className={`py-4 text-center text-xs font-bold uppercase tracking-widest ${i === 0 || i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                                                {d}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Grid - Responsive Scrollable Container for Mobile */}
                                    <div className="overflow-x-auto">
                                        <div className="grid grid-cols-7 min-w-[600px] md:min-w-0">
                                            {Array.from({ length: firstDay }).map((_, i) => (
                                                <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] border-b border-r border-gray-100 bg-gray-50/50" />
                                            ))}
                                            {Array.from({ length: days }).map((_, i) => {
                                                const day = i + 1;
                                                const dayApts = getAppointmentsForDay(day);
                                                const isCurrentDay = isToday(day);
                                                const isSelected = selectedDay === day;

                                                return (
                                                    <div
                                                        key={day}
                                                        onClick={() => setSelectedDay(day)}
                                                        className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-b border-r border-gray-100 cursor-pointer transition-all relative
                                                            ${isSelected ? 'bg-blue-50 ring-2 ring-[#083c79] ring-inset' : 'hover:bg-gray-50'}
                                                            ${isCurrentDay && !isSelected ? 'bg-green-50' : ''}
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between mb-1 md:mb-2">
                                                            <span className={`text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-colors
                                                                ${isCurrentDay ? 'bg-green-500 text-white' : ''}
                                                                ${isSelected && !isCurrentDay ? 'bg-[#083c79] text-white' : ''}
                                                                ${!isCurrentDay && !isSelected ? 'text-gray-700' : ''}
                                                            `}>
                                                                {day}
                                                            </span>
                                                            {dayApts.length > 0 && (
                                                                <span className="bg-[#083c79] text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                    {dayApts.length}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Mini appointment preview - Hidden on very small screens, shown on md+ */}
                                                        <div className="space-y-0.5 md:space-y-1 hidden sm:block">
                                                            {dayApts.slice(0, 2).map(apt => {
                                                                const styles = getAppointmentStyles(apt.type);
                                                                return (
                                                                    <div key={apt.id} className={`text-[9px] md:text-[10px] p-0.5 md:p-1 rounded ${styles.lightBg} ${styles.text} font-medium truncate flex items-center gap-1`}>
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} shrink-0`} />
                                                                        {apt.time}
                                                                    </div>
                                                                );
                                                            })}
                                                            {dayApts.length > 2 && (
                                                                <div className="text-[9px] md:text-[10px] text-gray-500 font-medium pl-1">
                                                                    +{dayApts.length - 2}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Dot indicator for mobile */}
                                                        <div className="flex gap-0.5 justify-center sm:hidden mt-1">
                                                            {dayApts.slice(0, 3).map((apt, idx) => (
                                                                <div key={idx} className={`w-1 h-1 rounded-full ${getAppointmentStyles(apt.type).dot}`}></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Selected Day Appointments Panel */}
                    <div className="w-full">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                            {/* Panel Header */}
                            <div className="p-5 bg-gradient-to-r from-[#083c79] to-[#0a5199] text-white">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Citas del Día</h3>
                                        <p className="text-blue-200 text-sm capitalize">{selectedDayFormatted}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Appointments List */}
                            <div className="p-4 max-h-[500px] overflow-y-auto">
                                {selectedDayAppointmentsList.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedDayAppointmentsList.map(apt => {
                                            const patient = patients.find(p => p.id === apt.patientId);
                                            const styles = getAppointmentStyles(apt.type);
                                            return (
                                                <div key={apt.id} className={`p-4 rounded-xl border-l-4 ${apt.confirmed ? 'border-l-green-500' : 'border-l-yellow-400'} ${styles.bg} hover:shadow-md transition-all group`}>
                                                    <div className="flex items-start gap-3">
                                                        {/* Avatar */}
                                                        <div className={`w-12 h-12 rounded-full ${styles.dot} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}>
                                                            {(apt.type === 'bloqueo' || apt.type === 'cirugia')
                                                                ? (apt.type === 'bloqueo' ? <Clock size={20} /> : <AlertTriangle size={20} />)
                                                                : (patient ? patient.firstName.charAt(0) : '?')
                                                            }
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`font-mono ${styles.lightBg} ${styles.text} text-xs px-2 py-1 rounded font-bold`}>
                                                                    {apt.time}
                                                                </span>
                                                                {apt.type !== 'bloqueo' && apt.type !== 'cirugia' && (
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${apt.confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                        {apt.confirmed ? '✓ Confirmada' : '⏳ Pendiente'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className={`font-bold ${styles.text} truncate`}>
                                                                {(apt.type === 'bloqueo' || apt.type === 'cirugia')
                                                                    ? (apt.type === 'bloqueo' ? 'HORARIO BLOQUEADO' : 'CIRUGÍA PROGRAMADA')
                                                                    : (patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente Desconocido')
                                                                }
                                                            </h4>
                                                            <p className="text-sm text-gray-500 truncate mt-0.5">{apt.reason || 'Sin motivo especificado'}</p>

                                                            {/* Type indicator */}
                                                            <div className="flex items-center gap-1 mt-2 text-xs">
                                                                {apt.type === 'virtual' && (
                                                                    <span className="flex items-center gap-1 text-purple-600 font-medium">
                                                                        <Video size={12} /> Cita Virtual
                                                                    </span>
                                                                )}
                                                                {apt.type === 'presencial' && (
                                                                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                                        <MapPin size={12} /> Cita Presencial
                                                                    </span>
                                                                )}
                                                                {apt.type === 'bloqueo' && (
                                                                    <span className="flex items-center gap-1 text-gray-500 font-medium">
                                                                        <Clock size={12} /> No Disponible
                                                                    </span>
                                                                )}
                                                                {apt.type === 'cirugia' && (
                                                                    <span className="flex items-center gap-1 text-red-600 font-medium">
                                                                        <AlertTriangle size={12} /> Quirófano
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-1">
                                                            {!apt.confirmed && (
                                                                <button
                                                                    onClick={(e) => handleConfirmAppointment(apt.id, e)}
                                                                    className="px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1"
                                                                    title="Confirmar cita"
                                                                >
                                                                    <CheckCircle size={14} /> Confirmar
                                                                </button>
                                                            )}
                                                            {apt.confirmed && (
                                                                <button
                                                                    onClick={() => handleCompleteAppointment(apt.id, apt.patientId)}
                                                                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                                                                    title="Marcar como completada"
                                                                >
                                                                    <CheckCircle size={14} /> Completar
                                                                </button>
                                                            )}
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {apt.patientId && apt.type !== 'bloqueo' && apt.type !== 'cirugia' && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); navigate(`/app/profile/${apt.patientId}`); }}
                                                                        className="p-1.5 text-[#083c79] hover:bg-blue-50 rounded-lg"
                                                                        title="Ver Perfil"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                )}
                                                                <button onClick={(e) => handleEditAppointment(apt.id, e)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Editar">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={(e) => handleCancelAppointment(apt.id, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Cancelar">
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                            <CalendarIcon size={28} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium mb-2">No hay citas programadas</p>
                                        <p className="text-gray-400 text-sm mb-4">para este día</p>
                                        <button
                                            onClick={() => setShowNewAppointmentModal(true)}
                                            className="text-[#083c79] font-bold text-sm hover:underline flex items-center gap-1 mx-auto"
                                        >
                                            <Plus size={16} /> Agregar cita
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day Details Modal */}
            <Modal
                isOpen={!!selectedDayAppointments}
                onClose={() => setSelectedDayAppointments(null)}
                title={
                    <div className="flex items-center gap-3">
                        <div className="bg-[#083c79]/10 p-2 rounded-lg text-[#083c79]">
                            <Clock size={20} />
                        </div>
                        <div>
                            <span>Citas del Día</span>
                            {selectedDayFormatted && <p className="text-sm font-normal text-gray-500 capitalize mt-0.5">{selectedDayFormatted}</p>}
                        </div>
                    </div>
                }
                className="max-w-lg"
            >
                <div className="space-y-3">
                    {selectedDayAppointments?.map((apt) => {
                        const patient = patients.find(p => p.id === apt.patientId);
                        return (
                            <div key={apt.id} className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#083c79] transition-colors group">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 shrink-0 text-sm ${(apt.type === 'bloqueo' || apt.type === 'cirugia') ? (apt.type === 'cirugia' ? 'bg-red-500' : 'bg-gray-400') : 'bg-[#083c79]'}`}>
                                    {(apt.type === 'bloqueo' || apt.type === 'cirugia')
                                        ? (apt.type === 'bloqueo' ? <Clock size={16} /> : <AlertTriangle size={16} />)
                                        : (patient ? patient.firstName.charAt(0) : '?')
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate text-sm">
                                        {(apt.type === 'bloqueo' || apt.type === 'cirugia')
                                            ? (apt.type === 'bloqueo' ? 'BLOQUEADO' : 'CIRUGÍA')
                                            : (patient ? `${patient.firstName} ${patient.lastName}` : 'Desconocido')
                                        }
                                    </h4>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                        <span className="font-mono bg-[#083c79]/5 text-[#083c79] px-1.5 py-0.5 rounded font-bold">{apt.time}</span>
                                        <span className="truncate">{apt.reason}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {apt.patientId && apt.type !== 'bloqueo' && apt.type !== 'cirugia' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/app/profile/${apt.patientId}`); }}
                                            className="p-1.5 text-[#083c79] hover:bg-blue-50 rounded-full transition-colors"
                                            title="Ver Perfil"
                                            aria-label="Ver perfil del paciente"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleEditAppointment(apt.id, e)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        aria-label="Editar cita"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteAppointment(apt.id, e)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        aria-label="Eliminar cita"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {selectedDayAppointments?.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No hay citas para este día.</p>
                    )}
                </div>
            </Modal>

            {/* Edit Appointment Modal */}
            <Modal
                isOpen={!!editingAppointment}
                onClose={() => setEditingAppointment(null)}
                title="Editar Cita"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FloatingLabelInput
                            label="Fecha"
                            type="date"
                            value={editingAppointment?.date || ''}
                            onChange={(e) => setEditingAppointment(prev => prev ? { ...prev, date: e.target.value } : null)}
                        />
                        <FloatingLabelSelect
                            label="Hora"
                            value={editingAppointment?.time || ''}
                            onChange={(e) => setEditingAppointment(prev => prev ? { ...prev, time: e.target.value } : null)}
                            options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
                        />
                    </div>

                    <FloatingLabelSelect
                        label="Tipo de Cita"
                        value={editingAppointment?.type || 'presencial'}
                        onChange={(e) => setEditingAppointment(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                        options={[
                            { label: 'Presencial', value: 'presencial' },
                            { label: 'Virtual', value: 'virtual' },
                            { label: 'Cirugía', value: 'cirugia' },
                            { label: 'Bloqueo / No Disponible', value: 'bloqueo' }
                        ]}
                    />

                    <FloatingLabelInput
                        label="Motivo"
                        as="textarea"
                        value={editingAppointment?.reason || ''}
                        onChange={(e) => setEditingAppointment(prev => prev ? { ...prev, reason: e.target.value } : null)}
                        rows={3}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setEditingAppointment(null)}
                            className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateAppointment}
                            disabled={isSaving}
                            className="px-6 py-2 rounded-xl font-bold text-white bg-[#083c79] hover:bg-blue-800 transition-colors shadow-lg disabled:bg-gray-300"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* New Appointment Modal */}
            {showNewAppointmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-lg p-0 overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#083c79] to-[#0a5199] p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <CalendarIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Nueva Cita</h3>
                                    <p className="text-blue-200 text-sm">Programar nueva consulta</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowNewAppointmentModal(false);
                                    setConflictWarning(null);
                                }}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                aria-label="Cerrar modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 bg-gray-50/50">
                            {/* Conflict Warning */}
                            {conflictWarning && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 animate-in slide-in-from-top-2">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-medium">{conflictWarning}</span>
                                </div>
                            )}

                            {/* Tab Switcher for New Appointment Type */}
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                <button
                                    onClick={() => setNewAppointment(prev => ({ ...prev, type: 'presencial' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newAppointment.type !== 'bloqueo' ? 'bg-white text-[#083c79] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Agendar Paciente
                                </button>
                                <button
                                    onClick={() => setNewAppointment(prev => ({ ...prev, type: 'bloqueo', patientId: '' }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${newAppointment.type === 'bloqueo' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Bloquear Horario
                                </button>
                            </div>

                            {/* Patient Selection - Only show if not blocking */}
                            {newAppointment.type !== 'bloqueo' && (
                                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-1">
                                    <Autocomplete
                                        label="Paciente"
                                        value={newAppointment.patientId}
                                        onChange={(val) => setNewAppointment(prev => ({ ...prev, patientId: val }))}
                                        options={patients.map(p => ({
                                            value: p.id,
                                            label: `${p.firstName} ${p.lastName}`
                                        }))}
                                        placeholder="Buscar paciente por nombre..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                    <FloatingLabelInput
                                        id="new-date"
                                        label="Fecha"
                                        type="date"
                                        value={newAppointment.date}
                                        onChange={(e) => {
                                            setNewAppointment(prev => ({ ...prev, date: e.target.value, time: '' }));
                                            setConflictWarning(null);
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Sub-Type Selection (Presencial/Virtual) - Only if not blocking */}
                                {newAppointment.type !== 'bloqueo' ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex">
                                        <button
                                            onClick={() => setNewAppointment(prev => ({ ...prev, type: 'presencial' }))}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newAppointment.type === 'presencial' ? 'bg-blue-100 text-[#083c79]' : 'text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            <MapPin size={14} /> Presencial
                                        </button>
                                        <button
                                            onClick={() => setNewAppointment(prev => ({ ...prev, type: 'virtual' }))}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newAppointment.type === 'virtual' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            <Video size={14} /> Virtual
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 rounded-xl border border-gray-200 p-1 flex items-center justify-center text-gray-500 text-xs font-bold">
                                        <Clock size={14} className="mr-2" /> Bloqueo de Agenda
                                    </div>
                                )}
                            </div>

                            {/* Time Selection with Available Slots */}
                            {newAppointment.date && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Clock size={16} className="text-[#083c79]" /> Horarios Disponibles
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {getAvailableSlots(newAppointment.date).length > 0 ? (
                                            getAvailableSlots(newAppointment.date).map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => {
                                                        setNewAppointment(prev => ({ ...prev, time: slot }));
                                                        setConflictWarning(null);
                                                    }}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${newAppointment.time === slot
                                                        ? (newAppointment.type === 'bloqueo' ? 'bg-gray-600 text-white' : 'bg-[#083c79] text-white')
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="col-span-4 text-sm text-gray-500 py-2">
                                                No hay horarios disponibles para esta fecha
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            <FloatingLabelInput
                                id="new-reason"
                                label={newAppointment.type === 'bloqueo' ? "Motivo del Bloqueo (Op. Cirugía, Personal...)" : "Motivo de la Consulta"}
                                value={newAppointment.reason}
                                onChange={(e) => setNewAppointment(prev => ({ ...prev, reason: e.target.value }))}
                            />

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowNewAppointmentModal(false);
                                        setConflictWarning(null);
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateAppointment}
                                    // Disable if loading OR if (type is NOT blocking AND patient is missing) OR date/time is missing
                                    disabled={isSaving || (newAppointment.type !== 'bloqueo' && !newAppointment.patientId) || !newAppointment.date || !newAppointment.time}
                                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2
                                        ${newAppointment.type === 'bloqueo' ? 'bg-gray-700 hover:bg-gray-800' : 'bg-green-500 hover:bg-green-600'}
                                        disabled:bg-gray-300 disabled:cursor-not-allowed`}
                                >
                                    {isSaving ? 'Guardando...' : (newAppointment.type === 'bloqueo' ? 'Bloquear Horario' : 'Agendar Cita')}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div >
            )}
        </PageTransition>
    );

};
