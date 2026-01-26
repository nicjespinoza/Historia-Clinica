import { z } from 'zod';

// ============================================
// Reusable Schema Building Blocks
// ============================================

/** Yes/No toggle (mutually exclusive) */
export const yesNoSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
});

/** Yes/No with N/A option */
export const yesNoNaSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    na: z.boolean().default(false),
});

/** Dynamic checkbox data (key-value pairs) */
export const checkboxDataSchema = z.record(z.string(), z.boolean());

/** Medical condition group with yes/no, conditions list, and other field */
export const conditionGroupSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    conditions: checkboxDataSchema.default({}),
    other: z.string().default(''),
});

// ============================================
// Patient Schema (RegisterScreen)
// ============================================

export const patientSchema = z.object({
    firstName: z.string().min(1, 'El nombre es requerido'),
    lastName: z.string().min(1, 'Los apellidos son requeridos'),
    birthDate: z.string().min(1, 'La fecha de nacimiento es requerida'),
    sex: z.enum(['Masculino', 'Femenino'], {
        error: 'Seleccione el sexo',
    }),
    nationality: z.string().default(''),
    profession: z.string().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    phone: z.string().default(''),
    phoneSecondary: z.string().default(''),
    address: z.string().default(''),
    initialReason: z.string().default(''),
    // Contacto de emergencia
    emergencyContactName: z.string().default(''),
    emergencyContactPhone: z.string().default(''),
    emergencyContactEmail: z.string().default(''),
    emergencyContactRelation: z.string().default(''),
    // Signos vitales iniciales
    vitalSigns: z.object({
        fc: z.string().default(''),
        fr: z.string().default(''),
        temp: z.string().default(''),
        pa: z.string().default(''),
        pam: z.string().default(''),
        sat02: z.string().default(''),
        weight: z.string().default(''),
        height: z.string().default(''),
        imc: z.string().default(''),
    }).optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

// ============================================
// Physical Exam Schema
// ============================================

export const systemExamSchema = z.object({
    normal: z.boolean().default(false),
    abnormal: z.boolean().default(false),
    description: z.string().default(''),
});

export const physicalExamSchema = z.object({
    fc: z.string().default(''),
    fr: z.string().default(''),
    temp: z.string().default(''),
    pa: z.string().default(''),
    pam: z.string().default(''),
    sat02: z.string().default(''),
    weight: z.string().default(''),
    height: z.string().default(''),
    imc: z.string().default(''),
    systems: z.record(z.string(), systemExamSchema).default({}),
});

// ============================================
// Gyneco-Obstetric Schema
// ============================================

export const gynecoSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    na: z.boolean().default(false),
    conditions: checkboxDataSchema.default({}),
    other: z.string().default(''),
    g: z.string().default(''),
    p: z.string().default(''),
    a: z.string().default(''),
    c: z.string().default(''),
    surgeries: z.string().default(''),
    gestationalDiabetes: yesNoSchema.default({ yes: false, no: false }),
    preeclampsia: yesNoSchema.default({ yes: false, no: false }),
    eclampsia: yesNoSchema.default({ yes: false, no: false }),
    pregnancySuspicion: yesNoNaSchema.default({ yes: false, no: false, na: false }),
    breastfeeding: yesNoNaSchema.default({ yes: false, no: false, na: false }),
});

// ============================================
// Medications & Other Antecedents
// ============================================

export const regularMedsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: checkboxDataSchema.default({}),
    other: z.string().default(''),
    specific: z.string().default(''),
    description: z.string().default(''), // Alias for specific, used in some forms
});

export const naturalMedsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    description: z.string().default(''),
});

export const hospitalizationsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    reason: z.string().default(''),
});

export const surgeriesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: z.string().default(''),
});

export const endoscopySchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: z.string().default(''),
    results: z.string().default(''),
});

export const complicationsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: z.string().default(''),
});

export const implantsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    which: z.string().default(''),
});

export const devicesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    which: z.string().default(''),
});

// ============================================
// Allergies
// ============================================

export const allergiesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: checkboxDataSchema.default({}),
    other: z.string().default(''),
});

export const foodIntolerancesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: checkboxDataSchema.default({}),
    other: z.string().default(''), // Added for form compatibility
});

// ============================================
// Non-Pathological Antecedents
// ============================================

export const habitsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: checkboxDataSchema.default({}),
    other: z.string().default(''),
});

export const transfusionsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    reactions: z.boolean().default(false),
    which: z.string().default(''),
});

export const exposuresSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: checkboxDataSchema.default({}),
    other: z.string().default(''),
});

// ============================================
// Family History
// ============================================

export const familyHistorySchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(false),
    list: checkboxDataSchema.default({}),
    other: z.string().default(''),
});

// ============================================
// Obesity History (Optional)
// ============================================

export const obesityHistorySchema = z.object({
    weightGainOnset: z.object({
        childhood: z.boolean().default(false),
        youth: z.boolean().default(false),
        pregnancy: z.boolean().default(false),
        menopause: z.boolean().default(false),
        postEvent: z.boolean().default(false),
        when: z.string().default(''),
    }),
    familyObesity: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        who: z.string().default(''),
    }),
    familyPathologies: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        who: z.string().default(''),
    }),
    previousTreatments: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        which: z.string().default(''),
    }),
    previousMeds: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        which: z.string().default(''),
    }),
    maxWeight: z.string().default(''),
    minWeight: z.string().default(''),
    reboundCause: z.string().default(''),
    previousActivity: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        which: z.string().default(''),
    }),
    currentActivity: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        which: z.string().default(''),
    }),
    qualityOfLifeAlteration: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        how: z.string().default(''),
    }),
    metrics: z.object({
        height: z.string().default(''),
        currentWeight: z.string().default(''),
        currentImc: z.string().default(''),
        lostWeight: z.string().default(''),
        lostOverweightPercentage: z.string().default(''),
        lostImcExcessPercentage: z.string().default(''),
        desiredWeight: z.string().default(''),
        desiredImc: z.string().default(''),
    }),
}).optional();

// ============================================
// Initial History Schema (InitialHistoryScreen)
// ============================================

export const initialHistorySchema = z.object({
    id: z.string(),
    patientId: z.string(),
    date: z.string(),
    time: z.string(),

    // Motives
    motives: checkboxDataSchema.default({}),
    otherMotive: z.string().default(''),
    evolutionTime: z.string().default(''),
    historyOfPresentIllness: z.string().default(''),

    // Section I: Personal Medical Antecedents
    preExistingDiseases: yesNoSchema.default({ yes: false, no: false }),
    neurological: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    metabolic: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    dermatologic: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }), // NUEVO
    respiratory: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    cardiac: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    gastro: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    hepato: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    peripheral: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    hematological: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    renal: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    rheumatological: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    infectious: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    psychiatric: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }),
    gynecoPathological: conditionGroupSchema.default({ yes: false, no: false, conditions: {}, other: '' }), // NUEVO

    // Gyneco
    gyneco: gynecoSchema.default({
        yes: false, no: false, na: false, conditions: {}, other: '',
        g: '', p: '', a: '', c: '', surgeries: '',
        gestationalDiabetes: { yes: false, no: false },
        preeclampsia: { yes: false, no: false },
        eclampsia: { yes: false, no: false },
        pregnancySuspicion: { yes: false, no: false, na: false },
        breastfeeding: { yes: false, no: false, na: false },
    }),

    // Medications & Other
    regularMeds: regularMedsSchema.default({ yes: false, no: false, list: {}, other: '', specific: '', description: '' }),
    naturalMeds: naturalMedsSchema.default({ yes: false, no: false, description: '' }),
    hospitalizations: hospitalizationsSchema.default({ yes: false, no: false, reason: '' }),
    surgeries: surgeriesSchema.default({ yes: false, no: false, list: '' }),
    endoscopy: endoscopySchema.default({ yes: false, no: false, list: '', results: '' }),
    complications: complicationsSchema.default({ yes: false, no: false, list: '' }),

    // Allergies
    allergies: allergiesSchema.default({ yes: false, no: false, list: {}, other: '' }),
    foodAllergies: allergiesSchema.default({ yes: false, no: false, list: {}, other: '' }),
    foodIntolerances: foodIntolerancesSchema.default({ yes: false, no: false, list: {}, other: '' }),

    // Implants
    implants: implantsSchema.default({ yes: false, no: false, which: '' }),
    devices: devicesSchema.default({ yes: false, no: false, which: '' }),

    // Section II: Non-Pathological
    habits: habitsSchema.default({ yes: false, no: false, list: {}, other: '' }),
    transfusions: transfusionsSchema.default({ yes: false, no: false, reactions: false, which: '' }),
    exposures: exposuresSchema.default({ yes: false, no: false, list: {}, other: '' }),

    // Section III & IV: Family
    familyHistory: familyHistorySchema.default({ yes: false, no: false, list: {}, other: '' }),
    familyGastro: familyHistorySchema.default({ yes: false, no: false, list: {}, other: '' }),

    // Previous Studies
    previousStudies: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(false),
        description: z.string().default(''),
    }).default({ yes: false, no: false, description: '' }),

    // Comments
    comments: z.string().default(''),

    // Treatment
    treatment: z.object({
        food: z.string().default(''),
        meds: z.string().default(''),
        exams: z.string().default(''),
        norms: z.string().default(''),
    }).default({ food: '', meds: '', exams: '', norms: '' }),

    // Orders
    orders: z.object({
        medical: z.object({ included: z.boolean().default(false), details: z.string().default('') }),
        prescription: z.object({ included: z.boolean().default(false), details: z.string().default('') }),
        labs: z.object({ included: z.boolean().default(false), details: z.string().default('') }),
        images: z.object({ included: z.boolean().default(false), details: z.string().default('') }),
        endoscopy: z.object({ included: z.boolean().default(false), details: z.string().default('') }),
    }).default({
        medical: { included: false, details: '' },
        prescription: { included: false, details: '' },
        labs: { included: false, details: '' },
        images: { included: false, details: '' },
        endoscopy: { included: false, details: '' },
    }),

    // Section V: Physical Exam
    physicalExam: physicalExamSchema.default({
        fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
        systems: {},
    }),

    // Diagnosis
    diagnosis: z.string().default(''),
    isValidated: z.boolean().default(true),

    // Consultation Cost
    consultationCost: z.number().optional(),

    // Optional: Obesity History
    obesityHistory: obesityHistorySchema,
});

export type InitialHistoryFormData = z.infer<typeof initialHistorySchema>;

// ============================================
// Default Values Factory
// ============================================

export const getDefaultPatientValues = (): PatientFormData => ({
    firstName: '',
    lastName: '',
    birthDate: '',
    sex: 'Masculino',
    nationality: '',
    profession: '',
    email: '',
    phone: '',
    phoneSecondary: '',
    address: '',
    initialReason: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    emergencyContactRelation: '',
    vitalSigns: {
        fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: ''
    },
});

export const getDefaultInitialHistoryValues = (patientId: string): InitialHistoryFormData => ({
    id: Math.random().toString(36),
    patientId,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    motives: {},
    otherMotive: '',
    evolutionTime: '',
    historyOfPresentIllness: '',
    preExistingDiseases: { yes: false, no: false },
    neurological: { yes: false, no: false, conditions: {}, other: '' },
    metabolic: { yes: false, no: false, conditions: {}, other: '' },
    dermatologic: { yes: false, no: false, conditions: {}, other: '' }, // NUEVO
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
    gynecoPathological: { yes: false, no: false, conditions: {}, other: '' }, // NUEVO
    gyneco: {
        yes: false, no: false, na: false, conditions: {}, other: '',
        g: '', p: '', a: '', c: '', surgeries: '',
        gestationalDiabetes: { yes: false, no: false },
        preeclampsia: { yes: false, no: false },
        eclampsia: { yes: false, no: false },
        pregnancySuspicion: { yes: false, no: false, na: false },
        breastfeeding: { yes: false, no: false, na: false },
    },
    regularMeds: { yes: false, no: false, list: {}, other: '', specific: '', description: '' },
    naturalMeds: { yes: false, no: false, description: '' },
    hospitalizations: { yes: false, no: false, reason: '' },
    surgeries: { yes: false, no: false, list: '' },
    endoscopy: { yes: false, no: false, list: '', results: '' },
    complications: { yes: false, no: false, list: '' },
    allergies: { yes: false, no: false, list: {}, other: '' },
    foodAllergies: { yes: false, no: false, list: {}, other: '' },
    foodIntolerances: { yes: false, no: false, list: {}, other: '' },
    implants: { yes: false, no: false, which: '' },
    devices: { yes: false, no: false, which: '' },
    habits: { yes: false, no: false, list: {}, other: '' },
    transfusions: { yes: false, no: false, reactions: false, which: '' },
    exposures: { yes: false, no: false, list: {}, other: '' },
    familyHistory: { yes: false, no: false, list: {}, other: '' },
    familyGastro: { yes: false, no: false, list: {}, other: '' },
    physicalExam: {
        fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
        systems: {
            "Piel y anexos": { normal: true, abnormal: false, description: '' },
            "Cabeza": { normal: true, abnormal: false, description: '' },
            "Cuello": { normal: true, abnormal: false, description: '' },
            "Torax": { normal: true, abnormal: false, description: '' },
            "Cardiaco": { normal: true, abnormal: false, description: '' },
            "Pulmonar": { normal: true, abnormal: false, description: '' },
            "Abdomen": { normal: true, abnormal: false, description: '' },
            "Miembros superiores": { normal: true, abnormal: false, description: '' },
            "Miembros inferiores": { normal: true, abnormal: false, description: '' },
            "Neurologico": { normal: true, abnormal: false, description: '' },
            "Genitales": { normal: true, abnormal: false, description: '' },
            "Tacto Rectal": { normal: true, abnormal: false, description: '' }
        },
    },
    previousStudies: { yes: false, no: false, description: '' },
    comments: '',
    treatment: { food: '', meds: '', exams: '', norms: '' },
    orders: {
        medical: { included: false, details: '' },
        prescription: { included: false, details: '' },
        labs: { included: false, details: '' },
        images: { included: false, details: '' },
        endoscopy: { included: false, details: '' },
    },
    diagnosis: '',
    isValidated: true,
    obesityHistory: undefined,
});
