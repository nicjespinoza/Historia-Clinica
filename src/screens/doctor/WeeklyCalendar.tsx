import React from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, AlertTriangle } from 'lucide-react';
import { Appointment, Patient } from '../../types';

interface WeeklyCalendarProps {
    currentDate: Date;
    appointments: Appointment[];
    patients: Patient[];
    onDateChange: (date: Date) => void;
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (date: Date, time: string) => void;
}

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const WeeklyCalendar = ({
    currentDate,
    appointments,
    patients,
    onDateChange,
    onAppointmentClick,
    onSlotClick
}: WeeklyCalendarProps) => {
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    // Generate days of the week
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const changeWeek = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (delta * 7));
        onDateChange(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getAppointmentsForSlot = (date: Date, time: string) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(a => a.date === dateStr && a.time === time);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800 capitalize">
                        {startOfWeek.toLocaleDateString('es-NI', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => changeWeek(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <div className="min-w-[800px]">
                    {/* Grid Header (Days) */}
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/50">
                        <div className="p-4 border-r border-gray-200 text-center text-xs font-bold text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Hora
                        </div>
                        {weekDays.map((day, i) => (
                            <div key={i} className={`p-2 text-center border-r border-gray-200 last:border-r-0 ${isToday(day) ? 'bg-blue-50' : ''}`}>
                                <div className={`text-xs font-bold uppercase mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {day.toLocaleDateString('es-NI', { weekday: 'short' })}
                                </div>
                                <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold ${isToday(day) ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'}`}>
                                    {day.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body (Time Slots) */}
                    <div>
                        {TIME_SLOTS.map(time => (
                            <div key={time} className="grid grid-cols-8 min-h-[100px] border-b border-gray-100 last:border-none">
                                {/* Time Label */}
                                <div className="p-2 border-r border-gray-100 flex items-start justify-center text-xs font-medium text-gray-400 bg-gray-50/30 sticky left-0 z-10">
                                    {time}
                                </div>

                                {/* Days Columns */}
                                {weekDays.map((day, i) => {
                                    const slotAppointments = getAppointmentsForSlot(day, time);
                                    const dayDate = day.getDate(); // For key stability check if needed

                                    return (
                                        <div
                                            key={`${day.toISOString()}-${time}`}
                                            className="relative border-r border-gray-100 last:border-none p-1 group hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => onSlotClick(day, time)}
                                        >
                                            {/* Appointment Cards */}
                                            {slotAppointments.map(apt => {
                                                const patient = patients.find(p => p.id === apt.patientId);

                                                // Determine styles based on type
                                                let currStyle = 'bg-blue-50 border-blue-200 text-blue-700';
                                                let icon = <MapPin size={10} />;

                                                if (apt.type === 'virtual') {
                                                    currStyle = 'bg-purple-50 border-purple-200 text-purple-700';
                                                    icon = <Video size={10} />;
                                                } else if (apt.type === 'bloqueo') {
                                                    currStyle = 'bg-gray-100 border-gray-300 text-gray-500 opacity-90';
                                                    icon = <Clock size={10} />;
                                                } else if (apt.type === 'cirugia') {
                                                    currStyle = 'bg-red-50 border-red-200 text-red-700';
                                                    icon = <AlertTriangle size={10} />;
                                                }

                                                const isBlocked = apt.type === 'bloqueo' || apt.type === 'cirugia';

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAppointmentClick(apt);
                                                        }}
                                                        className={`
                                                    mb-1 p-1.5 rounded-lg border text-xs shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md
                                                    ${currStyle}
                                                    ${!isBlocked ? (apt.confirmed ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-400') : 'border-l-4 border-l-gray-400'}
                                                `}
                                                    >
                                                        <div className="font-bold truncate">
                                                            {isBlocked
                                                                ? (apt.type === 'bloqueo' ? 'BLOQUEADO' : 'CIRUGÍA')
                                                                : (patient ? `${patient.firstName} ${patient.lastName}` : 'Desconocido')}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-80 text-[10px] mt-0.5">
                                                            {icon}
                                                            <span className="truncate">{apt.reason || (isBlocked ? 'No disponible' : '')}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Add Button on Hover (if empty) */}
                                            {slotAppointments.length === 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600">
                                                        +
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
