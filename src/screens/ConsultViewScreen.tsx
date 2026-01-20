import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Patient, SubsequentConsult } from '../types';
import { ArrowLeft, Calendar, Activity, Stethoscope, Pill, Clipboard, Printer } from 'lucide-react';


export const ConsultViewScreen = () => {
    const { patientId, consultId } = useParams<{ patientId: string; consultId: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [consult, setConsult] = useState<SubsequentConsult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // HELPER: Normalize migrated data to match component expectations
    const normalizeConsultData = (data: any): SubsequentConsult => {
        const normalized = { ...data };

        // 1. Map History / Reason
        if (!normalized.historyOfPresentIllness) {
            normalized.historyOfPresentIllness = data.evolutionNotes || data.reason || '';
        }

        // 2. Map Treatment Fields
        if (data.treatment) {
            if (!normalized.treatment) normalized.treatment = {};

            // Meds: migrated 'medications' -> component 'meds'
            if (!normalized.treatment.meds && data.treatment.medications) {
                normalized.treatment.meds = data.treatment.medications;
            }
            // Norms/Instructions: migrated 'instructions' -> component 'norms'
            if (!normalized.treatment.norms && data.treatment.instructions) {
                normalized.treatment.norms = Array.isArray(data.treatment.instructions)
                    ? data.treatment.instructions
                    : [data.treatment.instructions];
            }
        }

        // 3. Map Vitals (Migrated 'vitalSigns' -> Component 'physicalExam')
        if (data.vitalSigns && !normalized.physicalExam) {
            normalized.physicalExam = {
                pa: data.vitalSigns.bloodPressure,
                fc: data.vitalSigns.heartRate,
                temp: data.vitalSigns.temperature,
                weight: data.vitalSigns.weight,
                talla: data.vitalSigns.height,
                // Map other matching fields if necessary
            };
        }

        return normalized as SubsequentConsult;
    };

    useEffect(() => {
        const loadData = async () => {
            if (!patientId || !consultId) return;
            try {
                setLoading(true);
                const p = await api.getPatient(patientId);
                setPatient(p);

                // Fetch specific consult (using unified API that handles new and migrated data)
                const consultData = await api.getConsult(patientId, consultId);

                if (consultData) {
                    setConsult(normalizeConsultData(consultData));
                } else {
                    setError('Consulta no encontrada.');
                }

            } catch (err) {
                console.error('Error loading data:', err);
                setError('Error al cargar la información.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [patientId, consultId]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Sin fecha';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const renderPhysicalExam = (c: SubsequentConsult) => {
        const systems = c.physicalExam?.systems || {};
        const entries = Object.entries(systems).filter(([_, val]) => val.abnormal || val.description);

        if (entries.length === 0) return null;

        const labelMap: Record<string, string> = {
            piel: 'Piel', cabeza: 'Cabeza', cuello: 'Cuello', torax: 'Tórax',
            cardiaco: 'Cardíaco', pulmonar: 'Pulmonar', abdomen: 'Abdomen',
            miembrosuper: 'Miembros Sup.', miembroinfe: 'Miembros Inf.',
            neuro: 'Neurológico', genitales: 'Genitales', tacto: 'Tacto Rectal'
        };

        return (
            <div className="mt-4 break-inside-avoid">
                <h4 className="text-sm font-bold text-gray-600 uppercase mb-2 flex items-center gap-2">
                    <Stethoscope size={16} /> Examen Físico (Hallazgos)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {entries.map(([key, val]) => (
                        <div key={key} className={`p-2 rounded-lg text-xs ${val.abnormal ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                            <span className="font-bold">{labelMap[key] || key}:</span> {val.abnormal ? 'Anormal' : 'Normal'}
                            {val.description && <span className="block text-[10px] opacity-80 mt-1">{val.description}</span>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-[#083c79] font-bold animate-pulse">Cargando consulta...</div></div>;

    if (error || !consult) return (
        <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
            <p className="text-red-600 font-bold mb-4">{error || 'Error desconocido'}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300">
                Volver
            </button>
        </div>
    );

    // Helper for safe list joining
    const joinList = (list: string[] | string) => Array.isArray(list) ? list.join(', ') : list;
    const formatMotives = (motives: any) => {
        if (!motives) return '';
        return Object.entries(motives)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .join(', ');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 print:hidden shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[#083c79]">Detalle de Consulta</h1>
                            <p className="text-sm text-gray-500">
                                {patient?.firstName} {patient?.lastName} • {formatDate(consult.date)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-[#083c79] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10"
                    >
                        <Printer size={18} /> Imprimir
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl my-8 p-8 md:p-12 min-h-[29.7cm] print:shadow-none print:my-0 print:p-0 print:w-full">

                {/* Print Header */}
                <div className="border-b-4 border-[#083c79] pb-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-extrabold text-[#083c79] tracking-tight mb-1">CONSULTA MÉDICA</h1>
                        <div className="text-sm font-medium text-gray-500">
                            Fecha: {formatDate(consult.date)} | Hora: {consult.time}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-gray-800">{patient?.firstName} {patient?.lastName}</h2>
                        <p className="text-xs text-gray-600">ID: {patient?.legacyIdSistema || patient?.id}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Vitals */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 break-inside-avoid">
                        <h3 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                            <Activity size={14} /> Signos Vitales
                        </h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                            {[
                                { l: 'FC', v: consult.physicalExam?.fc },
                                { l: 'FR', v: consult.physicalExam?.fr },
                                { l: 'Temp', v: consult.physicalExam?.temp, u: '°C' },
                                { l: 'PA', v: consult.physicalExam?.pa },
                                { l: 'SatO2', v: consult.physicalExam?.sat02, u: '%' },
                                { l: 'Peso', v: consult.physicalExam?.weight, u: 'lb' }, // Assuming lbs based on context or kg
                            ].map((item, i) => (
                                <div key={i}>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{item.l}</p>
                                    <p className="font-bold text-[#083c79] text-lg">
                                        {item.v || '--'} <span className="text-xs font-normal text-gray-400">{item.u}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Motives & History */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
                        <div>
                            <span className="font-bold text-[#083c79] text-sm uppercase block mb-1">Motivo de Consulta</span>
                            <p className="text-gray-900 font-medium">
                                {formatMotives(consult.motives)}
                                {consult.otherMotive && (consult.motives ? `, ${consult.otherMotive}` : consult.otherMotive)}
                            </p>
                            {consult.evolutionTime && (
                                <p className="text-sm text-gray-600 mt-2">
                                    <span className="font-bold">Evolución:</span> {consult.evolutionTime}
                                </p>
                            )}
                        </div>
                        <div>
                            <span className="font-bold text-[#083c79] text-sm uppercase block mb-1">Historia de la enfermedad actual</span>
                            <p className="text-gray-900 text-sm textual-justify leading-relaxed whitespace-pre-line">
                                {consult.historyOfPresentIllness || 'Sin descripción.'}
                            </p>
                        </div>
                    </div>

                    {renderPhysicalExam(consult)}

                    {/* Diagnosis */}
                    <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 break-inside-avoid">
                        <h3 className="text-sm font-bold text-green-800 uppercase mb-2 flex items-center gap-2">
                            <Clipboard size={16} /> Diagnóstico
                        </h3>
                        {consult.diagnoses && consult.diagnoses.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                                {consult.diagnoses.map((d, i) => d && <li key={i} className="text-green-900 font-medium">{d}</li>)}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic text-sm">No registrado</p>
                        )}
                    </div>

                    {/* Treatment */}
                    <div className="break-inside-avoid">
                        <h3 className="text-sm font-bold text-white bg-[#083c79] px-3 py-1.5 rounded-t inline-block uppercase tracking-wide">
                            Plan y Tratamiento
                        </h3>
                        <div className="border border-gray-200 rounded-b-lg rounded-tr-lg p-6 bg-white shadow-sm space-y-6">
                            {/* Meds */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-2">
                                        <Pill size={14} /> Medicamentos
                                    </h4>
                                    <div className="bg-purple-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-line">
                                        {joinList(consult.treatment?.meds) || 'Ninguno'}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2">Alimentación / Dieta</h4>
                                    <div className="bg-yellow-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-line">
                                        {consult.treatment?.food || 'Ninguna indicación'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Exámenes Solicitados</h4>
                                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-line">
                                        {joinList(consult.treatment?.exams) || 'Ninguno'}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Recomendaciones / Normas</h4>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-line">
                                        {joinList(consult.treatment?.norms) || 'Ninguna'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments */}
                    {consult.comments && (
                        <div className="border-t pt-4">
                            <span className="font-bold text-gray-400 text-xs uppercase">Comentarios Adicionales</span>
                            <p className="text-gray-600 text-sm mt-1 italic">{consult.comments}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
