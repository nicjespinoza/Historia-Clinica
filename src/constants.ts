export const MOTIVES_LIST = [
  "Sangrado digestivo", "Dificultad para tragar", "Dolor al tragar", "Dispepsia", "Reflujo", "Gastritis", "Ulcera",
  "Dolor abdominal", "Hernia", "Vomitos", "Enfermedad de Crohn", "Colitis", "Ulcerativa", "Colon irritable",
  "Sindrome diarreico", "Constipacion", "Distension abdominal", "Perdida de peso", "Anemia", "Pólipos", "Cáncer",
  "Ictericia", "Cirrosis hepática", "Calculo en via biliar", "Intolerancia alimenticia", "Masa abdominal",
  "Diverticulitis", "Hemorroides", "Fisura anal", "Pancreatitis", "Colecistitis", "Obesidad",
  "Hallazgo radiologico anormal", "Dolor anal", "Picazon anal", "Pared abdominal"
];

// NEUROLÓGICAS - Quitado: "Trastorno de la columna"
export const NEURO_LIST = [
  "Migraña", "Epilepsia", "Accidente cerebrovascular", "Aneurisma", "Parkinson", "Alzheimer",
  "Tumores", "Accidente isquemico transitorio", "Esclerosis multiple",
  "Demencia", "Traumatismo", "Neuropatia", "Autismo"
];

// METABÓLICAS - Agregado: "Resistencia a la Insulina"
export const METABOLIC_LIST = [
  "Obesidad", "Colesterol y triglicéridos altos", "Diabetes", "Resistencia a la Insulina",
  "Hipertiroidismo", "Hipotiroidismo", "Hipertension arterial"
];

// DERMATOLÓGICAS - NUEVO
export const DERMATOLOGIC_LIST = [
  "Dermatitis", "Psoriasis", "Herpes", "Rosácea", "Eccema", "Celulitis/Erisipela", "Urticaria", "Otros"
];

export const RESPIRATORY_LIST = [
  "Asma", "EPOC", "Tuberculosis", "Fibrosis pulmonar", "Apnea del sueño", "Cancer de pulmon",
  "Trombosis pulmonar", "Infec. respiratorias sup", "Bronquitis", "Neumonia", "Cancer de vias respiratorias"
];

export const CARDIAC_LIST = [
  "Hipertension arterial", "Insuficiencia cardiaca", "Infarto", "Cardiopatia isquémica", "Arritmias",
  "Angina de pecho", "Enfermedad valvular", "Miocardiopatia", "Cardiopatias congenita", "Endocarditis"
];

// GASTROINTESTINALES - Agregado: "Acalasia", "Síndrome de malabsorción"
export const GASTRO_LIST = [
  "Trastorno motor esofagico", "Sangrado digestivo", "Dispepsia", "Reflujo", "Gastritis", "Ulcera",
  "Enfermedad de Crohn", "Colitis Ulcerativa", "Colon irritable", "Diarrea cronica", "Constipacion cronica",
  "Pólipos", "Cáncer", "Intolerancia alimenticia", "Disfagia neurogenica", "Enfermedad diverticular",
  "Hemorroides", "Fisura anal", "Fistula anal", "Acalasia", "Síndrome de malabsorción"
];

// HEPATOBILIOPANCREÁTICAS - Agregado: "Várices", "Ictericia"
export const HEPATO_LIST = [
  "Higado graso", "Hepatitis", "Cirrosis", "Cancer higado", "Hemocromatosis", "Litiasis vesicular",
  "Litiasis de la via biliar", "Colangitis esclerosante primaria", "Pancreatitis", "Cáncer",
  "Várices", "Ictericia"
];

export const PERIPHERAL_LIST = [
  "Insuficiencia venosa", "Varices", "Trombosis venosa superficial", "Trombosis venosa profunda",
  "Obstrucción arterial aguda o crónica", "Aneurisma", "Enfermedad carotidea"
];

// HEMATOLÓGICAS - Ya tiene "Purpura trombocitopenica Idiopatica"
export const HEMATO_LIST = [
  "Sangrados o hematomas frecuentes", "Leucemia", "Linfomas", "Mieloma", "Anemia", "Hemofilia",
  "Púrpura trombocitopénica idiopática", "Trombofilia", "Neutropenia", "Sindrome mileodisplasico",
  "Policitemia vera", "Plaquetopenia", "Trombocitosis"
];

// RENO-URETERALES (antes Reno-uretero-vesical) - Agregado: "Hiperplasia prostática benigna"
export const RENAL_LIST = [
  "Insuficiencia renal", "Calculos", "Cáncer", "Infecciones a repeticion", "Enfermedad renal diabética",
  "Enfermedad renal hipertensiva", "Pielonefritis", "Enfermedad quística", "Transplantado renal",
  "Hiperplasia prostática benigna"
];

// REUMATOLÓGICAS/AUTOINMUNES - Quitado: "Enfermedades autoinmunes"
export const RHEUMA_LIST = [
  "Lupus", "Artritis", "Artrosis", "Esclerodermia", "Fibromialgia", "Gota", "Osteoporosis",
  "Polimialgia", "Polimiositis", "Esclerosis multiple", "Sarcoidosis", "Sd Antifosfolipidos",
  "Vasculitis", "Sindrome de Sjogren"
];

export const INFECTIOUS_LIST = [
  "Malaria", "VIH", "Dengue", "Sarampion", "Hepatitis", "Covid", "Amigdalitis", "ETS", "Herpes",
  "Parasitosis", "Neumonia"
];

export const PSYCH_LIST = [
  "Ansiedad", "Depresion", "Esquizofrenia", "Trastorno bipolar", "Ataques de panico",
  "Intento de suicidio", "Fobias", "Alzheimer", "Trastorno obsesivo compulsivo", "Anorexia", "Bulimia", "TDAH"
];

// GINECOLÓGICAS PATOLÓGICAS (Solo femenino) - NUEVO
export const GYNECO_PATHOLOGICAL_LIST = [
  "Miomas", "Quistes de ovario", "Endometriosis", "Aborto", "Preeclampsia", "Infecciones vaginales",
  "Eclampsia", "Prolapso genital", "Diabetes gestacional", "Cáncer", "Síndrome de ovario poliquístico",
  "Embarazo ectópico", "Infertilidad", "Trastornos hormonales", "Otros"
];

// Lista original para Gineco-obstétricos del formulario
export const GYNECO_LIST = [
  "Endometriosis", "Miomas", "Cancer cervicouterino", "Prolapso uterino", "Quistes de ovarios",
  "Ovario poliquístico", "Hemorragia disfuncional", "Infecciones ginecologicas"
];

// MEDICAMENTOS (ya no se usa como checkboxes, solo texto descriptivo)
export const MEDS_LIST = [
  "Analgesicos", "Antibióticos", "Protectores gástricos", "Antihipertensivos", "Hipoglicemiantes",
  "Antiarrítmicos", "Anticoagulantes", "Aspirina", "Antigagregantes plaquetarios", "Antiulcerosos",
  "Antiácidos", "Antidepresivos", "Antisicoticos", "Ansioliticos"
];

export const ALLERGIES_LIST = [
  "Medicamentos", "Yodo", "Latex", "Anestesicos", "Transfusiones sanguineas", "Medio de contraste"
];

// Eliminado FOOD_ALLERGIES_LIST según plan
export const FOOD_ALLERGIES_LIST = [
  "Leche", "Mariscos", "Huevo", "Pescado", "Maní", "Soja", "Trigo", "Frutos secos"
];

export const FOOD_INTOLERANCES_LIST = [
  "Gluten", "Lactosa", "Fructosa", "Histamina", "Sorbitol", "Salicilatos", "Sacarosa"
];

// HÁBITOS - Los que requieren input "¿Cuáles?": Drogas, Psicofarmacos, Medicamentos controlados
export const HABITS_LIST = [
  "Tabaquismo", "Alcohol", "Drogas", "Cafeina", "Psicofarmacos", "Vaping", "Medicamentos controlados"
];

// Hábitos que requieren input adicional "¿Cuáles?"
export const HABITS_WITH_DETAIL = ["Drogas", "Psicofarmacos", "Medicamentos controlados"];

export const EXPOSURES_LIST = [
  "Quimicos", "Derivados del petroleo", "Radiaciones", "Mineria", "Aserrin", "Plomo", "Pinturas",
  "Venenos", "Fertilizantes", "Hierro y acero", "Caucho", "Aluminio", "Derivados el alcohol"
];

export const FAMILY_LIST = [
  "Cancer", "Hipertiroidismo", "Hipotiroidismo", "Colitis ulcerativa", "E. Crohn", "Poliposis",
  "Diabetes", "Hipertension", "Cardiopatia isquemica", "Asma", "EPOC", "Epilepsia", "Enf. Autoinmune"
];

// Se mantiene pero se eliminará del formulario según plan
export const FAMILY_GASTRO_LIST = [
  "Colitis Ulcerativa", "Enfermedad de Crohn", "Síndrome polipósico", "Cancer digestivo", "Enfermedades autoinmunes digestivas"
];

export const SYSTEMS_LIST = [
  "Piel y anexos", "Cabeza", "Cuello", "Torax", "Cardiaco", "Pulmonar", "Abdomen",
  "Miembros superiores", "Miembros inferiores", "Neurologico", "Genitales", "Tacto Rectal"
];