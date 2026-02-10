import { z } from 'zod';

// ============================================
// Reusable Schema Building Blocks
// ============================================

/** Yes/No toggle (mutually exclusive) */
export const yesNoSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
}).default({ yes: false, no: true });

/** Yes/No with legacy N/A compatibility (removed NA) */
export const yesNoNaSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
}).default({ yes: false, no: true });

/** Dynamic checkbox data (key-value pairs) */
export const checkboxDataSchema = z.any().transform(v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}).default({});

/** Medical condition group with yes/no, conditions list, and other field */
export const conditionGroupSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    conditions: checkboxDataSchema,
    cancerDetails: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, conditions: {}, cancerDetails: '', other: '' });




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
    no: z.boolean().default(true),
    conditions: checkboxDataSchema,
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    g: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    p: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    a: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    c: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    surgeries: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    gestationalDiabetes: yesNoSchema,
    preeclampsia: yesNoSchema,
    eclampsia: yesNoSchema,
    pregnancySuspicion: yesNoSchema,
    breastfeeding: yesNoSchema,
}).default({
    yes: false, no: true, conditions: {}, other: '',
    g: '', p: '', a: '', c: '', surgeries: '',
    gestationalDiabetes: { yes: false, no: true },
    preeclampsia: { yes: false, no: true },
    eclampsia: { yes: false, no: true },
    pregnancySuspicion: { yes: false, no: true },
    breastfeeding: { yes: false, no: true },
});

// ============================================
// Medications & Other Antecedents
// ============================================

export const regularMedsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: checkboxDataSchema,
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    specific: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    description: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: {}, other: '', specific: '', description: '' });

export const naturalMedsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    description: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, description: '' });

export const hospitalizationsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    reason: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, reason: '' });

export const surgeriesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: '' });

export const endoscopySchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    results: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    procedures: z.array(z.object({
        which: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
        lastDate: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
        results: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    })).default([]),
}).default({ yes: false, no: true, list: '', results: '', procedures: [] });

export const complicationsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: '' });

export const implantsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    which: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, which: '' });

export const devicesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    which: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, which: '' });

// ============================================
// Allergies
// ============================================

export const allergiesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: checkboxDataSchema,
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: {}, other: '' });

export const foodIntolerancesSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: checkboxDataSchema,
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: {}, other: '' });

// ============================================
// Non-Pathological Antecedents
// ============================================

export const habitsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: checkboxDataSchema,
    drugsDetails: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    psychDetails: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    controlledDetails: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    details: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({
    yes: false,
    no: true,
    list: {},
    drugsDetails: '',
    psychDetails: '',
    controlledDetails: '',
    details: '',
    other: ''
});

export const transfusionsSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    reactions: yesNoSchema,
    which: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, reactions: { yes: false, no: true }, which: '' });

export const exposuresSchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: checkboxDataSchema,
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: {}, other: '' });

// ============================================
// Family History
// ============================================

export const familyHistorySchema = z.object({
    yes: z.boolean().default(false),
    no: z.boolean().default(true),
    list: checkboxDataSchema,
    cancerDetails: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    other: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
}).default({ yes: false, no: true, list: {}, cancerDetails: '', other: '' });

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
// Patient Schema (RegisterScreen)
// ============================================

export const patientSchema = z.object({
    firstName: z.string().default(''),
    lastName: z.string().default(''),
    birthDate: z.string().default(''),
    sex: z.enum(['Masculino', 'Femenino'], {
        error: 'Seleccione el sexo',
    }).default('Masculino'),
    nationality: z.string().default(''),
    profession: z.string().default(''),
    email: z.string().email('Email inválido').or(z.literal('')).default(''),
    phone: z.string().default(''),
    phoneSecondary: z.string().default(''),
    address: z.string().default(''),
    initialReason: z.string().default(''),
    motives: checkboxDataSchema,
    motivesCancerDetails: z.string().default(''),
    motivesOther: z.string().default(''),
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
    obesityHistory: obesityHistorySchema,
});

export type PatientFormData = z.infer<typeof patientSchema>;

// ============================================
// Initial History Schema (InitialHistoryScreen)
// ============================================

export const initialHistorySchema = z.object({
    id: z.string(),
    patientId: z.string(),
    date: z.string(),
    time: z.string(),

    // Motives
    motives: checkboxDataSchema,
    motivesCancerDetails: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    otherMotive: z.string().default(''),
    evolutionTime: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    historyOfPresentIllness: z.any().transform(v => typeof v === 'string' ? v : '').default(''),

    // Section I: Personal Medical Antecedents
    preExistingDiseases: yesNoSchema,
    neurological: conditionGroupSchema,
    metabolic: conditionGroupSchema,
    dermatologic: conditionGroupSchema,
    respiratory: conditionGroupSchema,
    cardiac: conditionGroupSchema,
    gastro: conditionGroupSchema,
    hepato: conditionGroupSchema,
    peripheral: conditionGroupSchema,
    hematological: conditionGroupSchema,
    renal: conditionGroupSchema,
    rheumatological: conditionGroupSchema,
    infectious: conditionGroupSchema,
    psychiatric: conditionGroupSchema,
    gynecoPathological: conditionGroupSchema,

    // Gyneco
    gyneco: gynecoSchema,

    // Medications & Other
    regularMeds: regularMedsSchema,
    naturalMeds: naturalMedsSchema,
    hospitalizations: hospitalizationsSchema,
    surgeries: surgeriesSchema,
    endoscopy: endoscopySchema,
    complications: complicationsSchema,

    // Allergies
    allergies: allergiesSchema,
    anaphylaxis: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(true),
        description: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    }).default({ yes: false, no: true, description: '' }),
    foodAllergies: allergiesSchema,
    foodIntolerances: foodIntolerancesSchema,

    // Implants
    implants: implantsSchema,
    devices: devicesSchema,

    // Section II: Non-Pathological
    habits: habitsSchema,
    transfusions: transfusionsSchema,
    exposures: exposuresSchema,

    // Section III & IV: Family
    familyHistory: familyHistorySchema,
    familyGastro: familyHistorySchema,

    // Previous Studies
    previousStudies: z.object({
        yes: z.boolean().default(false),
        no: z.boolean().default(true),
        description: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    }).default({ yes: false, no: true, description: '' }),

    // Comments
    comments: z.any().transform(v => typeof v === 'string' ? v : '').default(''),

    // Treatment
    treatment: z.object({
        food: z.union([z.string(), z.array(z.string())]).default(''),
        meds: z.union([z.string(), z.array(z.string())]).default(''),
        exams: z.union([z.string(), z.array(z.string())]).default(''),
        norms: z.union([z.string(), z.array(z.string())]).default(''),
    }).default({ food: '', meds: '', exams: '', norms: '' }),

    // Orders (Legacy)
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

    // New Structured Medical Orders
    medicalOrders: z.array(z.object({
        id: z.string(),
        type: z.enum(['prescription', 'lab_general', 'lab_basic', 'lab_extended', 'lab_feces', 'image', 'endoscopy']),
        diagnosis: z.string().default(''),
        content: z.string().default('')
    })).optional().default([]),

    // Section V: Physical Exam
    physicalExam: physicalExamSchema.default({
        fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '',
        systems: {},
    }),

    // Diagnosis
    diagnosis: z.any().transform(v => typeof v === 'string' ? v : '').default(''),
    diagnoses: z.array(z.string()).optional(), // Added for array support
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
    motives: {},
    motivesCancerDetails: '',
    motivesOther: '',
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
    motivesCancerDetails: '',
    otherMotive: '',
    evolutionTime: '',
    historyOfPresentIllness: '',
    preExistingDiseases: { yes: false, no: true },
    neurological: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    metabolic: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    dermatologic: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    respiratory: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    cardiac: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    gastro: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    hepato: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    peripheral: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    hematological: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    renal: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    rheumatological: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    infectious: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    psychiatric: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    gynecoPathological: { yes: false, no: true, conditions: {}, cancerDetails: '', other: '' },
    gyneco: {
        yes: false, no: true, conditions: {}, other: '',
        g: '', p: '', a: '', c: '', surgeries: '',
        gestationalDiabetes: { yes: false, no: true },
        preeclampsia: { yes: false, no: true },
        eclampsia: { yes: false, no: true },
        pregnancySuspicion: { yes: false, no: true },
        breastfeeding: { yes: false, no: true },
    },
    regularMeds: { yes: false, no: true, list: {}, other: '', specific: '', description: '' },
    naturalMeds: { yes: false, no: true, description: '' },
    hospitalizations: { yes: false, no: true, reason: '' },
    surgeries: { yes: false, no: true, list: '' },
    endoscopy: { yes: false, no: true, list: '', results: '', procedures: [{ which: '', lastDate: '', results: '' }] },
    complications: { yes: false, no: true, list: '' },
    allergies: { yes: false, no: true, list: {}, other: '' },
    anaphylaxis: { yes: false, no: true, description: '' },
    foodAllergies: { yes: false, no: true, list: {}, other: '' },
    foodIntolerances: { yes: false, no: true, list: {}, other: '' },
    implants: { yes: false, no: true, which: '' },
    devices: { yes: false, no: true, which: '' },
    habits: {
        yes: false,
        no: true,
        list: {},
        drugsDetails: '',
        psychDetails: '',
        controlledDetails: '',
        details: '',
        other: ''
    },
    transfusions: { yes: false, no: true, reactions: { yes: false, no: true }, which: '' },
    exposures: { yes: false, no: true, list: {}, other: '' },
    familyHistory: { yes: false, no: true, list: {}, cancerDetails: '', other: '' },
    familyGastro: { yes: false, no: true, list: {}, cancerDetails: '', other: '' },
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
    previousStudies: { yes: false, no: true, description: '' },
    comments: '',
    treatment: { food: '', meds: '', exams: '', norms: '' },
    orders: {
        medical: { included: false, details: '' },
        prescription: { included: false, details: '' },
        labs: { included: false, details: '' },
        images: { included: false, details: '' },
        endoscopy: { included: false, details: '' },
    },
    medicalOrders: [],
    diagnosis: '',
    isValidated: true,
    obesityHistory: undefined,
});
