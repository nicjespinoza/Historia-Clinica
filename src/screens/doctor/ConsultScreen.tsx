import React, { useState, useEffect, useMemo } from 'react';
import { Save, ArrowLeft, AlertCircle, Trash2, Plus, WifiOff } from 'lucide-react';
import { Patient, SubsequentConsult, PhysicalExam } from '../../types';
import { api } from '../../lib/api';
import { FloatingLabelInput } from '../../components/premium-ui/FloatingLabelInput';
import { CheckboxList, PhysicalExamSection } from '../../components/ui/FormComponents';
import * as C from '../../constants';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ObesityHistoryModal } from '../../components/ObesityHistoryModal';
import { useAuth } from '../../context/AuthContext';

const INPUT_CLASS = "w-full px-4 py-2.5 bg-gray-50 border-2 border-black text-gray-800 text-sm rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block transition-all duration-200 outline-none placeholder-gray-400 hover:bg-white";
const SECTION_TITLE_CLASS = "text-xl font-bold text-gray-800 mb-6 flex items-center gap-2";

const PANEL_BASICO_PRESET = `1. BHC
2. Glicemina
3. Creatimina
4. TP, TP, INR
5. Examen General de Orina
6. Tipo y PH`;

const PANEL_AMPLIADO_PRESET = `1. BHC
2. Glicemina
3. Hemoglobina Glicesilada A1C
4. Creatimina
5. Perful Hepatico
6. Perfil Hipidico
7. Perfil Tiroideo
8. Ionograma
9. Vitamina D3
10. Vitamina B12
11. Examen de Orina (360)
12. Ferritina
13. LDH
14. Acido Urico
15. V56
16. TPT
17. Tipo y RH`;

const PANEL_HECES_PRESET = `1. Citologia Fecal
2. Tincion de Kinyoun
3. Copuocultivo`;

export interface ConsultScreenProps {
    patients?: Patient[];
    setConsults?: React.Dispatch<React.SetStateAction<SubsequentConsult[]>>;
}

// Validación de signos vitales
const validateVitalSigns = (physicalExam: PhysicalExam): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // FC: 40-200 bpm
    if (physicalExam.fc) {
        const fc = parseFloat(physicalExam.fc);
        if (isNaN(fc) || fc < 40 || fc > 200) {
            errors.push('FC debe estar entre 40-200 lpm');
        }
    }

    // FR: 8-40 rpm
    if (physicalExam.fr) {
        const fr = parseFloat(physicalExam.fr);
        if (isNaN(fr) || fr < 8 || fr > 40) {
            errors.push('FR debe estar entre 8-40 rpm');
        }
    }

    // Temperatura: 34-42°C
    if (physicalExam.temp) {
        const temp = parseFloat(physicalExam.temp);
        if (isNaN(temp) || temp < 34 || temp > 42) {
            errors.push('Temperatura debe estar entre 34-42°C');
        }
    }

    // SatO2: 70-100%
    if (physicalExam.sat02) {
        const sat = parseFloat(physicalExam.sat02);
        if (isNaN(sat) || sat < 70 || sat > 100) {
            errors.push('SatO2 debe estar entre 70-100%');
        }
    }

    // Peso: 1-500 kg
    if (physicalExam.weight) {
        const weight = parseFloat(physicalExam.weight);
        if (isNaN(weight) || weight < 1 || weight > 500) {
            errors.push('Peso debe estar entre 1-500 kg');
        }
    }

    // Altura: 30-250 cm
    if (physicalExam.height) {
        const height = parseFloat(physicalExam.height);
        if (isNaN(height) || height < 30 || height > 250) {
            errors.push('Altura debe estar entre 30-250 cm');
        }
    }

    return { valid: errors.length === 0, errors };
};

const Section = ({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 ${className}`}>
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        {children}
    </div>
);

const NumericInput = ({
    label, value, onChange, min, max, step = "1", unit = "", placeholder = "", isOnline = true
}: {
    label: string; value: string; onChange: (v: string) => void;
    min?: number; max?: number; step?: string; unit?: string; placeholder?: string; isOnline?: boolean;
}) => {
    const baseClass = isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500');
    return (
        <div className="flex-1">
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${baseClass} ${unit ? 'pr-12' : ''}`}
                />
                {unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
};

export const ConsultScreen = ({ patients, setConsults }: ConsultScreenProps) => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useAuth();

    // Offline State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Dynamic Styles for Offline Mode
    const inputBorderClass = isOnline ? "border-black" : "border-red-500";

    const [patient, setPatient] = useState<Patient | null>(null);

    // Initial State (Default empty)
    const emptyConsult: Omit<SubsequentConsult, 'id'> = {
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5), // Real-time HH:mm format
        motives: {},
        otherMotive: '',
        evolutionTime: '',
        historyOfPresentIllness: '',
        physicalExam: {
            fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
            systems: C.SYSTEMS_LIST.reduce((acc, sys) => ({ ...acc, [sys]: { normal: true, abnormal: false, description: '' } }), {})
        },
        labs: {
            performed: { yes: false, no: true },
            results: ''
        },
        comments: '',
        diagnoses: [''],
        treatment: {
            food: '',
            meds: [''],
            exams: [''],
            norms: ['']
        },
        status: role === 'assistant' ? 'draft' : 'completed',
        obesityHistory: undefined
    };

    const [c, setC] = useState<SubsequentConsult | Omit<SubsequentConsult, 'id'>>(emptyConsult);
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showObesityModal, setShowObesityModal] = useState(false);

    // Load Patient & Draft Data
    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                const p = await api.getPatient(patientId);
                setPatient(p);

                // If we have a consult in location state (Edit or Complete Draft), load it
                if (location.state?.consult) {
                    const existingConsult = location.state.consult as SubsequentConsult;
                    setC(existingConsult);
                } else if (p) {
                    setC(prev => ({ ...prev, patientId: p.id }));
                }
            }
        };
        loadPatient();
    }, [patientId, location.state]);

    // Calcular IMC automáticamente
    const calculatedImc = useMemo(() => {
        const weight = parseFloat(c.physicalExam.weight);
        const heightCm = parseFloat(c.physicalExam.height);
        if (weight > 0 && heightCm > 0) {
            const heightM = heightCm / 100;
            return (weight / (heightM * heightM)).toFixed(1);
        }
        return '';
    }, [c.physicalExam.weight, c.physicalExam.height]);

    // Clafisicación IMC
    const getIMCClassification = (imc: number): string => {
        if (imc < 18.5) return 'Bajo peso';
        if (imc < 25) return 'Peso normal';
        if (imc < 30) return 'Sobrepeso';
        if (imc < 35) return 'Obesidad de clase I';
        if (imc < 40) return 'Obesidad de clase II';
        return 'Obesidad de clase III (mórbida)';
    };

    // Actualizar IMC cuando cambia peso o altura
    React.useEffect(() => {
        if (calculatedImc && calculatedImc !== c.physicalExam.imc) {
            setC(prev => ({
                ...prev,
                physicalExam: { ...prev.physicalExam, imc: calculatedImc }
            }));
        }
    }, [calculatedImc]);

    const handleMotiveChange = (motive: string, checked: boolean) => {
        setC(prev => ({
            ...prev,
            motives: { ...prev.motives, [motive]: checked }
        }));

        // Open modal if Obesidad is checked
        if (motive === 'Obesidad' && checked) {
            setShowObesityModal(true);
        }
    };

    const handleDiagnosisChange = (index: number, value: string) => {
        setC(prev => {
            const newDiagnoses = [...prev.diagnoses];
            newDiagnoses[index] = value;
            return { ...prev, diagnoses: newDiagnoses };
        });
    };

    // Diagnosis Handlers
    const addDiagnosis = () => {
        setC(prev => ({ ...prev, diagnoses: [...prev.diagnoses, ''] }));
    };

    const removeDiagnosis = (index: number) => {
        setC(prev => {
            const newDiagnoses = prev.diagnoses.filter((_, i) => i !== index);
            return { ...prev, diagnoses: newDiagnoses };
        });
    };

    // Medical Orders Handlers
    const addMedicalOrder = (
        type: 'prescription' | 'lab_general' | 'lab_basic' | 'lab_extended' | 'lab_feces' | 'image' | 'endoscopy',
        defaultContent: string = ''
    ) => {
        setC(prev => ({
            ...prev,
            medicalOrders: [
                ...(prev.medicalOrders || []),
                {
                    id: Date.now().toString() + Math.random().toString(),
                    type,
                    diagnosis: '',
                    content: defaultContent
                }
            ]
        }));
    };

    const updateMedicalOrder = (id: string, field: 'diagnosis' | 'content', value: string) => {
        setC(prev => ({
            ...prev,
            medicalOrders: (prev.medicalOrders || []).map(order =>
                order.id === id ? { ...order, [field]: value } : order
            )
        }));
    };

    const removeMedicalOrder = (id: string) => {
        setC(prev => ({
            ...prev,
            medicalOrders: (prev.medicalOrders || []).filter(order => order.id !== id)
        }));
    };

    const handleArrayFieldChange = (
        field: 'meds' | 'exams' | 'norms',
        index: number,
        value: string
    ) => {
        setC(prev => {
            // @ts-ignore
            const newArr = [...prev.treatment[field]];
            newArr[index] = value;
            return { ...prev, treatment: { ...prev.treatment, [field]: newArr } };
        });
    };

    const addArrayField = (field: 'meds' | 'exams' | 'norms') => {
        setC(prev => ({
            ...prev,
            // @ts-ignore
            treatment: { ...prev.treatment, [field]: [...prev.treatment[field], ''] }
        }));
    };

    const handleSave = async () => {
        const validation = validateVitalSigns(c.physicalExam);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }
        setValidationErrors([]);

        setSaving(true);
        try {
            // Set status based on role or keep existing if completing
            // If role is assistant, always save as draft
            // If role is doctor, set to completed (unless explicitly editing a draft to keep it draft? No, doctors usually complete)
            // Logic: 
            // - Assistant creating/editing -> always draft
            // - Doctor creating -> completed
            // - Doctor editing draft -> completed (completing it)
            // - Doctor editing completed -> completed

            let statusToSave: 'draft' | 'completed' = 'completed';
            if (role === 'assistant') {
                statusToSave = 'draft';
            }

            const dataToSave = { ...c, status: statusToSave };

            if ('id' in c && c.id) {
                // Update existing (Draft or Edit)
                await api.updateConsult(c.id, dataToSave);
            } else {
                // Create new
                await api.createConsult(dataToSave);
            }

            navigate(`/app/profile/${patient?.id}`);
        } catch (e) {
            console.error(e);
            alert("Error al guardar consulta");
        } finally {
            setSaving(false);
        }
    };

    if (!patient) {
        return <div className="p-8 text-center text-gray-500">Paciente no encontrado.</div>;
    }

    if (!patient) {
        return <div className="p-8 text-center text-gray-500">Paciente no encontrado.</div>;
    }

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: '#083c79' }}>
            <ObesityHistoryModal
                isOpen={showObesityModal}
                onClose={() => setShowObesityModal(false)}
                onSave={(data) => {
                    setC(prev => ({ ...prev, obesityHistory: data }));
                    setShowObesityModal(false);
                }}
                initialData={c.obesityHistory}
            />

            <div className="max-w-5xl mx-auto p-4 pb-32">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white p-4 rounded-b-xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center text-[#083c79] border-b-4 border-yellow-400">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Consulta Subsecuente</h2>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                            <div>
                                <span className="opacity-70 uppercase mr-1">Fecha:</span>
                                <input
                                    type="date"
                                    value={c.date}
                                    onChange={e => setC({ ...c, date: e.target.value })}
                                    className="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-800 outline-none focus:border-yellow-400"
                                />
                            </div>
                            <div>
                                <span className="opacity-70 uppercase mr-1">HORA:</span>
                                <input
                                    type="time"
                                    value={c.time}
                                    onChange={e => setC({ ...c, time: e.target.value })}
                                    className="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-800 outline-none focus:border-yellow-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="text-right hidden md:block">
                            <p className="font-bold">{patient.firstName} {patient.lastName}</p>
                            <p className="text-xs text-blue-600">{patient.ageDetails}</p>
                        </div>



                        <button
                            onClick={() => navigate(-1)}
                            className="bg-gray-100 hover:bg-gray-200 text-[#083c79] px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 border border-gray-200"
                        >
                            <ArrowLeft size={18} /> Regresar
                        </button>
                    </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                            <AlertCircle size={20} />
                            Errores de Validación
                        </div>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                {/* Motivo de Consulta - SYNCED WITH INITIAL HISTORY */}
                <Section title="Motivo de Consulta">
                    <CheckboxList
                        items={C.MOTIVES_LIST}
                        data={c.motives}
                        onChange={(motive, checked) => handleMotiveChange(motive, checked)}
                    />

                    {c.motives['Obesidad'] && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => setShowObesityModal(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                            >
                                Ver detalles de Obesidad
                            </button>
                        </div>
                    )}

                    <div className="mt-6">
                        <FloatingLabelInput
                            label="Otros Motivos"
                            value={c.otherMotive}
                            onChange={e => setC({ ...c, otherMotive: e.target.value })}
                            wrapperClassName={`border-2 ${inputBorderClass}`}
                        />
                    </div>
                    <div className="mt-4">
                        <FloatingLabelInput
                            label="Tiempo de evolución"
                            value={c.evolutionTime}
                            onChange={e => setC({ ...c, evolutionTime: e.target.value })}
                            placeholder="Ej: 3 días, 2 semanas..."
                            wrapperClassName={`border-2 ${inputBorderClass}`}
                        />
                    </div>
                </Section>

                {/* Historia de Enfermedad Actual - Hidden for Assistant */}
                {role !== 'assistant' && (
                    <Section title="Historia de Enfermedad Actual">
                        <FloatingLabelInput
                            label="Descripción detallada"
                            as="textarea"
                            rows={4}
                            value={c.historyOfPresentIllness}
                            onChange={e => setC({ ...c, historyOfPresentIllness: e.target.value })}
                            wrapperClassName={`border-2 ${inputBorderClass}`}
                        />
                    </Section>
                )}

                {/* Examen Físico con inputs numéricos */}
                <Section title="Signos Vitales">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <NumericInput
                            label="FC"
                            value={c.physicalExam.fc}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, fc: v } })}
                            min={40} max={200} unit="lpm" placeholder="60-100"
                            isOnline={isOnline}
                        />
                        <NumericInput
                            label="FR"
                            value={c.physicalExam.fr}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, fr: v } })}
                            min={8} max={40} unit="rpm" placeholder="12-20"
                            isOnline={isOnline}
                        />
                        <NumericInput
                            label="Temperatura"
                            value={c.physicalExam.temp}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, temp: v } })}
                            min={34} max={42} step="0.1" unit="°C" placeholder="36.5"
                            isOnline={isOnline}
                        />
                        <NumericInput
                            label="SatO2"
                            value={c.physicalExam.sat02}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, sat02: v } })}
                            min={70} max={100} unit="%" placeholder="95-100"
                            isOnline={isOnline}
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <FloatingLabelInput
                            label="PA (mmHg)"
                            value={c.physicalExam.pa}
                            onChange={e => setC({ ...c, physicalExam: { ...c.physicalExam, pa: e.target.value } })}
                            placeholder="120/80"
                            wrapperClassName={`border-2 ${inputBorderClass}`}
                        />
                        <FloatingLabelInput
                            label="PAM (mmHg)"
                            value={c.physicalExam.pam}
                            onChange={e => setC({ ...c, physicalExam: { ...c.physicalExam, pam: e.target.value } })}
                            placeholder="93"
                            wrapperClassName={`border-2 ${inputBorderClass}`}
                        />
                        <NumericInput
                            label="Peso"
                            value={c.physicalExam.weight}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, weight: v } })}
                            min={1} max={500} step="0.1" unit="kg" placeholder="70"
                        />
                        <NumericInput
                            label="Altura"
                            value={c.physicalExam.height}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, height: v } })}
                            min={30} max={250} unit="cm" placeholder="170"
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                            <span className="text-blue-700 font-bold">IMC:</span>
                            <span className="text-blue-600">{c.physicalExam.imc || '-'} kg/m²</span>
                        </div>
                        {c.physicalExam.imc && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-blue-800 font-bold text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {getIMCClassification(parseFloat(c.physicalExam.imc))}
                                </p>
                            </div>
                        )}
                    </div>
                </Section>

                {/* Examen por Sistemas */}
                {role !== 'assistant' && (
                    <PhysicalExamSection data={c.physicalExam} onChange={(d) => setC({ ...c, physicalExam: d })} hideVitals={true} />
                )}

                {/* Laboratorios */}
                {role !== 'assistant' && (
                    <Section title="Exámenes o estudios diagnósticos previos:" className="mt-12">
                        <div className="flex gap-6 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="labs"
                                    checked={c.labs.performed.yes}
                                    onChange={() => setC({ ...c, labs: { ...c.labs, performed: { yes: true, no: false } } })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span>Realizados</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="labs"
                                    checked={c.labs.performed.no}
                                    onChange={() => setC({ ...c, labs: { ...c.labs, performed: { yes: false, no: true } } })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span>No realizados</span>
                            </label>
                        </div>
                        {c.labs.performed.yes && (
                            <FloatingLabelInput
                                label="Resultados"
                                as="textarea"
                                rows={3}
                                value={c.labs.results}
                                onChange={e => setC({ ...c, labs: { ...c.labs, results: e.target.value } })}
                                wrapperClassName="border-2 border-black"
                            />
                        )}
                    </Section>
                )}

                {/* Comentarios */}
                {role !== 'assistant' && (
                    <Section title="Comentarios">
                        <FloatingLabelInput
                            label="Observaciones adicionales"
                            as="textarea"
                            rows={3}
                            value={c.comments}
                            onChange={e => setC({ ...c, comments: e.target.value })}
                            wrapperClassName={`border-2 ${inputBorderClass}`}
                        />
                    </Section>
                )}

                {/* Diagnósticos */}
                {role !== 'assistant' && (
                    <Section title="Diagnósticos">
                        <div className="space-y-3">
                            {c.diagnoses.map((dx, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                        {i + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={dx}
                                        onChange={e => handleDiagnosisChange(i, e.target.value)}
                                        placeholder={`Diagnóstico ${i + 1}`}
                                        className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                    />
                                    {c.diagnoses.length > 1 && (
                                        <button
                                            onClick={() => removeDiagnosis(i)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={addDiagnosis}
                                className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1 mt-2"
                            >
                                <Plus size={16} /> Agregar diagnóstico
                            </button>
                        </div>
                    </Section>
                )}

                {/* Plan de Tratamiento */}
                {role !== 'assistant' && (
                    <Section title="Plan de Tratamiento">
                        <div className="space-y-6">
                            {/* Alimentación */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Indicaciones dietéticas</h4>
                                <FloatingLabelInput
                                    label="Detalles de alimentación"
                                    as="textarea"
                                    rows={2}
                                    value={c.treatment.food}
                                    onChange={e => setC({ ...c, treatment: { ...c.treatment, food: e.target.value } })}
                                    wrapperClassName={`border-2 ${inputBorderClass}`}
                                />
                            </div>

                            {/* Medicamentos */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Medicamentos</h4>
                                {c.treatment.meds.map((med, i) => (
                                    <div key={i} className="mb-2">
                                        <input
                                            type="text"
                                            value={med}
                                            onChange={e => handleArrayFieldChange('meds', i, e.target.value)}
                                            placeholder="Medicamento y dosis..."
                                            className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                        />
                                    </div>
                                ))}
                                <button onClick={() => addArrayField('meds')} className="text-blue-600 text-sm hover:underline">+ Agregar medicamento</button>
                            </div>

                            {/* Exámenes */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Exámenes</h4>
                                {c.treatment.exams.map((exam, i) => (
                                    <div key={i} className="mb-2">
                                        <input
                                            type="text"
                                            value={exam}
                                            onChange={e => handleArrayFieldChange('exams', i, e.target.value)}
                                            placeholder="Examen..."
                                            className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                        />
                                    </div>
                                ))}
                                <button onClick={() => addArrayField('exams')} className="text-blue-600 text-sm hover:underline">+ Agregar examen</button>
                            </div>

                            {/* Normas */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Normas e Indicaciones</h4>
                                {c.treatment.norms.map((norm, i) => (
                                    <div key={i} className="mb-2">
                                        <input
                                            type="text"
                                            value={norm}
                                            onChange={e => handleArrayFieldChange('norms', i, e.target.value)}
                                            placeholder="Indicación..."
                                            className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                        />
                                    </div>
                                ))}
                                <button onClick={() => addArrayField('norms')} className="text-blue-600 text-sm hover:underline">+ Agregar indicación</button>
                            </div>
                        </div>
                    </Section>
                )}

                {/* Orden Médica Section */}
                {role !== 'assistant' && (
                    <Section title="Orden Médica">
                        {/* Toolbar to add orders */}
                        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <button
                                onClick={() => addMedicalOrder('prescription')}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Receta
                            </button>

                            <div className="relative group">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2">
                                    <Plus size={16} /> Laboratorio
                                </button>
                                {/* Bridge to prevent closing on hover */}
                                <div className="absolute top-full left-0 w-full h-4 bg-transparent z-10 hidden group-hover:block -mt-2"></div>
                                <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 hidden group-hover:block">
                                    <button onClick={() => addMedicalOrder('lab_general')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">General</button>
                                    <button onClick={() => addMedicalOrder('lab_basic', PANEL_BASICO_PRESET)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Panel Básico</button>
                                    <button onClick={() => addMedicalOrder('lab_extended', PANEL_AMPLIADO_PRESET)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Panel Ampliado</button>
                                    <button onClick={() => addMedicalOrder('lab_feces', PANEL_HECES_PRESET)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Panel Heces</button>
                                </div>
                            </div>

                            <button
                                onClick={() => addMedicalOrder('image')}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Imágenes
                            </button>

                            <button
                                onClick={() => addMedicalOrder('endoscopy')}
                                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Endoscopia
                            </button>
                        </div>

                        {/* List of Orders */}
                        <div className="space-y-6">
                            {(c.medicalOrders || []).map((order, i) => (
                                <div key={order.id} className="relative bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm group">
                                    <button
                                        onClick={() => removeMedicalOrder(order.id)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="mb-4 flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${order.type === 'prescription' ? 'bg-emerald-100 text-emerald-700' :
                                            order.type.startsWith('lab') ? 'bg-blue-100 text-blue-700' :
                                                order.type === 'image' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.type === 'prescription' ? 'Receta' :
                                                order.type === 'lab_general' ? 'Laboratorio General' :
                                                    order.type === 'lab_basic' ? 'Panel Básico' :
                                                        order.type === 'lab_extended' ? 'Panel Ampliado' :
                                                            order.type === 'lab_feces' ? 'Panel Heces' :
                                                                order.type === 'image' ? 'Orden Imágenes' : 'Orden Endoscopia'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Diagnóstico</label>
                                            <input
                                                type="text"
                                                value={order.diagnosis}
                                                onChange={e => updateMedicalOrder(order.id, 'diagnosis', e.target.value)}
                                                className={INPUT_CLASS}
                                                placeholder="Diagnóstico..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                                                {order.type === 'prescription' ? 'Medicamentos e Indicaciones' :
                                                    order.type === 'lab_basic' ? 'Panel Básico' :
                                                        order.type === 'lab_extended' ? 'Panel Ampliado' :
                                                            order.type === 'lab_feces' ? 'Panel Heces' :
                                                                order.type.startsWith('lab') ? 'Exámenes Solicitados' :
                                                                    order.type === 'image' ? 'Estudios de Imagen' : 'Procedimiento Endoscópico'}
                                            </label>
                                            <textarea
                                                value={order.content}
                                                onChange={e => updateMedicalOrder(order.id, 'content', e.target.value)}
                                                className={INPUT_CLASS}
                                                rows={order.type.startsWith('lab') ? 8 : 4}
                                                placeholder="Detalles..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}


                {/* Floating Save Button - Elegant & Compact */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`fixed bottom-8 right-8 ${isOnline ? 'bg-slate-900 shadow-xl' : 'bg-red-600 shadow-red-600/30'} text-white px-6 py-3 rounded-full font-semibold hover:scale-105 active:scale-95 transition-all duration-300 z-50 flex items-center gap-2 ring-1 ring-white/20 backdrop-blur-md`}
                >
                    {isOnline ? (
                        <Save size={20} className={saving ? "animate-spin" : ""} />
                    ) : (
                        <WifiOff size={20} />
                    )}
                    <span className="tracking-wide">
                        {saving ? '...' : (isOnline ? 'Guardar' : 'Guardar en Local')}
                    </span>
                </button>
            </div>
        </div >
    );
};
