import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X, Trash2, Edit2, Plus, Users, Video, MapPin, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Patient, Appointment } from '../types';
import { GlassCard } from '../components/premium-ui/GlassCard';
import { FloatingLabelInput } from '../components/premium-ui/FloatingLabelInput';
import { FloatingLabelSelect } from '../components/premium-ui/FloatingLabelSelect';

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
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [localPatients, setLocalPatients] = useState<Patient[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

    // Merge prop patients with fetched patients
    const patients = propPatients.length > 0 ? propPatients : localPatients;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load appointments
            const apps = await api.getAppointments();
            const mappedApps = apps.map((a, i) => ({
                ...a,
                confirmed: a.confirmed ?? (i % 2 === 0),
                uniqueId: a.uniqueId || `CITA-${1000 + i}`
            }));
            setAppointments(mappedApps);

            // Load patients if not provided via props
            if (propPatients.length === 0) {
                const fetchedPatients = await api.getPatients();
                setLocalPatients(fetchedPatients);
            }
        } catch (error) {
            console.error("Error loading agenda data:", error);
        }
    };

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
        type: 'presencial' as 'presencial' | 'virtual',
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
        if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time || !newAppointment.reason) {
            alert('Por favor complete todos los campos');
            return;
        }

        // Check for conflicts
        if (checkTimeConflict(newAppointment.date, newAppointment.time)) {
            setConflictWarning('Ya existe una cita programada para esta fecha y hora');
            return;
        }

        setIsSaving(true);
        try {
            const created = await api.createAppointment({
                patientId: newAppointment.patientId,
                date: newAppointment.date,
                time: newAppointment.time,
                type: newAppointment.type,
                reason: newAppointment.reason
            });
            setAppointments(prev => [...prev, created]);
            setShowNewAppointmentModal(false);
            setNewAppointment({ patientId: '', date: '', time: '', type: 'presencial', reason: '' });
            setConflictWarning(null);
            alert('Cita creada exitosamente');
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Error al crear la cita');
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
            alert('Cita actualizada con éxito');
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert("Error al actualizar la cita");
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
            } catch (error: any) {
                console.error("Error deleting appointment:", error);
                if (error.code === 'permission-denied') {
                    alert("Error: Permisos insuficientes para eliminar. Verifique las reglas de seguridad de Firebase.");
                } else {
                    alert("Error al eliminar la cita: " + error.message);
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
        } catch (error) {
            console.error("Error confirming appointment:", error);
            alert("Error al confirmar la cita");
        }
    };

    // Mark appointment as completed
    const handleCompleteAppointment = async (id: string, patientId: string) => {
        try {
            // Mark as completed in local state (you could add a 'status' field)
            setAppointments(prev => prev.map(a =>
                a.id === id ? { ...a, confirmed: true } : a
            ));
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
                alert('Cita cancelada exitosamente');
            } catch (error) {
                console.error("Error canceling appointment:", error);
                alert("Error al cancelar la cita");
            }
        }
    };

    // Modal Logic
    const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[] | null>(null);

    const handleDayClick = (dayApts: Appointment[]) => {
        const sorted = [...dayApts].sort((a, b) => a.time.localeCompare(b.time));
        setSelectedDayAppointments(sorted);
    };

    return (
        <div className="min-h-screen font-sans bg-gradient-to-br from-[#083c79] via-[#0a4d8c] to-[#062d5a]">
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

                        {/* Stats Section */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Today's Count */}
                            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 shadow-lg hover:bg-white/20 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-white">{todayStats.total}</span>
                                    <p className="text-xs text-blue-200">citas hoy</p>
                                </div>
                            </div>

                            {/* Confirmed */}
                            <div className="flex items-center gap-3 bg-green-500/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-green-400/30 shadow-lg hover:bg-green-500/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-300" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-green-200">{todayStats.confirmed}</span>
                                    <p className="text-xs text-green-300/80">confirmadas</p>
                                </div>
                            </div>

                            {/* Virtual */}
                            <div className="flex items-center gap-3 bg-purple-500/20 backdrop-blur-sm px-5 py-3 rounded-2xl border border-purple-400/30 shadow-lg hover:bg-purple-500/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-purple-300" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-purple-200">{todayStats.virtual}</span>
                                    <p className="text-xs text-purple-300/80">virtuales</p>
                                </div>
                            </div>

                            {/* New Appointment Button */}
                            <button
                                onClick={() => setShowNewAppointmentModal(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Nueva Cita</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content: Calendar + Day Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2">
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

                            {/* Day Names */}
                            <div className="grid grid-cols-7 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
                                    <div key={d} className={`py-4 text-center text-xs font-bold uppercase tracking-widest ${i === 0 || i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7">
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-gray-100 bg-gray-50/50" />
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
                                            className={`min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer transition-all relative
                                                ${isSelected ? 'bg-blue-50 ring-2 ring-[#083c79] ring-inset' : 'hover:bg-gray-50'}
                                                ${isCurrentDay && !isSelected ? 'bg-green-50' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                                                    ${isCurrentDay ? 'bg-green-500 text-white' : ''}
                                                    ${isSelected && !isCurrentDay ? 'bg-[#083c79] text-white' : ''}
                                                    ${!isCurrentDay && !isSelected ? 'text-gray-700' : ''}
                                                `}>
                                                    {day}
                                                </span>
                                                {dayApts.length > 0 && (
                                                    <span className="bg-[#083c79] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {dayApts.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Mini appointment preview */}
                                            <div className="space-y-1">
                                                {dayApts.slice(0, 2).map(apt => (
                                                    <div key={apt.id} className="text-[10px] p-1 rounded bg-[#083c79]/10 text-[#083c79] font-medium truncate">
                                                        {apt.time}
                                                    </div>
                                                ))}
                                                {dayApts.length > 2 && (
                                                    <div className="text-[10px] text-gray-500 font-medium">
                                                        +{dayApts.length - 2} más
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Selected Day Appointments Panel */}
                    <div className="lg:col-span-1">
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
                                            return (
                                                <div key={apt.id} className="p-4 rounded-xl border-2 border-gray-100 hover:border-[#083c79] hover:shadow-md transition-all group bg-white">
                                                    <div className="flex items-start gap-3">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#083c79] to-[#0a5199] flex items-center justify-center text-white font-bold text-lg shrink-0">
                                                            {patient ? patient.firstName.charAt(0) : '?'}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-mono bg-[#083c79] text-white text-xs px-2 py-1 rounded font-bold">
                                                                    {apt.time}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${apt.confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {apt.confirmed ? '✓ Confirmada' : '⏳ Pendiente'}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-gray-900 truncate">
                                                                {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente Desconocido'}
                                                            </h4>
                                                            <p className="text-sm text-gray-500 truncate mt-0.5">{apt.reason || 'Sin motivo especificado'}</p>

                                                            {/* Type indicator */}
                                                            <div className="flex items-center gap-1 mt-2 text-xs">
                                                                {apt.type === 'virtual' ? (
                                                                    <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg font-medium">
                                                                        <Video size={12} /> Virtual
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-medium">
                                                                        <MapPin size={12} /> Presencial
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
            {selectedDayAppointments && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-lg p-0 overflow-hidden shadow-2xl">
                        <div className="bg-[#083c79] p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-bold">Citas del Día</h3>
                            <button onClick={() => setSelectedDayAppointments(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 bg-gray-50">
                            {selectedDayAppointments.map(apt => {
                                const patient = patients.find(p => p.id === apt.patientId);
                                return (
                                    <div key={apt.id} className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#083c79] transition-colors group">
                                        <div className="h-10 w-10 rounded-full bg-[#083c79] flex items-center justify-center text-white font-bold mr-3 shrink-0 text-sm">
                                            {patient ? patient.firstName.charAt(0) : '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate text-sm">
                                                {patient ? `${patient.firstName} ${patient.lastName}` : 'Desconocido'}
                                            </h4>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                <span className="font-mono bg-[#083c79]/5 text-[#083c79] px-1.5 py-0.5 rounded font-bold">{apt.time}</span>
                                                <span className="truncate">{apt.reason}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => handleEditAppointment(apt.id, e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={(e) => handleDeleteAppointment(apt.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                            {selectedDayAppointments.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No hay citas para este día.</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Edit Appointment Modal - Kept GlassCard for Modal as user didn't specify changing this, but inputs inside are consistent */}
            {editingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-md p-0 overflow-hidden shadow-2xl">
                        <div className="bg-[#083c79] p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-bold">Editar Cita</h3>
                            <button onClick={() => setEditingAppointment(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-0.5 bg-white">
                            <FloatingLabelInput
                                label="Fecha"
                                type="date"
                                value={editingAppointment.date}
                                onChange={(e) => setEditingAppointment({ ...editingAppointment, date: e.target.value })}
                            />
                            <FloatingLabelInput
                                label="Hora"
                                type="time"
                                value={editingAppointment.time}
                                onChange={(e) => setEditingAppointment({ ...editingAppointment, time: e.target.value })}
                            />
                            <FloatingLabelSelect
                                label="Tipo de Cita"
                                value={editingAppointment.type}
                                onChange={(e) => setEditingAppointment({ ...editingAppointment, type: e.target.value as 'presencial' | 'virtual' })}
                                options={[
                                    { label: 'Presencial', value: 'presencial' },
                                    { label: 'Virtual', value: 'virtual' }
                                ]}
                            />
                            <FloatingLabelInput
                                label="Motivo"
                                as="textarea"
                                value={editingAppointment.reason}
                                onChange={(e) => setEditingAppointment({ ...editingAppointment, reason: e.target.value })}
                                rows={3}
                            />

                            <div className="flex justify-end gap-3 pt-6">
                                <button
                                    onClick={() => setEditingAppointment(null)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateAppointment}
                                    disabled={isSaving}
                                    className="px-6 py-3 rounded-xl font-bold text-white bg-[#083c79] hover:brightness-110 transition-all shadow-lg flex items-center gap-2 active:scale-95"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* New Appointment Modal */}
            {showNewAppointmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-lg p-0 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#083c79] to-blue-600 p-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Nueva Cita</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowNewAppointmentModal(false);
                                        setConflictWarning(null);
                                    }}
                                    className="p-2 text-white/70 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Conflict Warning */}
                            {conflictWarning && (
                                <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded-lg">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="text-sm">{conflictWarning}</span>
                                </div>
                            )}

                            {/* Patient Selection */}
                            <FloatingLabelSelect
                                id="new-patient"
                                label="Paciente"
                                value={newAppointment.patientId}
                                onChange={(e) => setNewAppointment(prev => ({ ...prev, patientId: e.target.value }))}
                                options={patients.map(p => ({
                                    value: p.id,
                                    label: `${p.firstName} ${p.lastName}`
                                }))}
                            />

                            {/* Date */}
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

                            {/* Time Selection with Available Slots */}
                            {newAppointment.date && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Horario Disponible
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                        {getAvailableSlots(newAppointment.date).length > 0 ? (
                                            getAvailableSlots(newAppointment.date).map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => {
                                                        setNewAppointment(prev => ({ ...prev, time: slot }));
                                                        setConflictWarning(null);
                                                    }}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${newAppointment.time === slot
                                                        ? 'bg-[#083c79] text-white'
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

                            {/* Appointment Type */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setNewAppointment(prev => ({ ...prev, type: 'presencial' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${newAppointment.type === 'presencial'
                                        ? 'bg-[#083c79] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <MapPin className="w-5 h-5" />
                                    Presencial
                                </button>
                                <button
                                    onClick={() => setNewAppointment(prev => ({ ...prev, type: 'virtual' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${newAppointment.type === 'virtual'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Video className="w-5 h-5" />
                                    Virtual
                                </button>
                            </div>

                            {/* Reason */}
                            <FloatingLabelInput
                                id="new-reason"
                                label="Motivo de la Consulta"
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
                                    disabled={isSaving || !newAppointment.patientId || !newAppointment.date || !newAppointment.time}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Creando...' : 'Crear Cita'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );

};
