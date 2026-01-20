import React, { useState, useEffect, useMemo } from 'react';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { Patient, SubsequentConsult, PhysicalExam } from '../types';
import { api } from '../lib/api';
import { FloatingLabelInput } from '../components/premium-ui/FloatingLabelInput';
import { CheckboxList, PhysicalExamSection } from '../components/ui/FormComponents';
import * as C from '../constants';
import { useParams, useNavigate } from 'react-router-dom';
import { ObesityHistoryModal } from '../components/ObesityHistoryModal';

const INPUT_CLASS = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block transition-all duration-200 outline-none placeholder-gray-400 hover:bg-white";
const SECTION_TITLE_CLASS = "text-xl font-bold text-gray-800 mb-6 flex items-center gap-2";

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

export const ConsultScreen = ({ patients, setConsults }: ConsultScreenProps) => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);

    const [c, setC] = useState<Omit<SubsequentConsult, 'id'>>({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        motives: {},
        otherMotive: '',
        evolutionTime: '',
        historyOfPresentIllness: '',
        physicalExam: {
            fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
            systems: {}
        },
        labs: {
            performed: { yes: false, no: true },
            results: ''
        },
        comments: '',
        diagnoses: ['', '', '', '', ''],
        treatment: {
            food: '',
            meds: [''],
            exams: [''],
            norms: ['']
        }
    });

    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showObesityModal, setShowObesityModal] = useState(false);

    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                const p = await api.getPatient(patientId);
                setPatient(p);
                if (p) {
                    setC(prev => ({ ...prev, patientId: p.id }));
                }
            }
        };
        loadPatient();
    }, [patientId]);

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
    };

    const handleDiagnosisChange = (index: number, value: string) => {
        setC(prev => {
            const newDiagnoses = [...prev.diagnoses];
            newDiagnoses[index] = value;
            return { ...prev, diagnoses: newDiagnoses };
        });
    };

    const handleArrayFieldChange = (
        field: 'meds' | 'exams' | 'norms',
        index: number,
        value: string
    ) => {
        setC(prev => {
            const newArr = [...prev.treatment[field]];
            newArr[index] = value;
            return { ...prev, treatment: { ...prev.treatment, [field]: newArr } };
        });
    };

    const addArrayField = (field: 'meds' | 'exams' | 'norms') => {
        setC(prev => ({
            ...prev,
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
            await api.createConsult(c);
            navigate(`/app/profile/${patient?.id}`);
        } catch (e) {
            console.error(e);
            alert("Error al guardar consulta");
        } finally {
            setSaving(false);
        }
    };

    const Section = ({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) => (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 ${className}`}>
            <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
            {children}
        </div>
    );

    const NumericInput = ({
        label, value, onChange, min, max, step = "1", unit = "", placeholder = ""
    }: {
        label: string; value: string; onChange: (v: string) => void;
        min?: number; max?: number; step?: string; unit?: string; placeholder?: string;
    }) => (
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
                    className={`${INPUT_CLASS} ${unit ? 'pr-12' : ''}`}
                />
                {unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );

    if (!patient) {
        return <div className="p-8 text-center text-gray-500">Paciente no encontrado.</div>;
    }

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: '#083c79' }}>
            <ObesityHistoryModal
                isOpen={showObesityModal}
                onClose={() => setShowObesityModal(false)}
                data={c.motives}
                onChange={handleMotiveChange}
            />

            <div className="max-w-5xl mx-auto p-4 pb-32">
                {/* Header */}
                <div className="bg-white p-6 rounded-t-2xl border-b border-gray-200 mb-8 shadow-sm relative">
                    <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Consulta Subsecuente</h2>
                    <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-gray-400">Fecha</span>
                            <input type="date" value={c.date} onChange={e => setC({ ...c, date: e.target.value })} className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-gray-400">Hora</span>
                            <input type="time" value={c.time} onChange={e => setC({ ...c, time: e.target.value })} className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-gray-400">Paciente</span>
                            <span className="font-medium text-gray-800">{patient.firstName} {patient.lastName} ({patient.ageDetails})</span>
                        </div>
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
                        />
                    </div>
                    <div className="mt-4">
                        <FloatingLabelInput
                            label="Tiempo de evolución"
                            value={c.evolutionTime}
                            onChange={e => setC({ ...c, evolutionTime: e.target.value })}
                            placeholder="Ej: 3 días, 2 semanas..."
                        />
                    </div>
                </Section>

                {/* Historia de Enfermedad Actual */}
                <Section title="Historia de Enfermedad Actual">
                    <FloatingLabelInput
                        label="Descripción detallada"
                        as="textarea"
                        rows={4}
                        value={c.historyOfPresentIllness}
                        onChange={e => setC({ ...c, historyOfPresentIllness: e.target.value })}
                    />
                </Section>

                {/* Examen Físico con inputs numéricos */}
                <Section title="Signos Vitales">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <NumericInput
                            label="FC"
                            value={c.physicalExam.fc}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, fc: v } })}
                            min={40} max={200} unit="lpm" placeholder="60-100"
                        />
                        <NumericInput
                            label="FR"
                            value={c.physicalExam.fr}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, fr: v } })}
                            min={8} max={40} unit="rpm" placeholder="12-20"
                        />
                        <NumericInput
                            label="Temperatura"
                            value={c.physicalExam.temp}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, temp: v } })}
                            min={34} max={42} step="0.1" unit="°C" placeholder="36.5"
                        />
                        <NumericInput
                            label="SatO2"
                            value={c.physicalExam.sat02}
                            onChange={v => setC({ ...c, physicalExam: { ...c.physicalExam, sat02: v } })}
                            min={70} max={100} unit="%" placeholder="95-100"
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <FloatingLabelInput
                            label="PA (mmHg)"
                            value={c.physicalExam.pa}
                            onChange={e => setC({ ...c, physicalExam: { ...c.physicalExam, pa: e.target.value } })}
                            placeholder="120/80"
                        />
                        <FloatingLabelInput
                            label="PAM (mmHg)"
                            value={c.physicalExam.pam}
                            onChange={e => setC({ ...c, physicalExam: { ...c.physicalExam, pam: e.target.value } })}
                            placeholder="93"
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
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                        <span className="text-blue-700 font-bold">IMC:</span>
                        <span className="text-blue-600">{c.physicalExam.imc || '-'} kg/m²</span>
                    </div>
                </Section>

                {/* Examen por Sistemas */}
                <PhysicalExamSection data={c.physicalExam} onChange={(d) => setC({ ...c, physicalExam: d })} />

                {/* Laboratorios */}
                <Section title="Laboratorios">
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
                        />
                    )}
                </Section>

                {/* Comentarios */}
                <Section title="Comentarios">
                    <FloatingLabelInput
                        label="Observaciones adicionales"
                        as="textarea"
                        rows={3}
                        value={c.comments}
                        onChange={e => setC({ ...c, comments: e.target.value })}
                    />
                </Section>

                {/* Diagnósticos */}
                <Section title="Diagnósticos">
                    <div className="space-y-3">
                        {c.diagnoses.map((dx, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                    {i + 1}
                                </span>
                                <input
                                    type="text"
                                    value={dx}
                                    onChange={e => handleDiagnosisChange(i, e.target.value)}
                                    placeholder={`Diagnóstico ${i + 1}`}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Plan de Tratamiento */}
                <Section title="Plan de Tratamiento">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Alimentación</h4>
                            <FloatingLabelInput
                                label="Indicaciones dietéticas"
                                as="textarea"
                                rows={2}
                                value={c.treatment.food}
                                onChange={e => setC({ ...c, treatment: { ...c.treatment, food: e.target.value } })}
                            />
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Medicamentos</h4>
                            {c.treatment.meds.map((med, i) => (
                                <div key={i} className="mb-2">
                                    <input
                                        type="text"
                                        value={med}
                                        onChange={e => handleArrayFieldChange('meds', i, e.target.value)}
                                        placeholder="Medicamento, dosis, frecuencia..."
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            ))}
                            <button onClick={() => addArrayField('meds')} className="text-blue-600 text-sm hover:underline">+ Agregar medicamento</button>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Exámenes a solicitar</h4>
                            {c.treatment.exams.map((exam, i) => (
                                <div key={i} className="mb-2">
                                    <input
                                        type="text"
                                        value={exam}
                                        onChange={e => handleArrayFieldChange('exams', i, e.target.value)}
                                        placeholder="Examen..."
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            ))}
                            <button onClick={() => addArrayField('exams')} className="text-blue-600 text-sm hover:underline">+ Agregar examen</button>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Normas e Indicaciones</h4>
                            {c.treatment.norms.map((norm, i) => (
                                <div key={i} className="mb-2">
                                    <input
                                        type="text"
                                        value={norm}
                                        onChange={e => handleArrayFieldChange('norms', i, e.target.value)}
                                        placeholder="Indicación..."
                                        className={INPUT_CLASS}
                                    />
                                </div>
                            ))}
                            <button onClick={() => addArrayField('norms')} className="text-blue-600 text-sm hover:underline">+ Agregar indicación</button>
                        </div>
                    </div>
                </Section>

                {/* Botón Guardar */}
                <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 flex justify-center md:justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={20} /> Guardar Consulta
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
