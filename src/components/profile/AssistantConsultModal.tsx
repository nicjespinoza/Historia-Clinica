import React, { useState } from 'react';
import { X, Save, Clock, Activity, FileText, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Patient, SubsequentConsult, CheckboxData } from '../../types';
import { CheckboxList } from '../ui/FormComponents';
import * as C from '../../constants';

interface AssistantConsultModalProps {
    patient: Patient;
    onClose: () => void;
    onSave: (newConsult: SubsequentConsult) => void;
}

const SECTION_TITLE_CLASS = "text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2";
const INPUT_CLASS = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block transition-all duration-200 outline-none placeholder-gray-400 hover:bg-white";

export const AssistantConsultModal: React.FC<AssistantConsultModalProps> = ({ patient, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);

    // Form States
    const [motives, setMotives] = useState<CheckboxData>({});
    const [otherMotive, setOtherMotive] = useState('');
    const [evolutionTime, setEvolutionTime] = useState('');

    // Vitals
    const [vitals, setVitals] = useState({
        fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: ''
    });

    const handleVitalChange = (name: string, value: string) => {
        setVitals(prev => {
            const newVitals = { ...prev, [name]: value };

            // Auto-calculate BMI
            if ((name === 'weight' || name === 'height')) {
                const w = parseFloat(name === 'weight' ? value : newVitals.weight);
                const h = parseFloat(name === 'height' ? value : newVitals.height) / 100; // cm to m
                if (w > 0 && h > 0) {
                    newVitals.imc = (w / (h * h)).toFixed(1);
                }
            }
            return newVitals;
        });
    };

    const handleMotiveChange = (motive: string, checked: boolean) => {
        setMotives(prev => ({
            ...prev,
            [motive]: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: At least one motive or other motive
        const hasMotive = Object.values(motives).some(v => v) || otherMotive.trim();
        if (!hasMotive) {
            alert('Debe especificar al menos un motivo de consulta');
            return;
        }

        setLoading(true);
        try {
            const today = new Date();
            const timeString = today.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateString = today.toISOString().split('T')[0];

            const consultData: any = {
                patientId: patient.id,
                date: dateString,
                time: timeString,

                motives: motives,
                otherMotive: otherMotive,
                evolutionTime: evolutionTime,

                physicalExam: {
                    fc: vitals.fc,
                    fr: vitals.fr,
                    temp: vitals.temp,
                    pa: vitals.pa,
                    pam: vitals.pam,
                    sat02: vitals.sat02,
                    weight: vitals.weight,
                    height: vitals.height,
                    imc: vitals.imc,
                    systems: {}
                },

                historyOfPresentIllness: '',
                labs: { performed: { yes: false, no: false }, results: '' },
                diagnoses: [],
                treatment: { food: '', meds: [], exams: [], norms: [] },

                status: 'draft'
            };

            const saved = await api.createConsult(consultData);
            onSave(saved);
        } catch (error) {
            console.error('Error creating consult:', error);
            alert('Error al guardar la consulta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="text-emerald-600" />
                            Nueva Consulta
                        </h2>
                        <p className="text-xs text-emerald-600 font-medium">Asistente: {patient.firstName} {patient.lastName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30">
                    <form id="consult-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Motivos Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className={SECTION_TITLE_CLASS}>
                                <FileText size={18} className="text-blue-600" />
                                Motivo de Consulta
                            </h3>

                            <div className="mb-6">
                                <CheckboxList
                                    items={C.MOTIVES_LIST}
                                    data={motives}
                                    onChange={handleMotiveChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Otros Motivos</label>
                                    <input
                                        type="text"
                                        value={otherMotive}
                                        onChange={(e) => setOtherMotive(e.target.value)}
                                        placeholder="Especifique otro motivo..."
                                        className={INPUT_CLASS}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tiempo de Evolución</label>
                                    <input
                                        type="text"
                                        value={evolutionTime}
                                        onChange={(e) => setEvolutionTime(e.target.value)}
                                        placeholder="Ej: 3 días, 1 semana..."
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Vital Signs Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className={SECTION_TITLE_CLASS}>
                                <Activity size={18} className="text-rose-600" />
                                Signos Vitales
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <NumericInput label="FC" value={vitals.fc} onChange={(v) => handleVitalChange('fc', v)} min={40} max={200} unit="lpm" placeholder="60-100" />
                                <NumericInput label="FR" value={vitals.fr} onChange={(v) => handleVitalChange('fr', v)} min={8} max={40} unit="rpm" placeholder="12-20" />
                                <NumericInput label="Temp" value={vitals.temp} onChange={(v) => handleVitalChange('temp', v)} min={34} max={42} unit="°C" placeholder="36.5" />
                                <NumericInput label="SatO2" value={vitals.sat02} onChange={(v) => handleVitalChange('sat02', v)} min={70} max={100} unit="%" placeholder="95-100" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">PA (mmHg)</label>
                                    <input
                                        value={vitals.pa}
                                        onChange={(e) => handleVitalChange('pa', e.target.value)}
                                        placeholder="120/80"
                                        className={INPUT_CLASS}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">PAM (mmHg)</label>
                                    <input
                                        value={vitals.pam}
                                        onChange={(e) => handleVitalChange('pam', e.target.value)}
                                        placeholder="93"
                                        className={INPUT_CLASS}
                                    />
                                </div>
                                <NumericInput label="Peso" value={vitals.weight} onChange={(v) => handleVitalChange('weight', v)} min={1} max={500} unit="kg" placeholder="70" />
                                <NumericInput label="Talla" value={vitals.height} onChange={(v) => handleVitalChange('height', v)} min={30} max={250} unit="cm" placeholder="170" />
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100 w-fit">
                                <span className="text-blue-700 font-bold text-sm">IMC Calculado:</span>
                                <span className="text-blue-800 font-bold text-lg">{vitals.imc || '-'}</span>
                                <span className="text-blue-600 text-xs">kg/m²</span>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="consult-form"
                        disabled={loading}
                        className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200/50 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Guardar Consulta
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const NumericInput = ({
    label, value, onChange, min, max, unit = "", placeholder = ""
}: {
    label: string; value: string; onChange: (v: string) => void;
    min?: number; max?: number; unit?: string; placeholder?: string;
}) => (
    <div className="w-full">
        <label className="block text-xs uppercase font-bold text-gray-500 mb-1 ml-1">{label}</label>
        <div className="relative">
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${INPUT_CLASS} ${unit ? 'pr-8' : ''}`}
            />
            {unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">
                    {unit}
                </span>
            )}
        </div>
    </div>
);
