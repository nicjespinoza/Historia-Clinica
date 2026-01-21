import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { Patient, InitialHistory } from '../../types';

// Simple text block component for legacy data
const TextBlock = ({ label, value }: { label: string, value: any }) => {
    if (!value) return null;

    let displayValue = value;

    // Handle objects (legacy checkbox maps or migrated strings)
    if (typeof value === 'object') {
        if (value.list) {
            displayValue = value.list; // Legacy string list
        } else if (value.conditions) {
            // New format
            displayValue = Object.keys(value.conditions).filter(k => value.conditions[k]).join(', ');
        } else if (value.yes !== undefined) {
            displayValue = value.yes ? (value.description || value.which || value.list || 'Sí') : 'No';
        } else {
            displayValue = JSON.stringify(value);
        }
    }

    if (displayValue === 'No' || displayValue === '') return null;

    return (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="font-bold text-gray-700 text-sm uppercase mb-1">{label}</h4>
            <p className="text-gray-800 whitespace-pre-wrap">{String(displayValue)}</p>
        </div>
    );
};

export const LegacyHistoryScreen = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<InitialHistory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (patientId) {
                try {
                    const [p, h] = await Promise.all([
                        api.getPatient(patientId),
                        api.getHistories(patientId)
                    ]);
                    setPatient(p);
                    if (h && h.length > 0) {
                        setHistory(h[0]);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }
        };
        load();
    }, [patientId]);

    if (loading) return <div className="p-8 text-center">Cargando datos históricos...</div>;
    if (!patient) return <div className="p-8 text-center">Paciente no encontrado</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/app/profile/${patient.id}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200"
                    >
                        <ArrowLeft size={20} />
                        Volver al Perfil
                    </button>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-gray-900">Historia Clínica (Migrada)</h1>
                        <p className="text-gray-500">{patient.firstName} {patient.lastName}</p>
                    </div>
                </div>

                {!history ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
                        <h2 className="text-xl font-bold text-gray-800">No se encontró historia clínica</h2>
                        <p className="text-gray-500 mt-2">Este paciente parece tener datos migrados pero no se encontró la colección de historia clínica correspondiente.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 bg-[#084286] text-white">
                            <div className="flex items-center gap-3">
                                <FileText size={24} />
                                <h2 className="text-lg font-bold">Datos Históricos (Solo Lectura)</h2>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Motivo de Consulta */}
                            <section>
                                <h3 className="text-xl font-bold text-[#084286] mb-4 border-b pb-2">Motivo de Consulta</h3>
                                <div className="p-4 bg-blue-50 rounded-xl text-blue-900 font-medium">
                                    {/* Handle Motives Display */}
                                    {Array.isArray(history.motives) ?
                                        history.motives.join(', ') :
                                        (typeof history.motives === 'object' ?
                                            Object.keys(history.motives).filter(k => (history.motives as any)[k]).join(', ') :
                                            JSON.stringify(history.motives)
                                        )
                                    }
                                    {history.otherMotive && <span className="block mt-1 text-sm text-blue-700">Otros: {history.otherMotive}</span>}
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-bold text-gray-700 text-sm">Historia de la Enfermedad Actual</h4>
                                    <p className="text-gray-800 mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100">{history.historyOfPresentIllness || 'No registrado'}</p>
                                </div>
                            </section>

                            {/* Antecedentes */}
                            <section>
                                <h3 className="text-xl font-bold text-[#084286] mb-4 border-b pb-2">Antecedentes Patológicos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextBlock label="Neurológicos" value={history.neurological} />
                                    <TextBlock label="Metabólicos" value={history.metabolic} />
                                    <TextBlock label="Cardíacos" value={history.cardiac} />
                                    <TextBlock label="Respiratorios" value={history.respiratory} />
                                    <TextBlock label="Gastrointestinales" value={history.gastro} />
                                    <TextBlock label="Renales" value={history.renal} />
                                    <TextBlock label="Reumatológicos" value={history.rheumatological} />
                                    <TextBlock label="Infecciosos" value={history.infectious} />
                                    <TextBlock label="Alergias" value={history.allergies} />
                                    <TextBlock label="Cirugías" value={history.surgeries} />
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-[#084286] mb-4 border-b pb-2">Gineco-Obstétricos (Mujer)</h3>
                                <TextBlock label="Datos Ginecobstétricos" value={history.gyneco} />
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-[#084286] mb-4 border-b pb-2">Diagnóstico y Tratamiento</h3>
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-700 text-sm">Diagnóstico</h4>
                                    <p className="text-gray-800 mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100 whitespace-pre-line">{history.diagnosis || 'No registrado'}</p>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegacyHistoryScreen;
