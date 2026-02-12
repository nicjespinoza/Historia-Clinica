import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { Save, ArrowLeft, WifiOff, AlertCircle, Trash2, Plus } from 'lucide-react';
import { Patient, InitialHistory, MedicalOrder } from '../../types';
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

const INPUT_CLASS = "w-full px-4 py-2.5 bg-gray-50 border-2 border-black text-gray-800 text-sm rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block transition-all duration-200 outline-none placeholder-gray-400 hover:bg-white";
const SECTION_TITLE_CLASS = "text-xl font-bold text-gray-800 mb-6 flex items-center gap-2";

// Helper for exclusive Yes/No toggles
const handleExclusiveChange = (current: any, key: string, value: boolean) => {
    const newState = { ...current, [key]: value };
    // If turning ON, disable others
    if (value) {
        if (key === 'yes') {
            newState.no = false;
        } else if (key === 'no') {
            newState.yes = false;
        }
    } else {
        // If turning OFF "yes" or "no", and the other is also false, force "no" to be true (default state)
        if (!newState.yes && !newState.no) {
            newState.no = true;
        }
    }
    return newState;
};

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

// Validation helper
const validateVitalSigns = (physicalExam: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (physicalExam.fc) {
        const fc = parseFloat(physicalExam.fc);
        if (isNaN(fc) || fc < 40 || fc > 200) errors.push('FC debe estar entre 40-200 lpm');
    }
    if (physicalExam.fr) {
        const fr = parseFloat(physicalExam.fr);
        if (isNaN(fr) || fr < 8 || fr > 40) errors.push('FR debe estar entre 8-40 rpm');
    }
    if (physicalExam.temp) {
        const temp = parseFloat(physicalExam.temp);
        if (isNaN(temp) || temp < 34 || temp > 42) errors.push('Temperatura debe estar entre 34-42°C');
    }
    if (physicalExam.sat02) {
        const sat = parseFloat(physicalExam.sat02);
        if (isNaN(sat) || sat < 70 || sat > 100) errors.push('SatO2 debe estar entre 70-100%');
    }
    if (physicalExam.weight) {
        const weight = parseFloat(physicalExam.weight);
        if (isNaN(weight) || weight < 1 || weight > 500) errors.push('Peso debe estar entre 1-500 kg');
    }
    if (physicalExam.height) {
        const height = parseFloat(physicalExam.height);
        if (isNaN(height) || height < 30 || height > 250) errors.push('Altura debe estar entre 30-250 cm');
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
    const inputId = React.useId();

    return (
        <div className="flex-1">
            <label htmlFor={inputId} className="block text-xs uppercase font-bold text-gray-500 mb-1">{label}</label>
            <div className="relative">
                <input
                    id={inputId}
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

// Memoized Section Component to prevent re-renders
const MemoizedSection = memo(({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 ${className}`}>
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        {children}
    </div>
));

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
        setValue(groupKey as any, handleExclusiveChange(current, k, v), { shouldDirty: true });
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
                <div className="pl-0 mt-4 bg-gray-50/50 p-3 md:p-4 rounded-xl border border-gray-200/50 animate-in fade-in slide-in-from-top-2">
                    <CheckboxList items={list} data={groupData.conditions || groupData.list || {}} onChange={handleListChange} />

                    {/* Conditional Cancer Details */}
                    {(groupData.conditions?.['Cáncer'] || groupData.conditions?.['Cancer'] || groupData.list?.['Cáncer'] || groupData.list?.['Cancer']) && (
                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                            <Controller
                                name={`${groupKey}.cancerDetails` as any}
                                control={control}
                                render={({ field }) => (
                                    <FloatingLabelInput
                                        label="¿Cuáles?"
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        wrapperClassName="bg-white border-2 border-orange-200 rounded-xl focus-within:border-[#083C79]"
                                    />
                                )}
                            />
                        </div>
                    )}

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

        // FIX: Mapping legacy fields (Comments)
        if (!normalized.comments) {
            normalized.comments = (normalized as any).generalComments || (normalized as any).observaciones || (normalized as any).notes || '';
        }

        // FIX: Ensure physicalExam has all fields to prevent uncontrolled inputs
        if (normalized.physicalExam) {
            const peDefaults = {
                fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
                systems: C.SYSTEMS_LIST.reduce((acc, sys) => ({
                    ...acc, [sys]: { normal: true, abnormal: false, description: '' }
                }), {})
            };

            // Normalized existing systems (Case Insensitive Fix)
            if (normalized.physicalExam.systems) {
                const existingKeys = Object.keys(normalized.physicalExam.systems);
                C.SYSTEMS_LIST.forEach(canonicalSys => {
                    // Find if there is a matching key (case insensitive)
                    const matchKey = existingKeys.find(k => k.toLowerCase() === canonicalSys.toLowerCase());
                    if (matchKey && matchKey !== canonicalSys) {
                        // Move data to canonical key
                        normalized.physicalExam.systems[canonicalSys] = normalized.physicalExam.systems[matchKey];
                        delete normalized.physicalExam.systems[matchKey];
                    }
                });
            }

            normalized.physicalExam = { ...peDefaults, ...normalized.physicalExam };
            // Ensure nested systems defaults and logic
            if (normalized.physicalExam.systems) {
                // Ensure every system key exists
                C.SYSTEMS_LIST.forEach((sys: string) => { // Explicit type for sys
                    if (!normalized.physicalExam.systems[sys]) {
                        normalized.physicalExam.systems[sys] = { normal: true, abnormal: false, description: '' };
                    }
                    // FIX: If abnormal is TRUE, ensure normal is FALSE (migrated data fix)
                    if (normalized.physicalExam.systems[sys].abnormal) {
                        normalized.physicalExam.systems[sys].normal = false;
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

        // NEW: Helper to convert legacy string fields (from very old migrations) to Yes/No objects
        const convertToYesNoObject = (sectionKey: string, textFieldName: string = 'description') => {
            let section = normalized[sectionKey];
            if (typeof section === 'string' && section.trim() !== '') {
                const newSection: any = {
                    yes: true,
                    no: false,
                    na: false,
                    [textFieldName]: section,
                };
                // Only add empty list object if the section schema expects a checkbox map
                const sectionsWithListObjects = ['regularMeds', 'allergies', 'foodAllergies', 'foodIntolerances', 'habits', 'exposures', 'familyHistory', 'familyGastro'];
                if (sectionsWithListObjects.includes(sectionKey)) {
                    newSection.list = {};
                } else if (sectionKey === 'surgeries' || sectionKey === 'complications') {
                    // If it's surgeries/complications, ensure list is a string if it's not the primary text field
                    if (textFieldName !== 'list') newSection.list = '';
                }
                normalized[sectionKey] = newSection;
            } else if (section && typeof section === 'object') {
                // Ensure correct type for 'list' if it exists in the section
                const sectionsWithListObjects = ['regularMeds', 'allergies', 'foodAllergies', 'foodIntolerances', 'habits', 'exposures', 'familyHistory', 'familyGastro'];

                if (sectionsWithListObjects.includes(sectionKey)) {
                    if (!section.list || typeof section.list !== 'object' || Array.isArray(section.list)) {
                        section.list = {};
                    }
                } else if (sectionKey === 'surgeries' || sectionKey === 'complications') {
                    if (section.list !== undefined && typeof section.list !== 'string') {
                        section.list = Array.isArray(section.list) ? section.list.join(', ') : String(section.list || '');
                    }
                }
            }
        };

        // Apply normalization to potentially string fields
        convertToYesNoObject('regularMeds', 'description');
        convertToYesNoObject('naturalMeds', 'description');
        convertToYesNoObject('hospitalizations', 'reason');
        convertToYesNoObject('surgeries', 'list');
        convertToYesNoObject('complications', 'list');
        convertToYesNoObject('anaphylaxis', 'description');
        convertToYesNoObject('implants', 'which');
        convertToYesNoObject('devices', 'which');
        convertToYesNoObject('previousStudies', 'description');

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

        // NEW: Ensure deeply nested fields that were added recently exist in legacy records
        if (!normalized.anaphylaxis || typeof normalized.anaphylaxis !== 'object') {
            normalized.anaphylaxis = { yes: false, no: true, description: '' };
        }
        if (normalized.transfusions && !normalized.transfusions.reactions) {
            normalized.transfusions.reactions = defaults.transfusions.reactions;
        }
        if (normalized.endoscopy && !normalized.endoscopy.procedures) {
            normalized.endoscopy.procedures = defaults.endoscopy.procedures;
        }

        // FORCE "NO" as default if neither YES nor NO is selected (ensures "No" on empty/new fields)
        const forceNoDefault = (sectionKey: string) => {
            const section = normalized[sectionKey];
            if (section && typeof section === 'object') {
                // If neither 'yes', 'no' nor 'na' is true (handles false, undefined, null)
                // This ensures we only set "No" if the field is literally empty/unselected
                if (!section.yes && !section.no && !section.na) {
                    section.no = true;
                    section.yes = false;
                }
            }
        };

        const yesNoSections = [
            'preExistingDiseases', 'neurological', 'metabolic', 'dermatologic',
            'respiratory', 'cardiac', 'gastro', 'hepato', 'peripheral',
            'hematological', 'renal', 'rheumatological', 'infectious',
            'psychiatric', 'gynecoPathological', 'gyneco', 'regularMeds',
            'naturalMeds', 'hospitalizations', 'surgeries', 'endoscopy',
            'complications', 'allergies', 'anaphylaxis', 'foodAllergies',
            'foodIntolerances', 'implants', 'devices', 'habits',
            'transfusions', 'exposures', 'familyHistory', 'familyGastro',
            'previousStudies'
        ];

        yesNoSections.forEach(forceNoDefault);

        // Special handling for nested gyneco fields
        if (normalized.gyneco) {
            const gynecoNested = ['gestationalDiabetes', 'preeclampsia', 'eclampsia', 'pregnancySuspicion', 'breastfeeding'];
            gynecoNested.forEach(key => {
                const sub = normalized.gyneco[key];
                if (sub && !sub.yes && !sub.no && !sub.na) {
                    sub.no = true;
                    sub.yes = false;
                }
            });
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
    const habits = watch('habits');
    const familyHistory = watch('familyHistory');
    const gyneco = watch('gyneco');
    const motives = watch('motives');
    const regularMeds = watch('regularMeds');
    const naturalMeds = watch('naturalMeds');
    const hospitalizations = watch('hospitalizations');
    const surgeries = watch('surgeries');
    const endoscopy = watch('endoscopy') || { yes: false, no: true, list: '', results: '', procedures: [] };
    const complications = watch('complications') || { yes: false, no: true, list: '' };
    const anaphylaxis = watch('anaphylaxis') || { yes: false, no: true, description: '' };
    const foodIntolerances = watch('foodIntolerances') || { yes: false, no: true, list: {}, other: '' };
    const implants = watch('implants') || { yes: false, no: true, which: '' };
    const devices = watch('devices') || { yes: false, no: true, which: '' };
    const transfusions = watch('transfusions') || { yes: false, no: true, reactions: { yes: false, no: true }, which: '' };
    const previousStudies = watch('previousStudies') || { yes: false, no: true, description: '' };
    const orders = watch('orders') || { medical: {}, prescription: {}, labs: {}, images: {}, endoscopy: {} };
    const physicalExam = watch('physicalExam') || { fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '', systems: {} };

    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Calcular IMC automáticamente
    const currentWeight = watch('physicalExam.weight');
    const currentHeight = watch('physicalExam.height');

    const calculatedImc = useMemo(() => {
        const weight = parseFloat(currentWeight);
        const heightCm = parseFloat(currentHeight);
        if (weight > 0 && heightCm > 0) {
            const heightM = heightCm / 100;
            return (weight / (heightM * heightM)).toFixed(1);
        }
        return '';
    }, [currentWeight, currentHeight]);

    useEffect(() => {
        const currentImc = getValues('physicalExam.imc');
        if (calculatedImc && calculatedImc !== currentImc) {
            setValue('physicalExam.imc', calculatedImc, { shouldValidate: true });
        }
    }, [calculatedImc, setValue, getValues]);

    // Sync Vital Signs from Patient Record (Hydration)
    // Runs when patient data loads. Only fills EMPTY fields to avoid overwriting existing history data.
    useEffect(() => {
        if (patient?.vitalSigns) {
            const currentExam = getValues('physicalExam');
            const pVitals = patient.vitalSigns;

            if (!currentExam.fc && pVitals.fc) setValue('physicalExam.fc', pVitals.fc, { shouldDirty: true });
            if (!currentExam.fr && pVitals.fr) setValue('physicalExam.fr', pVitals.fr, { shouldDirty: true });
            if (!currentExam.temp && pVitals.temp) setValue('physicalExam.temp', pVitals.temp, { shouldDirty: true });
            if (!currentExam.pa && pVitals.pa) setValue('physicalExam.pa', pVitals.pa, { shouldDirty: true });
            if (!currentExam.pam && pVitals.pam) setValue('physicalExam.pam', pVitals.pam, { shouldDirty: true });
            if (!currentExam.sat02 && pVitals.sat02) setValue('physicalExam.sat02', pVitals.sat02, { shouldDirty: true });
            if (!currentExam.weight && pVitals.weight) setValue('physicalExam.weight', pVitals.weight, { shouldDirty: true });
            if (!currentExam.height && pVitals.height) setValue('physicalExam.height', pVitals.height, { shouldDirty: true });
            // IMC is handled by the calculation effect above
        }

        // Sync Motives from Patient Record (New Feature)
        if (patient) {
            const currentMotives = getValues('motives') as any; // Type cast for flexible access

            // 1. Sync Checkboxes (only if current is empty/default)
            // Check if any true value exists currently
            const hasExistingSelection = currentMotives && Object.keys(currentMotives).some(k =>
                k !== 'cancerDetails' && k !== 'other' && currentMotives[k] === true
            );

            if (!hasExistingSelection && patient.motives) {
                // Merge patient motives into current structure
                // We don't replace entirely to preserve other structure if needed, but here we just merge true values
                const newMotives = { ...currentMotives, ...patient.motives };
                setValue('motives', newMotives, { shouldDirty: true });
            }

            // 2. Sync Cancer Details
            if (patient.motivesCancerDetails && !getValues('motivesCancerDetails')) {
                setValue('motivesCancerDetails', patient.motivesCancerDetails, { shouldDirty: true });
            }

            // 3. Sync Other Motives
            if (patient.motivesOther && !getValues('otherMotive')) {
                setValue('otherMotive', patient.motivesOther, { shouldDirty: true });
            }
        }
    }, [patient, setValue, getValues]);

    const getIMCClassification = (imc: number): string => {
        if (imc < 18.5) return 'Bajo peso';
        if (imc < 25) return 'Peso normal';
        if (imc < 30) return 'Sobrepeso';
        if (imc < 35) return 'Obesidad de clase I';
        if (imc < 40) return 'Obesidad de clase II';
        return 'Obesidad de clase III (mórbida)';
    };

    // --- Logic for Lists (Diagnoses, Treatment, Orders) ---

    // Diagnoses
    const currentDiagnoses = watch('diagnoses') || [];

    const handleDiagnosisChange = (index: number, value: string) => {
        const newD = [...currentDiagnoses];
        newD[index] = value;
        setValue('diagnoses', newD, { shouldDirty: true });
    };

    const addDiagnosis = () => {
        setValue('diagnoses', [...currentDiagnoses, ''], { shouldDirty: true });
    };

    const removeDiagnosis = (index: number) => {
        const newD = currentDiagnoses.filter((_, i) => i !== index);
        setValue('diagnoses', newD, { shouldDirty: true });
    };

    // Treatment Arrays
    const currentTreatment = watch('treatment');

    // Ensure they are arrays (backward compatibility if string)
    const getTreatmentArray = (field: 'meds' | 'exams' | 'norms') => {
        const val = currentTreatment?.[field];
        if (Array.isArray(val)) return val;
        return val ? [val as string] : [''];
    };

    const handleTreatmentChange = (field: 'meds' | 'exams' | 'norms', index: number, value: string) => {
        const arr = getTreatmentArray(field);
        const newArr = [...arr];
        newArr[index] = value;
        setValue(`treatment.${field}`, newArr, { shouldDirty: true });
    };

    const addTreatmentItem = (field: 'meds' | 'exams' | 'norms') => {
        const arr = getTreatmentArray(field);
        setValue(`treatment.${field}`, [...arr, ''], { shouldDirty: true });
    };

    // Medical Orders
    const currentOrders = watch('medicalOrders') || [];

    const addMedicalOrder = (
        type: 'prescription' | 'lab_general' | 'lab_basic' | 'lab_extended' | 'lab_feces' | 'image' | 'endoscopy',
        defaultContent: string = ''
    ) => {
        const newOrder: MedicalOrder = {
            id: Date.now().toString() + Math.random().toString(),
            type,
            diagnosis: '',
            content: defaultContent
        };
        setValue('medicalOrders', [...currentOrders, newOrder], { shouldDirty: true });
    };

    const updateMedicalOrder = (id: string, field: 'diagnosis' | 'content', value: string) => {
        const newOrders = currentOrders.map(o => o.id === id ? { ...o, [field]: value } : o);
        setValue('medicalOrders', newOrders, { shouldDirty: true });
    };

    const removeMedicalOrder = (id: string) => {
        const newOrders = currentOrders.filter(o => o.id !== id);
        setValue('medicalOrders', newOrders, { shouldDirty: true });
    };
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

    // Reset form when history from navigation state changes or fetch if missing
    useEffect(() => {
        const fetchHistoryIfNeeded = async () => {
            // Check if "forceNew" flag is present
            if (location.state?.forceNew) {

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
                        // console.log("History found for patient, loading...", histories[0]);
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

        // Validation
        const validation = validateVitalSigns(data.physicalExam);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            showToast("Por favor corrija los errores en signos vitales", 'error');
            return;
        }
        setValidationErrors([]);

        try {
            // FIX: Normalize Arrays to Strings for Backend Compatibility
            const processedData = {
                ...data,
                isValidated: true,
                // Join diagnoses array to string if present
                diagnosis: data.diagnoses && data.diagnoses.length > 0
                    ? data.diagnoses.filter(Boolean).join('\n')
                    : data.diagnosis,
                // Join treatment arrays to strings
                treatment: {
                    ...data.treatment,
                    food: Array.isArray(data.treatment.food) ? data.treatment.food.filter(Boolean).join('\n') : data.treatment.food,
                    meds: Array.isArray(data.treatment.meds) ? data.treatment.meds.filter(Boolean).join('\n') : data.treatment.meds,
                    exams: Array.isArray(data.treatment.exams) ? data.treatment.exams.filter(Boolean).join('\n') : data.treatment.exams,
                    norms: Array.isArray(data.treatment.norms) ? data.treatment.norms.filter(Boolean).join('\n') : data.treatment.norms,
                }
            };

            // Remove undefined values before sending to Firebase
            const cleanData = Object.fromEntries(
                Object.entries(processedData).filter(([_, v]) => v !== undefined)
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
                <form onSubmit={handleSubmit(onSubmit, (errors) => {
                    console.error("Form Validation Errors:", errors);
                    // Log details of regularMeds if it has errors
                    if (errors.regularMeds) {
                        console.error("DEBUG: regularMeds error details:", errors.regularMeds);
                    }
                    showToast(`Error de validación: ${Object.keys(errors).join(', ')}`, 'error');
                })} className="max-w-5xl mx-auto p-4 pb-32">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        isVisible={toast.isVisible}
                        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                    />
                    <div className="bg-white rounded-t-2xl border-b border-gray-200 mb-8 shadow-sm relative p-6">
                        <button type="button" onClick={() => navigate(-1)} className="fixed top-12 right-12 p-3 bg-white text-[#083c79] hover:bg-gray-100 border-2 border-[#083c79] rounded-full transition-all shadow-xl z-[60] group flex items-center justify-center">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
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

                        {/* Conditional Cancer Details for Motives */}
                        {(motives?.['Cáncer'] || motives?.['Cancer']) && (
                            <div className="mt-4 animate-in zoom-in-95 duration-200">
                                <Controller
                                    name="motivesCancerDetails"
                                    control={control}
                                    render={({ field }) => (
                                        <FloatingLabelInput
                                            label="¿Cuáles? (Cáncer)"
                                            value={field.value}
                                            onChange={field.onChange}
                                            wrapperClassName="bg-white border-2 border-orange-200 rounded-xl focus-within:border-[#083C79]"
                                        />
                                    )}
                                />
                            </div>
                        )}

                        {motives?.['Obesidad'] && (
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowObesityModal(true)}
                                    className="text-sm text-[#083C79] hover:text-[#062a55] font-medium underline"
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
                            onChange={(k, v) => setValue('preExistingDiseases', handleExclusiveChange(preExistingDiseases, k, v))}
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
                                onChange={(k, v) => setValue('gyneco', handleExclusiveChange(gyneco, k, v))}
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

                                    <YesNo label="Diabetes gestacional" value={gyneco.gestationalDiabetes} onChange={(k, v) => setValue('gyneco', { ...gyneco, gestationalDiabetes: handleExclusiveChange(gyneco.gestationalDiabetes, k, v) })} />
                                    <YesNo label="Preclampsia" value={gyneco.preeclampsia} onChange={(k, v) => setValue('gyneco', { ...gyneco, preeclampsia: handleExclusiveChange(gyneco.preeclampsia, k, v) })} />
                                    <YesNo label="Eclampsia" value={gyneco.eclampsia} onChange={(k, v) => setValue('gyneco', { ...gyneco, eclampsia: handleExclusiveChange(gyneco.eclampsia, k, v) })} />
                                    <YesNo label="Sospecha de embarazo" value={gyneco.pregnancySuspicion} onChange={(k, v) => setValue('gyneco', { ...gyneco, pregnancySuspicion: handleExclusiveChange(gyneco.pregnancySuspicion, k, v) })} />
                                    <YesNo label="Lactancia materna actual" value={gyneco.breastfeeding} onChange={(k, v) => setValue('gyneco', { ...gyneco, breastfeeding: handleExclusiveChange(gyneco.breastfeeding, k, v) })} />
                                </div>
                            )}
                        </MemoizedSection>
                    )}

                    {/* ==================== II. MEDICAMENTOS ==================== */}
                    <MemoizedSection title="II. MEDICAMENTOS">
                        {/* De uso crónico */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="De uso crónico" value={regularMeds} onChange={(k, v) => setValue('regularMeds', handleExclusiveChange(regularMeds, k, v))} />
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
                            <YesNo label="Naturales o suplementos" value={naturalMeds} onChange={(k, v) => setValue('naturalMeds', handleExclusiveChange(naturalMeds, k, v))} />
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
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Cirugías y Hospitalizaciones previas" value={surgeries} onChange={(k, v) => setValue('surgeries', handleExclusiveChange(surgeries, k, v))} />
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
                            <YesNo label="Procedimientos endoscópicos previos" value={endoscopy} onChange={(k, v) => setValue('endoscopy', handleExclusiveChange(endoscopy, k, v))} />
                            {endoscopy?.yes && (
                                <div className="mt-4 space-y-6">
                                    {(endoscopy.procedures || []).map((proc: any, index: number) => (
                                        <div key={index} className="relative p-4 bg-gray-50/50 rounded-2xl border-2 border-gray-100 group animate-in fade-in slide-in-from-top-2">
                                            {endoscopy.procedures.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newProcs = [...endoscopy.procedures];
                                                        newProcs.splice(index, 1);
                                                        setValue('endoscopy.procedures', newProcs, { shouldDirty: true });
                                                    }}
                                                    className="absolute -right-2 -top-2 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm z-10"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Controller
                                                    name={`endoscopy.procedures.${index}.which` as any}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <FloatingLabelInput
                                                            label="¿Cuáles?"
                                                            value={field.value || ''}
                                                            onChange={field.onChange}
                                                            wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                                        />
                                                    )}
                                                />
                                                <div>
                                                    <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Fecha del último estudio</label>
                                                    <Controller
                                                        name={`endoscopy.procedures.${index}.lastDate` as any}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                type="date"
                                                                value={field.value || ''}
                                                                onChange={field.onChange}
                                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-900 font-medium text-[#084286] bg-white outline-none focus:border-blue-500 transition-colors"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                <Controller
                                                    name={`endoscopy.procedures.${index}.results` as any}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <FloatingLabelInput
                                                            label="Resultados"
                                                            value={field.value || ''}
                                                            onChange={field.onChange}
                                                            wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentProcs = endoscopy.procedures || [];
                                            setValue('endoscopy.procedures', [...currentProcs, { which: '', lastDate: '', results: '' }], { shouldDirty: true });
                                        }}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Agregar otro procedimiento
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Implantes o prótesis intracorpóreos */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Implantes o prótesis intracorpóreos" value={implants} onChange={(k, v) => setValue('implants', handleExclusiveChange(implants, k, v))} />
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
                            <YesNo label="Marcapasos, desfibriladores, neuro estimuladores o algún otro dispositivo intracorpóreo" value={devices} onChange={(k, v) => setValue('devices', handleExclusiveChange(devices, k, v))} />
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
                            <YesNo label="Complicaciones relacionadas a cirugías, procedimientos endoscópicos, uso de medicamentos o anestesia" value={complications} onChange={(k, v) => setValue('complications', handleExclusiveChange(complications, k, v))} />
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

                        {/* ANAFILAXIA / SHOCK */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo
                                label="ANAFILAXIA / SHOCK"
                                value={anaphylaxis}
                                onChange={(k, v) => setValue('anaphylaxis', handleExclusiveChange(anaphylaxis, k, v), { shouldDirty: true })}
                            />
                            {anaphylaxis?.yes && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <Controller
                                        name="anaphylaxis.description"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="¿A que?"
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Intolerancias alimenticias */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Intolerancias alimenticias" value={foodIntolerances} onChange={(k, v) => setValue('foodIntolerances', handleExclusiveChange(foodIntolerances, k, v))} />
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
                        <div className="mb-6 pb-4 border-b-2 border-gray-900 last:border-0 last:mb-0 last:pb-0">
                            <YesNo label="Hábitos / Adicciones" value={habits} onChange={(k, v) => setValue('habits', handleExclusiveChange(habits, k, v), { shouldDirty: true })} />
                            {habits?.yes && (
                                <div className="pl-0 mt-4 bg-gray-50/50 p-3 md:p-4 rounded-xl border border-gray-200/50 animate-in fade-in slide-in-from-top-2">
                                    <CheckboxList items={C.HABITS_LIST} data={(habits as any).conditions || habits.list || {}} onChange={(k, v) => {
                                        const current = habits as any;
                                        const listKey = current.conditions !== undefined ? 'conditions' : 'list';
                                        setValue('habits', {
                                            ...current,
                                            [listKey]: { ...(current[listKey] || {}), [k]: v }
                                        }, { shouldDirty: true });
                                    }} />

                                    {/* Conditional details for specific habits */}
                                    {(habits.list?.['Drogas'] || (habits as any).conditions?.['Drogas']) && (
                                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                                            <Controller
                                                name="habits.drugsDetails"
                                                control={control}
                                                render={({ field }) => (
                                                    <FloatingLabelInput
                                                        label="¿Cuáles Drogas?"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        wrapperClassName="bg-white border-2 border-orange-200 rounded-xl focus-within:border-[#083C79]"
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}

                                    {(habits.list?.['Psicofarmacos'] || (habits as any).conditions?.['Psicofarmacos']) && (
                                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                                            <Controller
                                                name="habits.psychDetails"
                                                control={control}
                                                render={({ field }) => (
                                                    <FloatingLabelInput
                                                        label="¿Cuáles Psicofármacos?"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        wrapperClassName="bg-white border-2 border-orange-200 rounded-xl focus-within:border-[#083C79]"
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}

                                    {(habits.list?.['Medicamentos controlados'] || (habits as any).conditions?.['Medicamentos controlados']) && (
                                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                                            <Controller
                                                name="habits.controlledDetails"
                                                control={control}
                                                render={({ field }) => (
                                                    <FloatingLabelInput
                                                        label="¿Cuáles Medicamentos?"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        wrapperClassName="bg-white border-2 border-orange-200 rounded-xl focus-within:border-[#083C79]"
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <FloatingLabelInput
                                            label="Otros / Detalles generales"
                                            value={habits.other || ''}
                                            onChange={(e) => setValue('habits', { ...habits, other: e.target.value }, { shouldDirty: true })}
                                            wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transfusiones Sanguíneas */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo label="Transfusiones Sanguíneas" value={transfusions} onChange={(k, v) => setValue('transfusions', handleExclusiveChange(transfusions, k, v), { shouldDirty: true })} />
                        </div>

                        {/* Reacciones post transfusionales */}
                        <div className="py-4 border-b-2 border-gray-900">
                            <YesNo
                                label="Reacciones post transfusionales"
                                value={transfusions.reactions}
                                onChange={(k, v) => setValue('transfusions.reactions', handleExclusiveChange(transfusions.reactions, k, v), { shouldDirty: true })}
                            />
                            {transfusions.reactions?.yes && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <Controller
                                        name="transfusions.which"
                                        control={control}
                                        render={({ field }) => (
                                            <FloatingLabelInput
                                                label="¿Cual (es)?"
                                                value={field.value}
                                                onChange={field.onChange}
                                                wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Exposiciones */}
                        <GroupSectionRHF title="Exposiciones" list={C.EXPOSURES_LIST} groupKey="exposures" />
                    </MemoizedSection>

                    {/* ==================== V. ANTECEDENTES MÉDICOS FAMILIARES ==================== */}
                    <MemoizedSection title="V. ANTECEDENTES MÉDICOS FAMILIARES">
                        <div className="mb-6 pb-4 border-b-2 border-gray-900 last:border-0 last:mb-0 last:pb-0">
                            <YesNo label="Generales" value={familyHistory} onChange={(k, v) => setValue('familyHistory', handleExclusiveChange(familyHistory, k, v), { shouldDirty: true })} />
                            {familyHistory?.yes && (
                                <div className="pl-0 mt-4 bg-gray-50/50 p-3 md:p-4 rounded-xl border border-gray-200/50 animate-in fade-in slide-in-from-top-2">
                                    <CheckboxList items={C.FAMILY_LIST} data={familyHistory.list || {}} onChange={(k, v) => {
                                        setValue('familyHistory', {
                                            ...familyHistory,
                                            list: { ...(familyHistory.list || {}), [k]: v }
                                        }, { shouldDirty: true });
                                    }} />

                                    {/* Conditional details for Cáncer */}
                                    {(familyHistory.list?.['Cancer'] || familyHistory.list?.['Cáncer']) && (
                                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                                            <Controller
                                                name="familyHistory.cancerDetails"
                                                control={control}
                                                render={({ field }) => (
                                                    <FloatingLabelInput
                                                        label="¿Cuáles?"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        wrapperClassName="bg-white border-2 border-orange-200 rounded-xl focus-within:border-[#083C79]"
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <FloatingLabelInput
                                            label="Otra/cual?"
                                            value={familyHistory.other || ''}
                                            onChange={(e) => setValue('familyHistory', { ...familyHistory, other: e.target.value }, { shouldDirty: true })}
                                            wrapperClassName="bg-white border-2 border-gray-900 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </MemoizedSection>

                    {/* V. EXAMEN FÍSICO (Grid Numérico) */}
                    <Section title="V. Signos Vitales">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <NumericInput
                                label="FC"
                                value={physicalExam.fc}
                                onChange={v => setValue('physicalExam.fc', v, { shouldDirty: true })}
                                min={40} max={200} unit="lpm" placeholder="60-100"
                                isOnline={isOnline}
                            />
                            <NumericInput
                                label="FR"
                                value={physicalExam.fr}
                                onChange={v => setValue('physicalExam.fr', v, { shouldDirty: true })}
                                min={8} max={40} unit="rpm" placeholder="12-20"
                                isOnline={isOnline}
                            />
                            <NumericInput
                                label="Temperatura"
                                value={physicalExam.temp}
                                onChange={v => setValue('physicalExam.temp', v, { shouldDirty: true })}
                                min={34} max={42} step="0.1" unit="°C" placeholder="36.5"
                                isOnline={isOnline}
                            />
                            <NumericInput
                                label="SatO2"
                                value={physicalExam.sat02}
                                onChange={v => setValue('physicalExam.sat02', v, { shouldDirty: true })}
                                min={70} max={100} unit="%" placeholder="95-100"
                                isOnline={isOnline}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <FloatingLabelInput
                                label="PA (mmHg)"
                                value={physicalExam.pa}
                                onChange={e => setValue('physicalExam.pa', e.target.value, { shouldDirty: true })}
                                placeholder="120/80"
                                wrapperClassName={`border-2 ${isOnline ? 'border-black' : 'border-red-500'}`}
                            />
                            <FloatingLabelInput
                                label="PAM (mmHg)"
                                value={physicalExam.pam}
                                onChange={e => setValue('physicalExam.pam', e.target.value, { shouldDirty: true })}
                                placeholder="93"
                                wrapperClassName={`border-2 ${isOnline ? 'border-black' : 'border-red-500'}`}
                            />
                            <NumericInput
                                label="Peso"
                                value={physicalExam.weight}
                                onChange={v => setValue('physicalExam.weight', v, { shouldDirty: true })}
                                min={1} max={500} step="0.1" unit="kg" placeholder="70"
                            />
                            <NumericInput
                                label="Altura"
                                value={physicalExam.height}
                                onChange={v => setValue('physicalExam.height', v, { shouldDirty: true })}
                                min={30} max={250} unit="cm" placeholder="170"
                            />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                                <span className="text-blue-700 font-bold">IMC:</span>
                                <span className="text-blue-600">{physicalExam.imc || '-'} kg/m²</span>
                            </div>
                            {physicalExam.imc && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-blue-800 font-bold text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {getIMCClassification(parseFloat(physicalExam.imc))}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Examen por Sistemas (Tabla sin vitales) */}
                    <PhysicalExamSection
                        data={watch('physicalExam')}
                        onChange={(d) => setValue('physicalExam', d, { shouldDirty: true })}
                        hideVitals={true}
                    />

                    {/* VI. Diagnóstico (Lista Dinámica) */}
                    {/* VI. Diagnóstico (MOVIDO MÁS ABAJO) */}

                    {/* VII. Plan de Tratamiento */}
                    <Section title="VII. Plan de Tratamiento">
                        {/* Estudios Previos (Integrado en Plan) */}
                        <div className="mb-8 border-b pb-6">
                            <YesNo
                                label="Exámenes o estudios diagnósticos previos"
                                value={previousStudies}
                                onChange={(k, v) => setValue('previousStudies', handleExclusiveChange(previousStudies, k, v))}
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

                        {/* Comentarios (Movido aquí) */}
                        <div className="mb-6">
                            <h4 className="font-bold text-gray-700 mb-2">Comentarios</h4>
                            <Controller
                                name="comments"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Escriba aquí sus comentarios..."
                                        className={`w-full p-3 rounded-xl border-2 outline-none transition-all ${isOnline ? 'bg-white border-black focus:border-blue-500' : 'bg-white border-red-500'}`}
                                    />
                                )}
                            />
                        </div>

                        {/* Diagnóstico (Movido aquí) */}
                        <div className="mb-8 border-b pb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Diagnóstico</h3>
                            <div className="space-y-3">
                                {currentDiagnoses.map((dx, i) => (
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
                                        {currentDiagnoses.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDiagnosis(i)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addDiagnosis}
                                    className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1 mt-2"
                                >
                                    <Plus size={16} /> Agregar diagnóstico
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Alimentación */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Alimentación</h4>
                                <FloatingLabelInput
                                    label="Detalles de alimentación"
                                    as="textarea"
                                    rows={2}
                                    value={watch('treatment.food')}
                                    onChange={e => setValue('treatment.food', e.target.value, { shouldDirty: true })}
                                    wrapperClassName={`border-2 ${isOnline ? 'border-black' : 'border-red-500'}`}
                                />
                            </div>

                            {/* Medicamentos - Lista */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Medicamentos</h4>
                                {getTreatmentArray('meds').map((med, i) => (
                                    <div key={i} className="mb-2">
                                        <input
                                            type="text"
                                            value={med}
                                            onChange={e => handleTreatmentChange('meds', i, e.target.value)}
                                            placeholder="Medicamento y dosis..."
                                            className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                        />
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTreatmentItem('meds')} className="text-blue-600 text-sm hover:underline">+ Agregar medicamento</button>
                            </div>

                            {/* Exámenes - Lista */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Exámenes</h4>
                                {getTreatmentArray('exams').map((exam, i) => (
                                    <div key={i} className="mb-2">
                                        <input
                                            type="text"
                                            value={exam}
                                            onChange={e => handleTreatmentChange('exams', i, e.target.value)}
                                            placeholder="Examen..."
                                            className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                        />
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTreatmentItem('exams')} className="text-blue-600 text-sm hover:underline">+ Agregar examen</button>
                            </div>

                            {/* Normas - Lista */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Normas e Indicaciones</h4>
                                {getTreatmentArray('norms').map((norm, i) => (
                                    <div key={i} className="mb-2">
                                        <input
                                            type="text"
                                            value={norm}
                                            onChange={e => handleTreatmentChange('norms', i, e.target.value)}
                                            placeholder="Indicación..."
                                            className={isOnline ? INPUT_CLASS : INPUT_CLASS.replace('border-black', 'border-red-500')}
                                        />
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTreatmentItem('norms')} className="text-blue-600 text-sm hover:underline">+ Agregar indicación</button>
                            </div>
                        </div>
                    </Section>

                    {/* VIII. Orden Médica (New UI) */}
                    <Section title="VIII. Orden Médica">
                        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <button
                                type="button"
                                onClick={() => addMedicalOrder('prescription')}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Receta
                            </button>

                            <div className="relative group">
                                <button type="button" className="bg-[#083C79] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#062a55] transition flex items-center gap-2">
                                    <Plus size={16} /> Laboratorio
                                </button>
                                <div className="absolute top-full left-0 w-full h-4 bg-transparent z-10 hidden group-hover:block -mt-2"></div>
                                <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 hidden group-hover:block">
                                    <button type="button" onClick={() => addMedicalOrder('lab_general')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">General</button>
                                    <button type="button" onClick={() => addMedicalOrder('lab_basic', PANEL_BASICO_PRESET)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Panel Básico</button>
                                    <button type="button" onClick={() => addMedicalOrder('lab_extended', PANEL_AMPLIADO_PRESET)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Panel Ampliado</button>
                                    <button type="button" onClick={() => addMedicalOrder('lab_feces', PANEL_HECES_PRESET)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">Panel Heces</button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => addMedicalOrder('image')}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Imágenes
                            </button>

                            <button
                                type="button"
                                onClick={() => addMedicalOrder('endoscopy')}
                                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Endoscopia
                            </button>
                        </div>

                        <div className="space-y-6">
                            {(currentOrders).map((order) => (
                                <div key={order.id} className="relative bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm group">
                                    <button
                                        type="button"
                                        onClick={() => removeMedicalOrder(order.id)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="mb-3">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${order.type === 'prescription' ? 'bg-emerald-100 text-emerald-700' :
                                            order.type.startsWith('lab') ? 'bg-blue-100 text-blue-700' :
                                                order.type === 'image' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.type === 'prescription' ? 'Receta Médica' : order.type.startsWith('lab') ? 'Laboratorio' : order.type === 'image' ? 'Estudio de Imagen' : 'Endoscopia'}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <FloatingLabelInput
                                            label="Diagnóstico / Razón"
                                            value={order.diagnosis}
                                            onChange={e => updateMedicalOrder(order.id, 'diagnosis', e.target.value)}
                                            wrapperClassName="border-2 border-gray-100"
                                        />
                                        <FloatingLabelInput
                                            label="Contenido / Detalles"
                                            as="textarea"
                                            rows={3}
                                            value={order.content}
                                            onChange={e => updateMedicalOrder(order.id, 'content', e.target.value)}
                                            wrapperClassName="border-2 border-gray-100"
                                        />
                                    </div>
                                </div>
                            ))}
                            {currentOrders.length === 0 && <p className="text-center text-gray-400 py-4 italic">No hay órdenes médicas agregadas</p>}
                        </div>
                    </Section>

                    {/* IX. Comentarios Generales */}
                    {/* IX. Comentarios Generales (MOVIDO ARRIBA) */}

                    <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center z-50 pointer-events-none">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${isOnline ? 'bg-[#083C79] hover:bg-[#062a55] shadow-[#083C79]/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'} text-white px-10 py-4 rounded-2xl font-black text-lg uppercase tracking-tight flex items-center gap-3 shadow-2xl transition-all transform hover:scale-[1.03] active:scale-[0.97] pointer-events-auto disabled:opacity-50`}
                        >
                            {isOnline ? <Save size={24} /> : <WifiOff size={24} />}
                            {isSubmitting ? 'Guardando...' : (isOnline ? 'Guardar' : 'Guardar Localmente')}
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
