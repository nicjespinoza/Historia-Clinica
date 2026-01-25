
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  ageDetails: string; // "X años, Y meses, Z días"
  sex: 'Masculino' | 'Femenino';
  nationality?: string;
  profession: string;
  email: string;
  phone: string;
  phoneSecondary?: string;
  address: string;
  initialReason: string;
  createdAt: string;
  registrationSource?: 'online' | 'manual';
  isOnline?: boolean;
  legacyIdSistema?: string;
  registrationStatus?: string;
  registrationMessage?: string;
  isMigrated?: boolean;
  // Contacto de emergencia
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  emergencyContactRelation?: string;
  // Signos vitales
  vitalSigns?: {
    fc: string;
    fr: string;
    temp: string;
    pa: string;
    pam: string;
    sat02: string;
    weight: string;
    height: string;
    imc: string;
  };
  profileImage?: string;
}

// Helper to store dynamic checkbox data
export interface CheckboxData {
  [key: string]: boolean;
}

export interface PhysicalExam {
  fc: string;
  fr: string;
  temp: string;
  pa: string;
  pam: string;
  sat02: string;
  weight: string;
  height: string;
  imc: string;
  systems: {
    [key: string]: { normal: boolean; abnormal: boolean; description: string };
  };
}

export interface InitialHistory {
  id: string;
  patientId: string;
  date: string;
  time: string;
  motives: CheckboxData;
  otherMotive: string;
  evolutionTime: string;
  historyOfPresentIllness: string;
  cancerType?: string; // Para motivo de consulta Cáncer

  // Section I: Antecedentes Medicos Personales
  preExistingDiseases: { yes: boolean; no: boolean };
  neurological: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  metabolic: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  dermatologic?: { yes: boolean; no: boolean; conditions: CheckboxData; other: string }; // NUEVO
  respiratory: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  cardiac: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  gastro: { yes: boolean; no: boolean; conditions: CheckboxData; other: string; cancerType?: string };
  hepato: { yes: boolean; no: boolean; conditions: CheckboxData; other: string; cancerType?: string };
  peripheral: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  hematological: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  renal: { yes: boolean; no: boolean; conditions: CheckboxData; other: string; cancerType?: string };
  rheumatological: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  infectious: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  psychiatric: { yes: boolean; no: boolean; conditions: CheckboxData; other: string };
  gynecoPathological?: { yes: boolean; no: boolean; conditions: CheckboxData; other: string; cancerType?: string }; // NUEVO - Ginecológicas patológicas

  // Gyneco-obstétricos
  gyneco: {
    yes: boolean; no: boolean; na: boolean;
    conditions: CheckboxData; other: string;
    g: string; p: string; a: string; c: string;
    surgeries: string;
    gestationalDiabetes: { yes: boolean; no: boolean };
    preeclampsia: { yes: boolean; no: boolean };
    eclampsia: { yes: boolean; no: boolean };
    pregnancySuspicion: { yes: boolean; no: boolean; na: boolean };
    breastfeeding: { yes: boolean; no: boolean; na: boolean };
    lastPeriodDate?: string; // Fecha última regla
  };

  // Medications - Reestructurado
  regularMeds: { yes: boolean; no: boolean; list: CheckboxData; other: string; specific: string; description?: string };
  naturalMeds: { yes: boolean; no: boolean; description: string };

  // Cirugías y Hospitalizaciones - Combinado
  hospitalizations: { yes: boolean; no: boolean; reason: string };
  surgeries: { yes: boolean; no: boolean; list: string };
  surgeriesAndHospitalizations?: { yes: boolean; no: boolean; which: string }; // COMBINADO

  // Procedimientos endoscópicos con múltiples entradas
  endoscopy: {
    yes: boolean; no: boolean;
    list: string; results: string;
    procedures?: Array<{ which: string; results: string; lastDate: string }>;
  };

  // Implantes y dispositivos - Separados
  implants: { yes: boolean; no: boolean; which: string };
  devices: { yes: boolean; no: boolean; which: string };

  // Complicaciones reestructurado
  complications: { yes: boolean; no: boolean; list: string };

  // Anafilaxia/Shock - NUEVO
  anaphylaxis?: { yes: boolean; no: boolean; toWhat: string };

  // Allergies - Eliminado foodAllergies
  allergies: { yes: boolean; no: boolean; list: CheckboxData; other: string };
  foodAllergies: { yes: boolean; no: boolean; list: CheckboxData; other: string };
  foodIntolerances: { yes: boolean; no: boolean; list: CheckboxData; other?: string }; // Agregado other

  // Section II: Non-pathological
  pregnancyConfirmation?: { yes: boolean; no: boolean; lastPeriodDate?: string }; // Solo femenino
  currentBreastfeeding?: { yes: boolean; no: boolean }; // Solo femenino

  habits: { yes: boolean; no: boolean; list: CheckboxData; other: string; details?: { [key: string]: string } };
  transfusions: { yes: boolean; no: boolean; reactions: boolean; which: string };
  postTransfusionReactions?: { yes: boolean; no: boolean; which: string }; // NUEVO - Separado
  exposures: { yes: boolean; no: boolean; list: CheckboxData; other: string };

  // Section III: Family
  familyHistory: { yes: boolean; no: boolean; list: CheckboxData; other: string };
  familyGastro: { yes: boolean; no: boolean; list: CheckboxData; other: string }; // Se mantiene pero se elimina del UI

  // Section V: Exam & Diagnosis
  physicalExam: PhysicalExam;

  previousStudies: { yes: boolean; no: boolean; description: string };

  comments: string;

  treatment: {
    food: string;
    meds: string | string[];
    exams: string | string[];
    norms: string | string[];
  };

  orders: {
    medical: { included: boolean; details: string };
    prescription: { included: boolean; details: string };
    labs: { included: boolean; details: string };
    images: { included: boolean; details: string };
    endoscopy: { included: boolean; details: string };
  };

  diagnosis: string;
  diagnoses?: string[]; // Multiple diagnoses support
  medicalOrders?: MedicalOrder[]; // Complex orders support
  isValidated?: boolean;
  obesityHistory?: ObesityHistory;
}

export interface ObesityHistory {
  weightGainOnset: {
    childhood: boolean;
    youth: boolean;
    pregnancy: boolean;
    menopause: boolean;
    postEvent: boolean;
    when: string;
  };
  familyObesity: { yes: boolean; no: boolean; who: string };
  familyPathologies: { yes: boolean; no: boolean; who: string };
  previousTreatments: { yes: boolean; no: boolean; which: string };
  previousMeds: { yes: boolean; no: boolean; which: string };
  maxWeight: string;
  minWeight: string;
  reboundCause: string;
  previousActivity: { yes: boolean; no: boolean; which: string };
  currentActivity: { yes: boolean; no: boolean; which: string };
  qualityOfLifeAlteration: { yes: boolean; no: boolean; how: string };
  metrics: {
    height: string;
    currentWeight: string;
    currentImc: string;
    lostWeight: string;
    lostOverweightPercentage: string;
    lostImcExcessPercentage: string;
    desiredWeight: string;
    desiredImc: string;
  };
}

export interface MedicalOrder {
  id: string;
  type: 'prescription' | 'lab_general' | 'lab_basic' | 'lab_extended' | 'lab_feces' | 'image' | 'endoscopy';
  diagnosis: string;
  content: string;
}

export interface SubsequentConsult {
  id: string;
  patientId: string;
  date: string;
  time: string;
  motives: CheckboxData;
  otherMotive: string;
  evolutionTime: string;
  historyOfPresentIllness: string;
  physicalExam: PhysicalExam;

  labs: {
    performed: { yes: boolean; no: boolean };
    results: string;
  };
  comments: string;
  diagnoses: string[]; // Dynamic list

  treatment: {
    food: string;
    meds: string[];
    exams: string[];
    norms: string[];
  };

  medicalOrders?: MedicalOrder[]; // New structured orders

  status?: 'draft' | 'completed'; // New field for Assistant drafts
  obesityHistory?: ObesityHistory;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: 'presencial' | 'virtual';
  reason: string;
  confirmed?: boolean;
  uniqueId?: string; // e.g., "CITA-123"
}

export type ViewState = 'login' | 'patients' | 'register' | 'history' | 'profile' | 'consult' | 'report' | 'agenda' | 'patient-login' | 'patient-register' | 'patient-dashboard';

export interface User {
  email: string;
  name: string;
  role: string;
}

export interface ModalContent {
  title: string;
  body: React.ReactNode;
}

export interface AIAnalysisResult {
  summary: string;
  risks: string[];
  recommendations: string[];
}

export interface RiskPatient {
  id: string; // patientId
  risks: string[];
}

export interface DashboardStats {
  obesityPrevalence: {
    normal: number;
    overweight: number;
    obese: number;
  };
  topDiagnoses: {
    name: string;
    count: number;
  }[];
  riskPatients: RiskPatient[];
}
