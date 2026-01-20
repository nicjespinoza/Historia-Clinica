import React, { useState, useCallback, memo, useEffect } from 'react';
import { Save, LogOut, Eye } from 'lucide-react';
import { Patient, InitialHistory } from '../types';
import * as C from '../constants';
import { api } from '../lib/api';
import { CheckboxList, YesNo } from '../components/ui/FormComponents';
import { useNavigate } from 'react-router-dom';
import { ObesityHistoryModal } from '../components/ObesityHistoryModal';
import { useAuth } from '../context/AuthContext';
import { Toast, ToastType } from '../components/ui/Toast';

// --- ESTILOS GLOBALES ---
const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-black font-medium text-[#084286] placeholder-gray-400 focus:border-[#084286] focus:ring-2 focus:ring-[#084286]/20 outline-none transition-all";
const labelClass = "block text-sm font-bold text-black mb-2";
const SECTION_TITLE_CLASS = "text-xl font-bold text-black mb-6 flex items-center gap-2";

// --- COMPONENTES AUXILIARES ---

// Tarjeta blanca simple sin animación
const WhiteCard = ({ children, className, ...props }: any) => (
    <div
        className={`rounded-3xl bg-white shadow-xl p-6 border border-gray-200 ${className || ''}`}
        {...props}
    >
        {children}
    </div>
);

const MemoizedSection = memo(({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) => (
    <WhiteCard className={`mb-8 ${className}`}>
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        {children}
    </WhiteCard>
));

// 1. NUEVO COMPONENTE INTERNO PARA EL GRID (Colócalo antes de MemoizedGroupSection)
const GridCheckboxGroup = memo(({
    items,
    data,
    onChange
}: {
    items: string[],
    data: any,
    onChange: (key: string, value: boolean) => void
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
            <label
                key={item}
                className={`
                    flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none
                    ${data[item]
                        ? 'border-[#083c79] bg-blue-50' // SELECCIONADO: Azul
                        : 'border-black hover:border-[#083c79] bg-white'} // NO SELECCIONADO: Negro
                `}
            >
                <div className="relative flex items-center justify-center flex-shrink-0 mr-3">
                    <input
                        type="checkbox"
                        className="peer appearance-none w-5 h-5 border-2 border-black rounded checked:bg-[#083c79] checked:border-[#083c79] transition-colors cursor-pointer"
                        checked={!!data[item]}
                        onChange={(e) => onChange(item, e.target.checked)}
                    />
                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <span className={`font-medium text-sm leading-tight ${data[item] ? 'text-[#083c79]' : 'text-black'}`}>
                    {item}
                </span>
            </label>
        ))}
    </div>
));

// 2. COMPONENTE DE SECCIÓN ACTUALIZADO (Sin fondo gris)
const MemoizedGroupSection = memo(({
    title, list, groupKey, data, onChange
}: {
    title: string, list: string[], groupKey: keyof InitialHistory, data: any, onChange: (key: keyof InitialHistory, value: any) => void
}) => {
    // Estilos constantes para inputs internos
    const localInputClass = "w-full px-4 py-3 rounded-xl border-2 border-black font-medium text-[#084286] placeholder-gray-400 focus:border-[#084286] focus:ring-2 focus:ring-[#084286]/20 outline-none transition-all";
    const localLabelClass = "block text-sm font-bold text-black mb-2";

    const handleYesNoChange = useCallback((k: string, v: boolean) => {
        const newData = { ...data, [k]: v };
        if (v) {
            if (k === 'yes') newData.no = false;
            if (k === 'no') newData.yes = false;
        }
        onChange(groupKey, newData);
    }, [groupKey, data, onChange]);

    const handleListChange = useCallback((k: string, v: boolean) => {
        const listKey = data.conditions ? 'conditions' : 'list';
        onChange(groupKey, { ...data, [listKey]: { ...(data[listKey] || {}), [k]: v } });
    }, [groupKey, data, onChange]);

    const handleOtherChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(groupKey, { ...data, other: e.target.value });
    }, [groupKey, data, onChange]);

    return (
        <div className="mb-8 pb-6 border-b-2 border-gray-900 last:border-0 last:mb-0 last:pb-0">
            {/* Título negro forzado mediante wrapper si YesNo no acepta JSX */}
            <div className="font-bold text-black mb-2">
                <YesNo label={title} value={data} onChange={handleYesNoChange} />
            </div>

            {data.yes && (
                // Eliminado bg-gray-50, ahora es fondo limpio
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <GridCheckboxGroup items={list} data={data.conditions || data.list} onChange={handleListChange} />

                    <div className="mt-4">
                        <label className={localLabelClass}>Otra / Detalles adicionales</label>
                        <input
                            type="text"
                            className={localInputClass}
                            value={data.other || ''}
                            onChange={handleOtherChange}
                            placeholder="Especifique..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export const PatientHistoryScreen = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [showObesityModal, setShowObesityModal] = useState(false);
    const [showObesityViewModal, setShowObesityViewModal] = useState(false);
    const [cancerType, setCancerType] = useState('');

    useEffect(() => {
        const p = localStorage.getItem('currentPatient');
        if (p) {
            setPatient(JSON.parse(p));
        } else {
            navigate('/app/patient/login');
        }
    }, [navigate]);

    const [h, setH] = useState<InitialHistory>({
        id: Math.random().toString(36),
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        motives: {}, otherMotive: '',
        evolutionTime: '', historyOfPresentIllness: '',
        preExistingDiseases: { yes: false, no: false },
        neurological: { yes: false, no: false, conditions: {}, other: '' },
        metabolic: { yes: false, no: false, conditions: {}, other: '' },
        respiratory: { yes: false, no: false, conditions: {}, other: '' },
        cardiac: { yes: false, no: false, conditions: {}, other: '' },
        gastro: { yes: false, no: false, conditions: {}, other: '' },
        hepato: { yes: false, no: false, conditions: {}, other: '' },
        peripheral: { yes: false, no: false, conditions: {}, other: '' },
        hematological: { yes: false, no: false, conditions: {}, other: '' },
        renal: { yes: false, no: false, conditions: {}, other: '' },
        rheumatological: { yes: false, no: false, conditions: {}, other: '' },
        infectious: { yes: false, no: false, conditions: {}, other: '' },
        psychiatric: { yes: false, no: false, conditions: {}, other: '' },
        gyneco: {
            yes: false, no: false, na: false, conditions: {}, other: '',
            g: '', p: '', a: '', c: '', surgeries: '',
            gestationalDiabetes: { yes: false, no: false }, preeclampsia: { yes: false, no: false }, eclampsia: { yes: false, no: false },
            pregnancySuspicion: { yes: false, no: false, na: false }, breastfeeding: { yes: false, no: false, na: false }
        },
        regularMeds: { yes: false, no: false, list: {}, other: '', specific: '' },
        naturalMeds: { yes: false, no: false, description: '' },
        hospitalizations: { yes: false, no: false, reason: '' },
        surgeries: { yes: false, no: false, list: '' },
        endoscopy: { yes: false, no: false, list: '', results: '' },
        complications: { yes: false, no: false, list: '' },
        allergies: { yes: false, no: false, list: {}, other: '' },
        foodAllergies: { yes: false, no: false, list: {}, other: '' },
        foodIntolerances: { yes: false, no: false, list: {} },
        implants: { yes: false, no: false, which: '' },
        devices: { yes: false, no: false, which: '' },
        habits: { yes: false, no: false, list: {}, other: '' },
        transfusions: { yes: false, no: false, reactions: false, which: '' },
        exposures: { yes: false, no: false, list: {}, other: '' },
        familyHistory: { yes: false, no: false, list: {}, other: '' },
        familyGastro: { yes: false, no: false, list: {}, other: '' },
        physicalExam: {
            fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
            systems: {}
        },
        previousStudies: { yes: false, no: false, description: '' },
        comments: '',
        treatment: { food: '', meds: '', exams: '', norms: '' },
        orders: {
            medical: { included: false, details: '' },
            prescription: { included: false, details: '' },
            labs: { included: false, details: '' },
            images: { included: false, details: '' },
            endoscopy: { included: false, details: '' }
        },
        diagnosis: '',
        isValidated: false
    });

    useEffect(() => {
        if (patient) {
            setH(prev => ({ ...prev, patientId: patient.id }));
        }
    }, [patient]);

    const updateH = useCallback((key: keyof InitialHistory, value: any) => {
        setH(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleMotiveChange = (k: string, v: boolean) => {
        updateH('motives', { ...h.motives, [k]: v });
        if (k === 'Obesidad' && v) {
            setShowObesityModal(true);
        }
        // Limpiar datos de obesidad cuando se deselecciona
        if (k === 'Obesidad' && !v) {
            setH(prev => ({ ...prev, obesityHistory: undefined }));
        }
        // Limpiar cancer type cuando se deselecciona
        if (k === 'Cáncer' && !v) {
            setCancerType('');
        }
    };

    const toggleYesNo = useCallback((key: keyof InitialHistory, field: string, value: boolean) => {
        setH(prev => {
            const current = prev[key] as any;
            const updated = { ...current, [field]: value };
            if (value) {
                if (field === 'yes') updated.no = false;
                if (field === 'no') updated.yes = false;
            }
            return { ...prev, [key]: updated };
        });
    }, []);

    const toggleNestedYesNo = useCallback((parentKey: keyof InitialHistory, childKey: string, field: string, value: boolean) => {
        setH(prev => {
            const parent = prev[parentKey] as any;
            const child = parent[childKey];
            const updatedChild = { ...child, [field]: value };
            if (value) {
                if (field === 'yes') updatedChild.no = false;
                if (field === 'no') updatedChild.yes = false;
            }
            return { ...prev, [parentKey]: { ...parent, [childKey]: updatedChild } };
        });
    }, []);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, isVisible: true });
    };

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('currentPatient');
            navigate('/app/patient/login');
        } catch (e) {
            console.error('Error logging out:', e);
        }
    };

    const handleSave = async () => {
        if (!patient) return;
        try {
            await api.createHistory({ ...h, isValidated: false });

            // Update patient status to indicate history is complete
            await api.updatePatient(patient.id, {
                registrationStatus: 'Proceso3',
                registrationMessage: 'Historia completada, Signos Vitales pendientes'
            });

            showToast("Historia enviada para revisión", 'success');
            setTimeout(() => navigate('/app/patient/dashboard'), 1500);
        } catch (e) {
            console.error(e);
            showToast("Error al guardar historia", 'error');
        }
    };

    if (!patient) return null;

    return (
        <div className="min-h-screen bg-[#083c79] p-4 pb-32">
            <div className="max-w-5xl mx-auto">
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                />

                <WhiteCard className="rounded-t-2xl border-b-2 border-gray-900 mb-8 shadow-sm relative">
                    <button
                        onClick={handleLogout}
                        className="absolute top-6 right-6 p-2 bg-[#083c79] text-white rounded-lg hover:opacity-90 transition-opacity"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Mi Historia Clínica</h2>
                    <p className="text-gray-500">Por favor complete su información médica.</p>
                </WhiteCard>

                <MemoizedSection title="Motivo de Consulta">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {C.MOTIVES_LIST.map((item) => (
                            <div key={item} className="relative">
                                <label
                                    className={`
                                        flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none
                                        ${h.motives[item]
                                            ? 'border-[#083c79] bg-blue-50'
                                            : 'border-black hover:border-[#083c79] bg-white'}
                                    `}
                                >
                                    <div className="relative flex items-center justify-center flex-shrink-0 mr-3">
                                        <input
                                            type="checkbox"
                                            className="peer appearance-none w-5 h-5 border-2 border-black rounded checked:bg-[#083c79] checked:border-[#083c79] transition-colors cursor-pointer"
                                            checked={!!h.motives[item]}
                                            onChange={(e) => handleMotiveChange(item, e.target.checked)}
                                        />
                                        <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none hidden peer-checked:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className={`font-medium text-sm leading-tight flex-1 ${h.motives[item] ? 'text-[#083c79]' : 'text-black'}`}>
                                        {item}
                                    </span>

                                    {/* Icono de ojo para Obesidad */}
                                    {item === 'Obesidad' && h.motives['Obesidad'] && h.obesityHistory && Object.keys(h.obesityHistory).length > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowObesityViewModal(true);
                                            }}
                                            className="ml-2 p-1.5 bg-[#083c79] text-white rounded-lg hover:bg-[#0a4a94] transition-colors"
                                            title="Ver Historia de Obesidad"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                </label>

                                {/* Input para Cáncer */}
                                {item === 'Cáncer' && h.motives['Cáncer'] && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <input
                                            type="text"
                                            value={cancerType}
                                            onChange={(e) => setCancerType(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#083c79] bg-blue-50 font-medium text-[#084286] placeholder-gray-400 focus:ring-2 focus:ring-[#084286]/20 outline-none transition-all"
                                            placeholder="¿Cuál tipo de cáncer?"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <label className={labelClass}>Otros Motivos</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={h.otherMotive}
                            onChange={e => updateH('otherMotive', e.target.value)}
                            placeholder="Especifique..."
                        />
                    </div>
                </MemoizedSection>

                <MemoizedSection title="Historia de la Enfermedad">
                    {/* Usamos 'max-w-sm' para que el input sea CORTO (aprox 24rem de ancho) */}
                    <div className="max-w-sm">
                        <label className={labelClass}>Tiempo de evolución</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={h.evolutionTime}
                            onChange={e => updateH('evolutionTime', e.target.value)}
                            placeholder="Ej: 3 días, 1 semana..."
                        />
                    </div>
                </MemoizedSection>

                <MemoizedSection title="I. ANTECEDENTES PATOLÓGICOS PERSONALES">
                    <YesNo label="Enfermedades pre existentes" value={h.preExistingDiseases} onChange={(k, v) => toggleYesNo('preExistingDiseases', k as string, v)} />
                    {h.preExistingDiseases.yes && (
                        <div className="mt-6 space-y-2">
                            <MemoizedGroupSection title="Neurológicas" list={C.NEURO_LIST} groupKey="neurological" data={h.neurological} onChange={updateH} />
                            <MemoizedGroupSection title="Metabólicas" list={C.METABOLIC_LIST} groupKey="metabolic" data={h.metabolic} onChange={updateH} />
                            <MemoizedGroupSection title="Dermatológicas" list={C.DERMATOLOGIC_LIST} groupKey="dermatologic" data={h.dermatologic || { yes: false, no: false, conditions: {}, other: '' }} onChange={updateH} />
                            <MemoizedGroupSection title="Respiratorias" list={C.RESPIRATORY_LIST} groupKey="respiratory" data={h.respiratory} onChange={updateH} />
                            <MemoizedGroupSection title="Cardíacas" list={C.CARDIAC_LIST} groupKey="cardiac" data={h.cardiac} onChange={updateH} />
                            <MemoizedGroupSection title="Gastrointestinales" list={C.GASTRO_LIST} groupKey="gastro" data={h.gastro} onChange={updateH} />
                            <MemoizedGroupSection title="Hepatobiliopancreáticas" list={C.HEPATO_LIST} groupKey="hepato" data={h.hepato} onChange={updateH} />
                            <MemoizedGroupSection title="Arterial o venosa periféricas" list={C.PERIPHERAL_LIST} groupKey="peripheral" data={h.peripheral} onChange={updateH} />
                            <MemoizedGroupSection title="Hematológicas" list={C.HEMATO_LIST} groupKey="hematological" data={h.hematological} onChange={updateH} />
                            <MemoizedGroupSection title="Reno-ureterales" list={C.RENAL_LIST} groupKey="renal" data={h.renal} onChange={updateH} />
                            <MemoizedGroupSection title="Reumatológicas/Autoinmunes" list={C.RHEUMA_LIST} groupKey="rheumatological" data={h.rheumatological} onChange={updateH} />
                            <MemoizedGroupSection title="Infecciosas" list={C.INFECTIOUS_LIST} groupKey="infectious" data={h.infectious} onChange={updateH} />
                            <MemoizedGroupSection title="Psiquiátricas" list={C.PSYCH_LIST} groupKey="psychiatric" data={h.psychiatric} onChange={updateH} />

                            {/* Ginecológicas solo para femenino */}
                            {patient?.sex === 'Femenino' && (
                                <MemoizedGroupSection title="Ginecológicas" list={C.GYNECO_PATHOLOGICAL_LIST} groupKey="gynecoPathological" data={h.gynecoPathological || { yes: false, no: false, conditions: {}, other: '' }} onChange={updateH} />
                            )}
                        </div>
                    )}
                </MemoizedSection>

                {patient?.sex === 'Femenino' && (
                    <MemoizedSection title="Gineco Obstétricos">
                        <YesNo label="Antecedentes Ginecologicos" value={h.gyneco} onChange={(k, v) => toggleYesNo('gyneco', k as string, v)} />
                        {h.gyneco.yes && (
                            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-200/50 mt-4 space-y-6">
                                <CheckboxList items={C.GYNECO_LIST} data={h.gyneco.conditions} onChange={(k, v) => updateH('gyneco', { ...h.gyneco, conditions: { ...h.gyneco.conditions, [k]: v } })} />

                                <div className="grid grid-cols-4 gap-4 py-4 border-t border-b-2 border-gray-900 my-4">
                                    {['G', 'P', 'A', 'C'].map(k => (
                                        <div key={k} className="flex items-center gap-2">
                                            <label className="font-bold text-gray-600">{k}:</label>
                                            <input
                                                className="w-full px-2 py-1 bg-white border-2 border-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={(h.gyneco as any)[k.toLowerCase()]}
                                                onChange={e => updateH('gyneco', { ...h.gyneco, [k.toLowerCase()]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className={labelClass}>Cirugias Gineco Obstetricas</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={h.gyneco.surgeries}
                                        onChange={e => updateH('gyneco', { ...h.gyneco, surgeries: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3 pt-3">
                                    <YesNo label="Diabetes gestacional" value={h.gyneco.gestationalDiabetes} onChange={(k, v) => toggleNestedYesNo('gyneco', 'gestationalDiabetes', k as string, v)} />
                                    <YesNo label="Preclampsia" value={h.gyneco.preeclampsia} onChange={(k, v) => toggleNestedYesNo('gyneco', 'preeclampsia', k as string, v)} />
                                    <YesNo label="Eclampsia" value={h.gyneco.eclampsia} onChange={(k, v) => toggleNestedYesNo('gyneco', 'eclampsia', k as string, v)} />
                                    <YesNo label="Sospecha de embarazo" value={h.gyneco.pregnancySuspicion} onChange={(k, v) => toggleNestedYesNo('gyneco', 'pregnancySuspicion', k as string, v)} />
                                    <YesNo label="Lactancia materna actual" value={h.gyneco.breastfeeding} onChange={(k, v) => toggleNestedYesNo('gyneco', 'breastfeeding', k as string, v)} />
                                </div>
                            </div>
                        )}
                    </MemoizedSection>
                )}

                {/* ==================== II. MEDICAMENTOS ==================== */}
                <MemoizedSection title="II. MEDICAMENTOS">
                    {/* De uso crónico */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="De uso crónico" value={h.regularMeds} onChange={(k, v) => toggleYesNo('regularMeds', k as string, v)} />
                        {h.regularMeds.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>Describa cuál...</label>
                                <textarea
                                    className={`${inputClass} min-h-[80px]`}
                                    value={h.regularMeds.description || ''}
                                    onChange={e => updateH('regularMeds', { ...h.regularMeds, description: e.target.value })}
                                    placeholder="Lista de medicamentos de uso crónico..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Naturales o suplementos */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Naturales o suplementos" value={h.naturalMeds} onChange={(k, v) => toggleYesNo('naturalMeds', k as string, v)} />
                        {h.naturalMeds.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>Describa cuál...</label>
                                <input className={inputClass} value={h.naturalMeds.description} onChange={e => updateH('naturalMeds', { ...h.naturalMeds, description: e.target.value })} placeholder="Medicina natural o suplementos..." />
                            </div>
                        )}
                    </div>
                </MemoizedSection>

                {/* ==================== III. CIRUGÍAS U HOSPITALIZACIONES ==================== */}
                <MemoizedSection title="III. CIRUGÍAS U HOSPITALIZACIONES">
                    {/* Cirugías y Hospitalizaciones previas - Combinado */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Cirugías y Hospitalizaciones previas" value={h.surgeriesAndHospitalizations || { yes: false, no: false }} onChange={(k, v) => {
                            const current = h.surgeriesAndHospitalizations || { yes: false, no: false, which: '' };
                            const updated = { ...current, [k]: v };
                            if (v) {
                                if (k === 'yes') updated.no = false;
                                if (k === 'no') updated.yes = false;
                            }
                            updateH('surgeriesAndHospitalizations' as any, updated);
                        }} />
                        {h.surgeriesAndHospitalizations?.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>¿Cuáles?</label>
                                <textarea
                                    className={`${inputClass} min-h-[80px]`}
                                    value={h.surgeriesAndHospitalizations?.which || ''}
                                    onChange={e => updateH('surgeriesAndHospitalizations' as any, { ...h.surgeriesAndHospitalizations, which: e.target.value })}
                                    placeholder="Describa las cirugías y hospitalizaciones..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Procedimientos endoscópicos previos */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Procedimientos endoscópicos previos" value={h.endoscopy} onChange={(k, v) => toggleYesNo('endoscopy', k as string, v)} />
                        {h.endoscopy.yes && (
                            <div className="mt-4 space-y-6">
                                {/* Procedimiento 1 (siempre visible) */}
                                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-sm text-gray-600 mb-3">Procedimiento 1</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClass}>¿Cuáles?</label>
                                            <input className={inputClass} value={h.endoscopy.procedures?.[0]?.which || ''} onChange={e => {
                                                const procs = [...(h.endoscopy.procedures || [])];
                                                procs[0] = { ...procs[0], which: e.target.value };
                                                updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                            }} placeholder="Tipo de procedimiento..." />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Resultados</label>
                                            <input className={inputClass} value={h.endoscopy.procedures?.[0]?.results || ''} onChange={e => {
                                                const procs = [...(h.endoscopy.procedures || [])];
                                                procs[0] = { ...procs[0], results: e.target.value };
                                                updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                            }} placeholder="Resultados..." />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Fecha del último</label>
                                            <input type="date" className={inputClass} value={h.endoscopy.procedures?.[0]?.lastDate || ''} onChange={e => {
                                                const procs = [...(h.endoscopy.procedures || [])];
                                                procs[0] = { ...procs[0], lastDate: e.target.value };
                                                updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Procedimiento 2 */}
                                {(h.endoscopy.procedures?.length || 0) >= 2 && (
                                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                                        <h4 className="font-bold text-sm text-gray-600 mb-3">Procedimiento 2</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className={labelClass}>¿Cuáles?</label>
                                                <input className={inputClass} value={h.endoscopy.procedures?.[1]?.which || ''} onChange={e => {
                                                    const procs = [...(h.endoscopy.procedures || [])];
                                                    procs[1] = { ...procs[1], which: e.target.value };
                                                    updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                                }} placeholder="Tipo de procedimiento..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Resultados</label>
                                                <input className={inputClass} value={h.endoscopy.procedures?.[1]?.results || ''} onChange={e => {
                                                    const procs = [...(h.endoscopy.procedures || [])];
                                                    procs[1] = { ...procs[1], results: e.target.value };
                                                    updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                                }} placeholder="Resultados..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Fecha del último</label>
                                                <input type="date" className={inputClass} value={h.endoscopy.procedures?.[1]?.lastDate || ''} onChange={e => {
                                                    const procs = [...(h.endoscopy.procedures || [])];
                                                    procs[1] = { ...procs[1], lastDate: e.target.value };
                                                    updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Procedimiento 3 */}
                                {(h.endoscopy.procedures?.length || 0) >= 3 && (
                                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                                        <h4 className="font-bold text-sm text-gray-600 mb-3">Procedimiento 3</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className={labelClass}>¿Cuáles?</label>
                                                <input className={inputClass} value={h.endoscopy.procedures?.[2]?.which || ''} onChange={e => {
                                                    const procs = [...(h.endoscopy.procedures || [])];
                                                    procs[2] = { ...procs[2], which: e.target.value };
                                                    updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                                }} placeholder="Tipo de procedimiento..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Resultados</label>
                                                <input className={inputClass} value={h.endoscopy.procedures?.[2]?.results || ''} onChange={e => {
                                                    const procs = [...(h.endoscopy.procedures || [])];
                                                    procs[2] = { ...procs[2], results: e.target.value };
                                                    updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                                }} placeholder="Resultados..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Fecha del último</label>
                                                <input type="date" className={inputClass} value={h.endoscopy.procedures?.[2]?.lastDate || ''} onChange={e => {
                                                    const procs = [...(h.endoscopy.procedures || [])];
                                                    procs[2] = { ...procs[2], lastDate: e.target.value };
                                                    updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Botón + para agregar más procedimientos */}
                                {(h.endoscopy.procedures?.length || 1) < 3 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const procs = [...(h.endoscopy.procedures || [{ which: '', results: '', lastDate: '' }])];
                                            procs.push({ which: '', results: '', lastDate: '' });
                                            updateH('endoscopy', { ...h.endoscopy, procedures: procs });
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#083c79] text-white rounded-xl font-bold hover:bg-[#0a4a94] transition-all"
                                    >
                                        <span className="text-xl">+</span> Agregar procedimiento
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Implantes o prótesis intracorpóreos */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Implantes o prótesis intracorpóreos" value={h.implants} onChange={(k, v) => toggleYesNo('implants', k as string, v)} />
                        {h.implants.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>Especifique...</label>
                                <input className={inputClass} value={h.implants.which} onChange={e => updateH('implants', { ...h.implants, which: e.target.value })} placeholder="Tipo de implante o prótesis..." />
                            </div>
                        )}
                    </div>

                    {/* Marcapasos, desfibriladores, neuro estimuladores */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Marcapasos, desfibriladores, neuro estimuladores o algún otro dispositivo intracorpóreo" value={h.devices} onChange={(k, v) => toggleYesNo('devices', k as string, v)} />
                        {h.devices.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>Especifique...</label>
                                <input className={inputClass} value={h.devices.which} onChange={e => updateH('devices', { ...h.devices, which: e.target.value })} placeholder="Tipo de dispositivo..." />
                            </div>
                        )}
                    </div>

                    {/* Complicaciones relacionadas */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Complicaciones relacionadas a cirugías, procedimientos endoscópicos, uso de medicamentos o anestesia" value={h.complications} onChange={(k, v) => toggleYesNo('complications', k as string, v)} />
                        {h.complications.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>¿Cuáles?</label>
                                <input className={inputClass} value={h.complications.list} onChange={e => updateH('complications', { ...h.complications, list: e.target.value })} placeholder="Describa las complicaciones..." />
                            </div>
                        )}
                    </div>

                    {/* ANAFILAXIA/SHOCK */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="ANAFILAXIA / SHOCK" value={h.anaphylaxis || { yes: false, no: false }} onChange={(k, v) => {
                            const current = h.anaphylaxis || { yes: false, no: false, toWhat: '' };
                            const updated = { ...current, [k]: v };
                            if (v) {
                                if (k === 'yes') updated.no = false;
                                if (k === 'no') updated.yes = false;
                            }
                            updateH('anaphylaxis' as any, updated);
                        }} />
                        {h.anaphylaxis?.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>¿A qué?</label>
                                <input className={inputClass} value={h.anaphylaxis?.toWhat || ''} onChange={e => updateH('anaphylaxis' as any, { ...h.anaphylaxis, toWhat: e.target.value })} placeholder="Causa de la anafilaxia..." />
                            </div>
                        )}
                    </div>

                    {/* Alergias */}
                    <MemoizedGroupSection title="Alergias" list={C.ALLERGIES_LIST} groupKey="allergies" data={h.allergies} onChange={updateH} />

                    {/* Intolerancias alimenticias con campo Otros */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Intolerancias alimenticias" value={h.foodIntolerances} onChange={(k, v) => toggleYesNo('foodIntolerances', k as string, v)} />
                        {h.foodIntolerances.yes && (
                            <div className="mt-4 space-y-4">
                                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <CheckboxList items={C.FOOD_INTOLERANCES_LIST} data={h.foodIntolerances.list} onChange={(k, v) => updateH('foodIntolerances', { ...h.foodIntolerances, list: { ...h.foodIntolerances.list, [k]: v } })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Otra / Detalles adicionales</label>
                                    <input className={inputClass} value={h.foodIntolerances.other || ''} onChange={e => updateH('foodIntolerances', { ...h.foodIntolerances, other: e.target.value })} placeholder="Especifique otras intolerancias..." />
                                </div>
                            </div>
                        )}
                    </div>
                </MemoizedSection>

                {/* ==================== IV. ANTECEDENTES NO PATOLÓGICOS PERSONALES ==================== */}
                <MemoizedSection title="IV. ANTECEDENTES NO PATOLÓGICOS PERSONALES">
                    {/* Solo femenino: Embarazo y Lactancia */}
                    {patient?.sex === 'Femenino' && (
                        <>
                            <div className="py-4 border-b-2 border-gray-900">
                                <YesNo label="Sospecha o confirmación de embarazo" value={h.pregnancyConfirmation || { yes: false, no: false }} onChange={(k, v) => {
                                    const current = h.pregnancyConfirmation || { yes: false, no: false, lastPeriodDate: '' };
                                    const updated = { ...current, [k]: v };
                                    if (v) {
                                        if (k === 'yes') updated.no = false;
                                        if (k === 'no') updated.yes = false;
                                    }
                                    updateH('pregnancyConfirmation' as any, updated);
                                }} />
                                {h.pregnancyConfirmation?.yes && (
                                    <div className="mt-4">
                                        <label className={labelClass}>Fecha de su última regla</label>
                                        <input type="date" className={inputClass} value={h.pregnancyConfirmation?.lastPeriodDate || ''} onChange={e => updateH('pregnancyConfirmation' as any, { ...h.pregnancyConfirmation, lastPeriodDate: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            <div className="py-4 border-b-2 border-gray-900">
                                <YesNo label="Lactancia materna actual" value={h.currentBreastfeeding || { yes: false, no: false }} onChange={(k, v) => {
                                    const current = h.currentBreastfeeding || { yes: false, no: false };
                                    const updated = { ...current, [k]: v };
                                    if (v) {
                                        if (k === 'yes') updated.no = false;
                                        if (k === 'no') updated.yes = false;
                                    }
                                    updateH('currentBreastfeeding' as any, updated);
                                }} />
                            </div>
                        </>
                    )}

                    {/* Hábitos / Adicciones */}
                    <MemoizedGroupSection title="Hábitos / Adicciones" list={C.HABITS_LIST} groupKey="habits" data={h.habits} onChange={updateH} />

                    {/* Input adicional para Drogas, Psicofármacos, Medicamentos controlados */}
                    {(h.habits.list?.['Drogas'] || h.habits.list?.['Psicofarmacos'] || h.habits.list?.['Medicamentos controlados']) && (
                        <div className="mt-4 mb-6 p-4 bg-orange-50/50 rounded-xl border border-orange-200">
                            <label className={labelClass}>¿Cuáles? (Drogas, Psicofármacos o Medicamentos controlados)</label>
                            <input
                                className={inputClass}
                                value={h.habits.details?.habitsDetail || ''}
                                onChange={e => updateH('habits', { ...h.habits, details: { ...h.habits.details, habitsDetail: e.target.value } })}
                                placeholder="Especifique cuáles..."
                            />
                        </div>
                    )}

                    {/* Transfusiones Sanguíneas - Solo Sí/No */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Transfusiones Sanguíneas" value={h.transfusions} onChange={(k, v) => toggleYesNo('transfusions', k as string, v)} />
                    </div>

                    {/* Reacciones post transfusionales - Separado */}
                    <div className="py-4 border-b-2 border-gray-900">
                        <YesNo label="Reacciones post transfusionales" value={h.postTransfusionReactions || { yes: false, no: false }} onChange={(k, v) => {
                            const current = h.postTransfusionReactions || { yes: false, no: false, which: '' };
                            const updated = { ...current, [k]: v };
                            if (v) {
                                if (k === 'yes') updated.no = false;
                                if (k === 'no') updated.yes = false;
                            }
                            updateH('postTransfusionReactions' as any, updated);
                        }} />
                        {h.postTransfusionReactions?.yes && (
                            <div className="mt-4">
                                <label className={labelClass}>¿Cuáles?</label>
                                <input className={inputClass} value={h.postTransfusionReactions?.which || ''} onChange={e => updateH('postTransfusionReactions' as any, { ...h.postTransfusionReactions, which: e.target.value })} placeholder="Describa las reacciones..." />
                            </div>
                        )}
                    </div>

                    {/* Exposiciones */}
                    <MemoizedGroupSection title="Exposiciones" list={C.EXPOSURES_LIST} groupKey="exposures" data={h.exposures} onChange={updateH} />
                </MemoizedSection>

                {/* ==================== V. ANTECEDENTES MÉDICOS FAMILIARES ==================== */}
                <MemoizedSection title="V. ANTECEDENTES MÉDICOS FAMILIARES">
                    <MemoizedGroupSection title="Generales" list={C.FAMILY_LIST} groupKey="familyHistory" data={h.familyHistory} onChange={updateH} />
                </MemoizedSection>

                <div className="fixed bottom-6 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <button onClick={handleSave} className="bg-[#083c79] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0a4a94] flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all pointer-events-auto">
                        <Save size={20} /> Guardar
                    </button>
                </div>

                <ObesityHistoryModal
                    isOpen={showObesityModal}
                    onClose={() => {
                        setShowObesityModal(false);
                        updateH('motives', { ...h.motives, 'Obesidad': false });
                    }}
                    onSave={(data) => {
                        setH(prev => ({ ...prev, obesityHistory: data }));
                        setShowObesityModal(false);
                    }}
                    initialData={h.obesityHistory}
                />

                {/* Modal para VER/EDITAR datos de obesidad existentes */}
                <ObesityHistoryModal
                    isOpen={showObesityViewModal}
                    onClose={() => setShowObesityViewModal(false)}
                    onSave={(data) => {
                        setH(prev => ({ ...prev, obesityHistory: data }));
                        setShowObesityViewModal(false);
                    }}
                    initialData={h.obesityHistory}
                />
            </div>
        </div>
    );
};