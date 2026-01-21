import React, { useState, useCallback, memo, useEffect } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Patient, InitialHistory } from '../../types';
import * as C from '../../constants';
import { api } from '../../lib/api';
import { CheckboxList, YesNo, PhysicalExamSection } from '../../components/ui/FormComponents';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FloatingLabelInput } from '../../components/premium-ui/FloatingLabelInput';
import { ObesityHistoryModal } from '../../components/ObesityHistoryModal';
import { Toast, ToastType } from '../../components/ui/Toast';
import { useForm, Controller, FormProvider, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { initialHistorySchema, InitialHistoryFormData, getDefaultInitialHistoryValues } from '../../schemas/patientSchemas';

const SECTION_TITLE_CLASS = "text-xl font-bold text-gray-800 mb-6 flex items-center gap-2";

// Memoized Section Component to prevent re-renders
const MemoizedSection = memo(({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 ${className}`}>
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        {children}
    </div>
));

// RHF-Compatible Group Section using useFormContext
const GroupSectionRHF = memo(({
    title,
    list,
    groupKey
}: {
    title: string,
    list: string[],
    groupKey: keyof InitialHistoryFormData
}) => {
    const { control, setValue, getValues } = useFormContext<InitialHistoryFormData>();

    // Watch the entire group for reactivity
    const groupData = useWatch({ control, name: groupKey as any }) as any;

    const handleYesNoChange = useCallback((k: string, v: boolean) => {
        const current = getValues(groupKey as any) as any;
        setValue(groupKey as any, { ...current, [k]: v }, { shouldDirty: true });
    }, [groupKey, setValue, getValues]);

    const handleListChange = useCallback((k: string, v: boolean) => {
        const current = getValues(groupKey as any) as any;
        const listKey = current.conditions !== undefined ? 'conditions' : 'list';
        setValue(groupKey as any, {
            ...current,
            [listKey]: { ...(current[listKey] || {}), [k]: v }
        }, { shouldDirty: true });
    }, [groupKey, setValue, getValues]);

    const handleOtherChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const current = getValues(groupKey as any) as any;
        setValue(groupKey as any, { ...current, other: e.target.value }, { shouldDirty: true });
    }, [groupKey, setValue, getValues]);

    return (
        <div className="mb-6 pb-4 border-b-2 border-gray-900 last:border-0 last:mb-0 last:pb-0">
            <YesNo label={title} value={groupData} onChange={handleYesNoChange} />
            {groupData?.yes && (
                <div className="pl-0 mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200/50 animate-in fade-in slide-in-from-top-2">
                    <CheckboxList items={list} data={groupData.conditions || groupData.list || {}} onChange={handleListChange} />
                    <div className="mt-4">
                        <FloatingLabelInput
                            label="Otra / Cual?"
                            value={groupData.other || ''}
                            onChange={handleOtherChange}
                            wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

GroupSectionRHF.displayName = 'GroupSectionRHF';

// Simplified interface - no props needed from parent
interface InitialHistoryScreenProps {
    // No longer needs global state props
}

export const InitialHistoryScreen = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [showObesityModal, setShowObesityModal] = useState(false);

    // Self-fetch patient instead of relying on prop
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loadingPatient, setLoadingPatient] = useState(true);

    // --- LOGICA DE ALERTA "PROCESO" (Migrado de LegacyHistoryScreen) ---
    const regStatus = patient?.registrationStatus || '';
    const isBlocked = regStatus?.startsWith('Proceso') || false;

    const getBlockedMessage = (status: string) => {
        switch (status) {
            case 'Proceso1':
                return { title: 'PACIENTE SOLO SE REGISTRÓ', subtitle: 'No completó ficha clínica' };
            case 'Proceso2':
                return { title: 'PENDIENTE HISTORIA CLÍNICA', subtitle: 'El paciente se encuentra en proceso de registro' };
            case 'Proceso3':
            case 'Proceso4':
                return { title: 'PRIMERA CONSULTA PENDIENTE', subtitle: 'El paciente aún no ha tenido su primera consulta' };
            default:
                return { title: 'ESTATUS DESCONOCIDO', subtitle: 'Consulte al administrador' };
        }
    };

    const blockedInfo = isBlocked ? getBlockedMessage(regStatus) : null;
    // -------------------------------------------------------------------

    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                try {
                    const p = await api.getPatient(patientId);
                    setPatient(p);
                } catch (error) {
                    console.error('Error loading patient:', error);
                } finally {
                    setLoadingPatient(false);
                }
            } else {
                setLoadingPatient(false);
            }
        };
        loadPatient();
    }, [patientId]);

    // Normalize migrated data (handle string lists vs checkbox maps)
    const normalizeMigratedData = useCallback((data: any): InitialHistoryFormData => {
        const defaults = getDefaultInitialHistoryValues(patientId || '');
        if (!data) return defaults;

        // Merge defaults with data to ensure all sections exist
        const normalized = { ...defaults, ...data };

        // FIX: Ensure date is YYYY-MM-DD (handle ISO strings from migration)
        if (normalized.date && normalized.date.includes('T')) {
            normalized.date = normalized.date.split('T')[0];
        }

        // FIX: Ensure physicalExam has all fields to prevent uncontrolled inputs
        if (normalized.physicalExam) {
            const peDefaults = {
                fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
                systems: C.SYSTEMS_LIST.reduce((acc, sys) => ({
                    ...acc, [sys]: { normal: false, abnormal: false, description: '' }
                }), {})
            };
            normalized.physicalExam = { ...peDefaults, ...normalized.physicalExam };
            // Ensure nested systems defaults
            if (normalized.physicalExam.systems) {
                // Ensure every system key exists
                C.SYSTEMS_LIST.forEach((sys: string) => { // Explicit type for sys
                    if (!normalized.physicalExam.systems[sys]) {
                        normalized.physicalExam.systems[sys] = { normal: false, abnormal: false, description: '' };
                    }
                });
            }
        }

        // Helper to convert string list to checkbox map
        const convertListToMap = (sectionKey: string, listConstants: string[]) => {
            const section = normalized[sectionKey];
            // If section exists AND has a 'list' property that is a STRING (legacy format)
            if (section && typeof section.list === 'string') {
                const listString = section.list as string;
                const conditionsMap: { [key: string]: boolean } = {};
                const otherItems: string[] = [];

                // Split by comma or newline
                const items = listString.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);

                items.forEach((item: string) => {
                    // Start case matching (e.g. "Migraña" vs "migraña")
                    const match = listConstants.find(c => c.toLowerCase() === item.toLowerCase());
                    if (match) {
                        conditionsMap[match] = true;
                    } else {
                        otherItems.push(item);
                    }
                });

                // Update the section with the new map and remaining items in 'other'
                normalized[sectionKey] = {
                    ...section,
                    conditions: conditionsMap,
                    other: [section.other, ...otherItems].filter(Boolean).join(', '),
                    list: undefined // Remove legacy string list to avoid confusion
                };
            }
        };

        // Apply normalization to all checkbox sections
        convertListToMap('neurological', C.NEURO_LIST);
        convertListToMap('metabolic', C.METABOLIC_LIST);
        convertListToMap('dermatological', C.DERMATOLOGIC_LIST);
        convertListToMap('respiratory', C.RESPIRATORY_LIST);
        convertListToMap('cardiac', C.CARDIAC_LIST);
        convertListToMap('gastro', C.GASTRO_LIST);
        convertListToMap('hepato', C.HEPATO_LIST);
        convertListToMap('peripheral', C.PERIPHERAL_LIST);
        convertListToMap('hematological', C.HEMATO_LIST);
        convertListToMap('renal', C.RENAL_LIST);
        convertListToMap('rheumatological', C.RHEUMA_LIST);
        convertListToMap('infectious', C.INFECTIOUS_LIST);
        convertListToMap('psychiatric', C.PSYCH_LIST);
        convertListToMap('gynecoPathological', C.GYNECO_PATHOLOGICAL_LIST);
        convertListToMap('gyneco', C.GYNECO_LIST);
        convertListToMap('habits', C.HABITS_LIST);
        convertListToMap('exposures', C.EXPOSURES_LIST);
        convertListToMap('familyHistory', C.FAMILY_LIST);
        convertListToMap('allergies', C.ALLERGIES_LIST);
        convertListToMap('foodIntolerances', C.FOOD_INTOLERANCES_LIST);

        // Handle Motives - Convert from Array (if legacy) to BooleanMap
        if (Array.isArray(normalized.motives)) {
            const motivesMap: { [key: string]: boolean } = {};
            normalized.motives.forEach((m: string) => {
                const match = C.MOTIVES_LIST.find(c => c.toLowerCase() === m.toLowerCase());
                if (match) motivesMap[match] = true;
            });
            normalized.motives = motivesMap;
        }

        return normalized as InitialHistoryFormData;
    }, [patientId]);

    // Initialize form with RHF
    const methods = useForm<InitialHistoryFormData>({
        resolver: zodResolver(initialHistorySchema) as any,
        defaultValues: normalizeMigratedData(location.state?.history || getDefaultInitialHistoryValues(patientId || '')),
        mode: 'onBlur'
    });

    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { isSubmitting } } = methods;

    // Watch specific fields for conditional rendering
    const preExistingDiseases = watch('preExistingDiseases');
    const gyneco = watch('gyneco');
    const motives = watch('motives');
    const regularMeds = watch('regularMeds');
    const naturalMeds = watch('naturalMeds');
    const hospitalizations = watch('hospitalizations');
    const surgeries = watch('surgeries');
    const endoscopy = watch('endoscopy');
    const complications = watch('complications');
    const foodIntolerances = watch('foodIntolerances');
    const implants = watch('implants');
    const devices = watch('devices');
    const transfusions = watch('transfusions');
    const previousStudies = watch('previousStudies');
    const orders = watch('orders');
    const physicalExam = watch('physicalExam');

    // Reset form when history from navigation state changes or fetch if missing
    useEffect(() => {
        const fetchHistoryIfNeeded = async () => {
            // Check if "forceNew" flag is present
            if (location.state?.forceNew) {
                console.log("Forcing new history creation (skipping fetch)");
                // reset with defaults to ensure clean state
                reset(getDefaultInitialHistoryValues(patientId || ''));
                return;
            }

            if (location.state?.history) {
                reset(normalizeMigratedData(location.state.history));
            } else if (patientId) {
                // If no history in state, try to fetch it
                try {
                    const histories = await api.getHistories(patientId);
                    if (histories && histories.length > 0) {
                        // Assuming the first history is the correct one for initial history context
                        // or find specific logic if multiple exist
                        console.log("History found for patient, loading...", histories[0]);
                        reset(normalizeMigratedData(histories[0]));
                    }
                } catch (error) {
                    console.error("Error fetching history for patient:", error);
                }
            }
        };
        fetchHistoryIfNeeded();
    }, [location.state, reset, normalizeMigratedData, patientId]);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'success',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type, isVisible: true });
    };

    const handleMotiveChange = useCallback((k: string, v: boolean) => {
        const currentMotives = getValues('motives');
        setValue('motives', { ...currentMotives, [k]: v }, { shouldDirty: true });
        if (k === 'Obesidad' && v) {
            setShowObesityModal(true);
        }
    }, [setValue, getValues]);

    const onSubmit = async (data: InitialHistoryFormData) => {
        if (!patient) return;
        try {
            // Remove undefined values before sending to Firebase
            const cleanData = Object.fromEntries(
                Object.entries({ ...data, isValidated: true }).filter(([_, v]) => v !== undefined)
            ) as unknown as InitialHistory;

            if (location.state?.history) {
                await api.updateHistory(data.id, cleanData);
                // setHistories removed
            } else {
                await api.createHistory(cleanData);
                // setHistories removed
            }
            showToast("Historia clínica guardada exitosamente", 'success');
            setTimeout(() => navigate(`/app/profile/${patient.id}`), 1500);
        } catch (e) {
            console.error(e);
            showToast("Error al guardar historia clínica", 'error');
        }
    };

    if (loadingPatient) {
        return <div className="min-h-screen flex items-center justify-center bg-[#083c79] text-white">Cargando paciente...</div>;
    }

    if (!patient) {
        return <div className="p-8 text-center text-gray-500">Paciente no encontrado.</div>;
    }

    return (
        <FormProvider {...methods}>
            <div className="min-h-screen w-full bg-[#083c79] relative">

                {/* Banner Overlay for All Proceso Statuses (Advisory only) */}
                {isBlocked && blockedInfo && (
                    <div className="sticky top-0 z-[100] w-full bg-red-600/90 text-white px-6 py-3 shadow-lg flex items-center justify-center gap-4 animate-in slide-in-from-top duration-300 backdrop-blur-sm">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h2 className="font-extrabold uppercase tracking-wider text-sm md:text-base">
                                {blockedInfo.title}
                            </h2>
                            <p className="font-medium text-xs md:text-sm text-red-100">{blockedInfo.subtitle}</p>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto p-4 pb-32">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        isVisible={toast.isVisible}
                        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                    />
                    <div className="bg-white rounded-t-2xl border-b border-gray-200 mb-8 shadow-sm relative p-6">
                        <button type="button" onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Historia Clínica Inicial</h2>
                        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-gray-400">Fecha</span>
                                <Controller
                                    name="date"
                                    control={control}
                                    render={({ field }) => (
                                        <input type="date" value={field.value} onChange={field.onChange} className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none" />
                                    )}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-gray-400">Hora</span>
                                <Controller
                                    name="time"
                                    control={control}
                                    render={({ field }) => (
                                        <input type="time" value={field.value} onChange={field.onChange} className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none" />
                                    )}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs uppercase font-bold text-gray-400">Paciente</span>
                                <span className="font-medium text-gray-800">{patient.firstName} {patient.lastName} ({patient.ageDetails})</span>
                            </div>
                        </div>
                    </div>

                    <MemoizedSection title="Motivo de Consulta">
                        <CheckboxList items={C.MOTIVES_LIST} data={motives} onChange={handleMotiveChange} />
                        {motives?.['Obesidad'] && (
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
                            <Controller
                                name="otherMotive"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Otros Motivos"
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                        </div>
                    </MemoizedSection>

                    <MemoizedSection title="Historia de la Enfermedad">
                        <div className="space-y-6">
                            <Controller
                                name="evolutionTime"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Tiempo de evolución"
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                            <Controller
                                name="historyOfPresentIllness"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Historia actual de la enfermedad"
                                        as="textarea"
                                        rows={5}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                        </div>
                    </MemoizedSection>

                    <MemoizedSection title="I. ANTECEDENTES PATOLÓGICOS PERSONALES">
                        <YesNo
                            label="Enfermedades pre existentes"
                            value={preExistingDiseases}
                            onChange={(k, v) => setValue('preExistingDiseases', { ...preExistingDiseases, [k]: v })}
                        />
                        {preExistingDiseases?.yes && (
                            <div className="mt-6 space-y-2">
                                <GroupSectionRHF title="Neurológicas" list={C.NEURO_LIST} groupKey="neurological" />
                                <GroupSectionRHF title="Metabólicas" list={C.METABOLIC_LIST} groupKey="metabolic" />
                                <GroupSectionRHF title="Dermatológicas" list={C.DERMATOLOGIC_LIST} groupKey="dermatologic" />
                                <GroupSectionRHF title="Respiratorias" list={C.RESPIRATORY_LIST} groupKey="respiratory" />
                                <GroupSectionRHF title="Cardíacas" list={C.CARDIAC_LIST} groupKey="cardiac" />
                                <GroupSectionRHF title="Gastrointestinales" list={C.GASTRO_LIST} groupKey="gastro" />
                                <GroupSectionRHF title="Hepatobiliopancreáticas" list={C.HEPATO_LIST} groupKey="hepato" />
                                <GroupSectionRHF title="Arterial o venosa periféricas" list={C.PERIPHERAL_LIST} groupKey="peripheral" />
                                <GroupSectionRHF title="Hematológicas" list={C.HEMATO_LIST} groupKey="hematological" />
                                <GroupSectionRHF title="Reno-ureterales" list={C.RENAL_LIST} groupKey="renal" />
                                <GroupSectionRHF title="Reumatológicas/Autoinmunes" list={C.RHEUMA_LIST} groupKey="rheumatological" />
                                <GroupSectionRHF title="Infecciosas" list={C.INFECTIOUS_LIST} groupKey="infectious" />
                                <GroupSectionRHF title="Psiquiátricas" list={C.PSYCH_LIST} groupKey="psychiatric" />

                                {/* Ginecológicas solo para femenino */}
                                {patient?.sex === 'Femenino' && (
                                    <GroupSectionRHF title="Ginecológicas" list={C.GYNECO_PATHOLOGICAL_LIST} groupKey="gynecoPathological" />
                                )}
                            </div>
                        )}
                    </MemoizedSection>

                    {patient?.sex === 'Femenino' && (
                        <MemoizedSection title="Gineco Obstétricos">
                            <YesNo
                                label="Antecedentes Ginecologicos"
                                value={gyneco}
                                onChange={(k, v) => setValue('gyneco', { ...gyneco, [k]: v })}
                            />
                            {gyneco?.yes && (
                                <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-200/50 mt-4 space-y-6">
                                    <CheckboxList
                                        items={C.GYNECO_LIST}
                                        data={gyneco.conditions}
                                        onChange={(k, v) => setValue('gyneco', { ...gyneco, conditions: { ...gyneco.conditions, [k]: v } })}
                                    />

                                    <div className="grid grid-cols-4 gap-4 py-4 border-t border-b-2 border-gray-900 my-4">
                                        {['G', 'P', 'A', 'C'].map(k => (
                                            <div key={k} className="flex items-center gap-2">
                                                <label className="font-bold text-gray-600">{k}:</label>
                                                <Controller
                                                    name={`gyneco.${k.toLowerCase()}` as any}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            className="w-full px-2 py-1 bg-white border-2 border-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <Controller
                                        name="gyneco.surgeries"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="Cirugias Gineco Obstetricas"
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />

                                    <YesNo label="Diabetes gestacional" value={gyneco.gestationalDiabetes} onChange={(k, v) => setValue('gyneco', { ...gyneco, gestationalDiabetes: { ...gyneco.gestationalDiabetes, [k]: v } })} />
                                    <YesNo label="Preclampsia" value={gyneco.preeclampsia} onChange={(k, v) => setValue('gyneco', { ...gyneco, preeclampsia: { ...gyneco.preeclampsia, [k]: v } })} />
                                    <YesNo label="Eclampsia" value={gyneco.eclampsia} onChange={(k, v) => setValue('gyneco', { ...gyneco, eclampsia: { ...gyneco.eclampsia, [k]: v } })} />
                                    <YesNo label="Sospecha de embarazo" value={gyneco.pregnancySuspicion} onChange={(k, v) => setValue('gyneco', { ...gyneco, pregnancySuspicion: { ...gyneco.pregnancySuspicion, [k]: v } })} />
                                    <YesNo label="Lactancia materna actual" value={gyneco.breastfeeding} onChange={(k, v) => setValue('gyneco', { ...gyneco, breastfeeding: { ...gyneco.breastfeeding, [k]: v } })} />
                                </div>
                            )}
                        </MemoizedSection>
                    )}

                    {/* ==================== II. MEDICAMENTOS ==================== */}
                    <MemoizedSection title="II. MEDICAMENTOS">
                        {/* De uso crónico */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="De uso crónico" value={regularMeds} onChange={(k, v) => setValue('regularMeds', { ...regularMeds, [k]: v })} />
                            {regularMeds?.yes && (
                                <div className="mt-4">
                                    <Controller
                                        name="regularMeds.description"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="Describa cuál..."
                                                as="textarea"
                                                rows={3}
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Naturales o suplementos */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Naturales o suplementos" value={naturalMeds} onChange={(k, v) => setValue('naturalMeds', { ...naturalMeds, [k]: v })} />
                            {naturalMeds?.yes && (
                                <div className="mt-4">
                                    <Controller
                                        name="naturalMeds.description"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="Describa cuál..."
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </MemoizedSection>

                    {/* ==================== III. CIRUGÍAS U HOSPITALIZACIONES ==================== */}
                    <MemoizedSection title="III. CIRUGÍAS U HOSPITALIZACIONES">
                        {/* Cirugías y Hospitalizaciones previas - Combinado */}
                        <div className="py-4 border-b-2 border+gray-900">
                            <YesNo label="Cirugías y Hospitalizaciones previas" value={surgeries} onChange={(k, v) => setValue('surgeries', { ...surgeries, [k]: v })} />
                            {surgeries?.yes && (
                                <div className="mt-4">
                                    <Controller
                                        name="surgeries.list"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="¿Cuáles?"
                                                as="textarea"
                                                rows={3}
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Procedimientos endoscópicos previos */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Procedimientos endoscópicos previos" value={endoscopy} onChange={(k, v) => setValue('endoscopy', { ...endoscopy, [k]: v })} />
                            {endoscopy?.yes && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Controller
                                            name="endoscopy.list"
                                            control={control}
                                            render={({ field }) => (
                                                <FloatingLabelInput
                                                    label="¿Cuáles?"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="endoscopy.results"
                                            control={control}
                                            render={({ field }) => (
                                                <FloatingLabelInput
                                                    label="Resultados"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                                />
                                            )}
                                        />
                                        <div>
                                            <label className="block text-sm font-bold text-black mb-2">Fecha del último</label>
                                            <input type="date" className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 font-medium text-[#084286]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Implantes o prótesis intracorpóreos */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Implantes o prótesis intracorpóreos" value={implants} onChange={(k, v) => setValue('implants', { ...implants, [k]: v })} />
                            {implants?.yes && (
                                <div className="mt-4">
                                    <Controller
                                        name="implants.which"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="Especifique..."
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Marcapasos, desfibriladores */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Marcapasos, desfibriladores, neuro estimuladores o algún otro dispositivo intracorpóreo" value={devices} onChange={(k, v) => setValue('devices', { ...devices, [k]: v })} />
                            {devices?.yes && (
                                <div className="mt-4">
                                    <Controller
                                        name="devices.which"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="Especifique..."
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Complicaciones relacionadas */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Complicaciones relacionadas a cirugías, procedimientos endoscópicos, uso de medicamentos o anestesia" value={complications} onChange={(k, v) => setValue('complications', { ...complications, [k]: v })} />
                            {complications?.yes && (
                                <div className="mt-4">
                                    <Controller
                                        name="complications.list"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="¿Cuáles?"
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Alergias */}
                        <GroupSectionRHF title="Alergias" list={C.ALLERGIES_LIST} groupKey="allergies" />

                        {/* Intolerancias alimenticias */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Intolerancias alimenticias" value={foodIntolerances} onChange={(k, v) => setValue('foodIntolerances', { ...foodIntolerances, [k]: v })} />
                            {foodIntolerances?.yes && (
                                <div className="mt-4 space-y-4">
                                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <CheckboxList
                                            items={C.FOOD_INTOLERANCES_LIST}
                                            data={foodIntolerances.list}
                                            onChange={(k, v) => setValue('foodIntolerances', { ...foodIntolerances, list: { ...foodIntolerances.list, [k]: v } })}
                                        />
                                    </div>
                                    <FloatingLabelInput
                                        label="Otra / Detalles adicionales"
                                        value={foodIntolerances.other || ''}
                                        onChange={(e) => setValue('foodIntolerances', { ...foodIntolerances, other: e.target.value })}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                </div>
                            )}
                        </div>
                    </MemoizedSection>

                    {/* ==================== IV. ANTECEDENTES NO PATOLÓGICOS PERSONALES ==================== */}
                    <MemoizedSection title="IV. ANTECEDENTES NO PATOLÓGICOS PERSONALES">
                        {/* Hábitos / Adicciones */}
                        <GroupSectionRHF title="Hábitos / Adicciones" list={C.HABITS_LIST} groupKey="habits" />

                        {/* Transfusiones Sanguíneas - Solo Sí/No */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Transfusiones Sanguíneas" value={transfusions} onChange={(k, v) => setValue('transfusions', { ...transfusions, [k]: v })} />
                        </div>

                        {/* Exposiciones */}
                        <GroupSectionRHF title="Exposiciones" list={C.EXPOSURES_LIST} groupKey="exposures" />
                    </MemoizedSection>

                    {/* ==================== V. ANTECEDENTES MÉDICOS FAMILIARES ==================== */}
                    <MemoizedSection title="V. ANTECEDENTES MÉDICOS FAMILIARES">
                        <GroupSectionRHF title="Generales" list={C.FAMILY_LIST} groupKey="familyHistory" />
                    </MemoizedSection>

                    <PhysicalExamSection
                        data={watch('physicalExam')}
                        onChange={(d) => setValue('physicalExam', d)}
                    />

                    <div className="p-6 rounded-xl shadow-sm border border-gray-200 mt-8 mb-24 bg-white">
                        <h3 className={SECTION_TITLE_CLASS}>VI. Diagnóstico</h3>
                        <div className="mt-4">
                            <Controller
                                name="diagnosis"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Detalle del Diagnóstico"
                                        as="textarea"
                                        rows={6}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* VII. Plan y Tratamiento */}
                    <MemoizedSection title="VII. Plan y Tratamiento">
                        {/* 1. Estudios Previos */}
                        <div className="mb-8">
                            <YesNo
                                label="Exámenes o estudios diagnósticos previos"
                                value={previousStudies}
                                onChange={(k, v) => setValue('previousStudies', { ...previousStudies, [k]: v })}
                            />
                            {previousStudies?.yes && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <Controller
                                        name="previousStudies.description"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="Describa los estudios previos..."
                                                as="textarea"
                                                rows={3}
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* V. EXAMEN FÍSICO - ÓRGANOS Y SISTEMAS */}
                        <h4 className="font-bold text-gray-700 mb-4 block border-t pt-6">V. ÓRGANOS Y SISTEMAS</h4>
                        <div className="overflow-x-auto mb-8">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-700">Órgano / Sistema</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-bold text-gray-700 w-24">Normal</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-bold text-gray-700 w-24">Anormal</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-700">Descripción (si anormal)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { key: 'piel', label: 'Piel y Anexos' },
                                        { key: 'cabeza', label: 'Cabeza y Cuello' },
                                        { key: 'torax', label: 'Tórax' },
                                        { key: 'cardiaco', label: 'Cardiovascular' },
                                        { key: 'pulmonar', label: 'Pulmonar' },
                                        { key: 'abdomen', label: 'Abdomen' },
                                        { key: 'miembrosuper', label: 'Miembros Superiores' },
                                        { key: 'miembroinfe', label: 'Miembros Inferiores' },
                                        { key: 'neuro', label: 'Neurológico' },
                                        { key: 'genitales', label: 'Genitourinario' },
                                        { key: 'tacto', label: 'Tacto Rectal' },
                                    ].map(({ key, label }) => {
                                        const systemData = physicalExam?.systems?.[key] || { normal: false, abnormal: false, description: '' };
                                        return (
                                            <tr key={key} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2 font-medium">{label}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                        checked={systemData.normal || false}
                                                        onChange={(e) => {
                                                            const current = (getValues(`physicalExam.systems.${key}`) || { normal: false, abnormal: false, description: '' }) as { normal: boolean; abnormal: boolean; description: string };
                                                            setValue(`physicalExam.systems.${key}` as any, {
                                                                ...current,
                                                                normal: e.target.checked,
                                                                abnormal: e.target.checked ? false : current.abnormal,
                                                            }, { shouldDirty: true });
                                                        }}
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                        checked={systemData.abnormal || false}
                                                        onChange={(e) => {
                                                            const current = (getValues(`physicalExam.systems.${key}`) || { normal: false, abnormal: false, description: '' }) as { normal: boolean; abnormal: boolean; description: string };
                                                            setValue(`physicalExam.systems.${key}` as any, {
                                                                ...current,
                                                                abnormal: e.target.checked,
                                                                normal: e.target.checked ? false : current.normal,
                                                            }, { shouldDirty: true });
                                                        }}
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-1">
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                        placeholder={systemData.abnormal ? 'Describa la anormalidad...' : ''}
                                                        disabled={!systemData.abnormal}
                                                        value={systemData.description || ''}
                                                        onChange={(e) => {
                                                            const current = getValues(`physicalExam.systems.${key}`) || {};
                                                            setValue(`physicalExam.systems.${key}` as any, {
                                                                ...current,
                                                                description: e.target.value,
                                                            }, { shouldDirty: true });
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. Tratamiento (Grid) */}
                        <h4 className="font-bold text-gray-700 mb-4 block">Indicaciones Generales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <Controller
                                name="treatment.food"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Alimentación / Dieta"
                                        as="textarea"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                            <Controller
                                name="treatment.meds"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Medicamentos (Indicaciones)"
                                        as="textarea"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                            <Controller
                                name="treatment.exams"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Exámenes a realizar"
                                        as="textarea"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                            <Controller
                                name="treatment.norms"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Normas / Recomendaciones"
                                        as="textarea"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                        </div>

                        {/* 3. Órdenes Médicas */}
                        <h4 className="font-bold text-gray-700 mb-4 block border-t pt-6">Generación de Órdenes</h4>
                        <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-200/50">
                            {[
                                { key: 'medical', label: 'Orden Médica' },
                                { key: 'prescription', label: 'Receta Médica' },
                                { key: 'labs', label: 'Orden de Laboratorios' },
                                { key: 'images', label: 'Orden de Imágenes' },
                                { key: 'endoscopy', label: 'Orden de Endoscopias' }
                            ].map(({ key, label }) => {
                                const k = key as keyof typeof orders;
                                return (
                                    <div key={key} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:border-blue-300">
                                        <label className="flex items-center space-x-3 cursor-pointer mb-2">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={orders?.[k]?.included || false}
                                                onChange={(e) => {
                                                    const current = getValues(`orders.${k}`);
                                                    setValue(`orders.${k}`, { ...current, included: e.target.checked }, { shouldDirty: true });
                                                }}
                                            />
                                            <span className="font-bold text-gray-800 text-lg">{label}</span>
                                        </label>

                                        {orders?.[k]?.included && (
                                            <div className="mt-3 pl-8 animate-in fade-in slide-in-from-top-1">
                                                <Controller
                                                    name={`orders.${k}.details`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <FloatingLabelInput
                                                            label={`Detalle de ${label}...`}
                                                            as="textarea"
                                                            rows={3}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            wrapperClassName="bg-white border-2 border-blue-100 focus-within:border-blue-500 rounded-xl"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 4. Comentarios Generales */}
                        <div className="mt-8 pt-6 border-t">
                            <Controller
                                name="comments"
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="Comentarios Generales / Notas Adicionales"
                                        as="textarea"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                    />
                                )}
                            />
                        </div>

                    </MemoizedSection>

                    <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center z-50 pointer-events-none">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] pointer-events-auto disabled:opacity-50"
                        >
                            <Save size={20} /> {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                    <ObesityHistoryModal
                        isOpen={showObesityModal}
                        onClose={() => setShowObesityModal(false)}
                        onSave={(data) => {
                            setValue('obesityHistory', data as any);
                            setShowObesityModal(false);
                        }}
                        initialData={typeof watch('obesityHistory') === 'string' ? JSON.parse((watch('obesityHistory') as unknown as string) || '{}') : watch('obesityHistory')}
                    />
                </form>
            </div>
        </FormProvider>
    );
};
