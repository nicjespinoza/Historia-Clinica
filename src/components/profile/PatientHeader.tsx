import React from 'react';
import { ArrowLeft, Brain, Plus, Calendar, StickyNote, Activity, PenTool, Eye } from 'lucide-react';
import { calculateAge } from '../../lib/helpers';
import { ActionButton } from './SharedComponents';
import { Patient } from '../../types';

interface PatientHeaderProps {
    patient: Patient;
    navigate: (path: string) => void;
    onAIAnalysis: () => void;
    onShowAppointment: () => void;
    onShowNotes: () => void;
    onViewNotes: () => void;
    onShowEndoscopic: () => void;
    onViewEndoscopic: () => void;
    activeTab: string;
    setActiveTab: (tab: 'general' | 'consents') => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
    patient,
    navigate,
    onAIAnalysis,
    onShowAppointment,
    onShowNotes,
    onViewNotes,
    onShowEndoscopic,
    onViewEndoscopic,
    activeTab,
    setActiveTab
}) => {
    return (
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/app/patients')} className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                {patient.firstName} {patient.lastName}
                                {patient.isOnline && <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                            </h1>
                            <p className="text-gray-400 text-xs font-medium tracking-wide flex items-center gap-2 mt-0.5 uppercase">
                                <span>ID: {patient.id.slice(0, 6)}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>{calculateAge(patient.birthDate)} AÑOS</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>{patient.sex}</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions Bar - Futuristic & Icon Based */}
                    <div className="flex items-center gap-3 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                        <ActionButton icon={<Brain size={18} />} label="IA" onClick={onAIAnalysis} color="indigo" />
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <ActionButton icon={<Calendar size={18} />} label="Cita" onClick={onShowAppointment} color="blue" />
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <ActionButton icon={<StickyNote size={18} />} label="Notas" onClick={onShowNotes} color="amber" />
                        <ActionButton icon={<Eye size={18} />} label="Ver" onClick={onViewNotes} color="amber" />
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <ActionButton icon={<Activity size={18} />} label="Endo" onClick={onShowEndoscopic} color="teal" />
                        <ActionButton icon={<Eye size={18} />} label="Ver" onClick={onViewEndoscopic} color="teal" />
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <ActionButton icon={<PenTool size={18} />} label="Firmas" onClick={() => setActiveTab(activeTab === 'general' ? 'consents' : 'general')} active={activeTab === 'consents'} color="gray" />
                    </div>
                </div>
            </div>
        </div>
    );
};
