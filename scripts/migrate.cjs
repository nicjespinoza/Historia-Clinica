
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    try {
        admin = require('./functions/node_modules/firebase-admin');
    } catch (e2) {
        console.error("❌ Error: No se encontró 'firebase-admin'. Ejecuta 'npm install firebase-admin' en la raíz.");
        process.exit(1);
    }
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'data', 'serviceAccountKey.json');
const PACIENTES_FILE = path.join(__dirname, 'data', 'wix_pacientes.json');
const EVOLUCION_FILE = path.join(__dirname, 'data', 'wix_evolucion.json');

// Inicializar Firebase Admin
let serviceAccount;
try {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch (error) {
    console.error(`❌ Error fatal: No se encontró el archivo de credenciales en: ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ============================================================================
// HELPERS
// ============================================================================

function safeJsonParse(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    try {
        if (input.trim().startsWith('[')) {
            return JSON.parse(input);
        }
        return [input];
    } catch (e) {
        return [input];
    }
}

function arrayToBooleanMap(input) {
    const map = {};
    if (!input) return map;
    let array = safeJsonParse(input);
    if (typeof array === 'string') {
        array = array.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(array)) {
        array.forEach(item => {
            if (item) map[item] = true;
        });
    }
    return map;
}

function stringToArray(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    // Split by newline or numbered list markers (1., 2.)
    return input.split(/\n|\d+\.\s+/).map(s => s.trim()).filter(s => s.length > 0);
}

function cleanString(str) {
    return str ? String(str).trim() : '';
}

function buildAntecedent(status, listRaw, otherRaw = '', descRaw = '') {
    const s = cleanString(status).toLowerCase();
    const isYes = s === 'si' || s === 'yes' || s === 'true';

    let details = [];
    if (listRaw) {
        const parsed = safeJsonParse(listRaw);
        if (Array.isArray(parsed)) {
            details = parsed.filter(i => i && i !== 'Otros');
        } else if (typeof parsed === 'string') {
            details.push(parsed);
        }
    }

    const otherText = cleanString(otherRaw);
    const descText = cleanString(descRaw);

    let finalDescription = details.join(', ');
    if (otherText) finalDescription += (finalDescription ? `, ${otherText}` : otherText);
    if (descText) finalDescription += (finalDescription ? `, ${descText}` : descText);

    return {
        yes: isYes,
        list: finalDescription,
        other: otherText
    };
}

function formatSystemField(mainValue, descriptionValue) {
    const val = mainValue || '';
    const isAbnormal = val === 'Anormal' || val === 'Si' || (val && val.toLowerCase() !== 'normal' && val.toLowerCase() !== 'no');

    return {
        normal: !isAbnormal,
        abnormal: !!isAbnormal,
        description: descriptionValue || (isAbnormal ? val : '')
    };
}

function parseDate(dateString) {
    if (!dateString) return admin.firestore.FieldValue.serverTimestamp();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return admin.firestore.FieldValue.serverTimestamp();
    }
    return admin.firestore.Timestamp.fromDate(date);
}

// ============================================================================
// GESTOR DE LOTES
// ============================================================================
class BatchManager {
    constructor(db, limit = 400) {
        this.db = db;
        this.limit = limit;
        this.batch = db.batch();
        this.count = 0;
        this.totalCommitted = 0;
    }

    async setWithId(collectionName, docId, data) {
        const ref = this.db.collection(collectionName).doc(docId);
        this.batch.set(ref, data);
        this.count++;
        await this.checkCommit();
    }

    async checkCommit() {
        if (this.count >= this.limit) {
            await this.commit();
        }
    }

    async commit() {
        if (this.count > 0) {
            await this.batch.commit();
            this.totalCommitted += this.count;
            console.log(`💾 Lote guardado: ${this.totalCommitted} documentos procesados.`);
            this.batch = this.db.batch();
            this.count = 0;
        }
    }
}

async function cleanDatabase() {
    const collections = ['patients', 'initialHistories', 'subsequentConsults'];
    console.log("🧹 Iniciando limpieza de base de datos...");

    for (const colName of collections) {
        const ref = db.collection(colName);
        const snapshot = await ref.count().get();
        if (snapshot.data().count > 0) {
            process.stdout.write(`   - Eliminando documentos de '${colName}'... `);
            try {
                await db.recursiveDelete(ref);
                console.log("✅");
            } catch (e) {
                console.log("⚠️ (recursiveDelete falló, intentando manual)");
                const docs = await ref.listDocuments();
                const batch = db.batch();
                let i = 0;
                for (const doc of docs) {
                    batch.delete(doc);
                    i++;
                    if (i >= 400) { await batch.commit(); i = 0; }
                }
                if (i > 0) await batch.commit();
                console.log("✅");
            }
        } else {
            console.log(`   - '${colName}' ya está vacía.`);
        }
    }
    console.log("✨ Base de datos limpia.\n");
}

// ============================================================================
// MIGRACIÓN V4
// ============================================================================
async function migrate() {
    console.log("🚀 Iniciando script de migración V4 (Fixed UI Mappings)...");

    await cleanDatabase();

    const batchManager = new BatchManager(db);
    let wixPacientes = [];
    let wixEvolucion = [];

    try {
        const rawPacientes = fs.readFileSync(PACIENTES_FILE, 'utf8');
        const rawEvolucion = fs.readFileSync(EVOLUCION_FILE, 'utf8');
        wixPacientes = JSON.parse(rawPacientes);
        if (!Array.isArray(wixPacientes) && wixPacientes.results) wixPacientes = wixPacientes.results;

        wixEvolucion = JSON.parse(rawEvolucion);
        if (!Array.isArray(wixEvolucion) && wixEvolucion.results) wixEvolucion = wixEvolucion.results;

        console.log(`📄 Archivos cargados: ${wixPacientes.length} pacientes, ${wixEvolucion.length} evoluciones.`);
    } catch (e) {
        console.error("❌ Error leyendo archivos JSON:", e.message);
        process.exit(1);
    }

    console.log("\n--- Migrando perfiles de pacientes ---");
    let processedPatients = 0;

    for (const p of wixPacientes) {
        try {
            const patientId = p.ID;
            if (!patientId) {
                if (!p['Nombre:']) continue;
                continue;
            }

            const firstName = cleanString(p['Nombre:']);
            const lastName = cleanString(p['Apellidos']);
            const isOnlineUser = p.Member === 'Online';
            const registrationSource = isOnlineUser ? 'online' : 'manual';
            const motivesRaw = p.motivo;

            // PRIORIDAD: ID UNICO (M-XXXX) SOBRE ID SISTEMA (C-XXXX)
            // El usuario quiere ver M-83756
            const preferredId = cleanString(p.idunico) || cleanString(p.Idsistema);

            const patientData = {
                legacyIdSistema: preferredId, // Use preferred ID for display
                firstName: firstName,
                lastName: lastName,
                email: cleanString(p.email),
                phone: cleanString(p.Telefonomovil) || cleanString(p.Telefonomovilcontacto),
                birthDate: parseDate(p.Fechanacimiento),
                fullAddress: cleanString(p.direccion),
                gender: cleanString(p.Sexo),
                occupation: cleanString(p.Profesionocupacion),
                initialReason: Array.isArray(safeJsonParse(motivesRaw)) ? safeJsonParse(motivesRaw).join(', ') : cleanString(motivesRaw),
                createdAt: parseDate(p['Created Date']),
                updatedAt: parseDate(p['Updated Date']),
                registrationSource: registrationSource,
                registrationStatus: cleanString(p.Registrarcliente), // CORRECTED: Uppercase 'R' matches JSON
                isOnline: isOnlineUser,
                searchIndex: [firstName.toLowerCase(), lastName.toLowerCase()]
            };

            await batchManager.setWithId('patients', patientId, patientData);

            // PASO 2.B: HISTORIA INICIAL
            const initialHistoryId = randomUUID();

            const initialHistoryData = {
                patientId: patientId,
                date: parseDate(p['Created Date']),
                caseNumber: preferredId, // Consistent ID

                motives: arrayToBooleanMap(p.motivo),
                otherMotive: cleanString(p.motivootros),
                evolutionTime: cleanString(p.tiempo), // ADDED: Missing field
                historyOfPresentIllness: cleanString(p.Historiaenfermedad),

                // Antecedentes
                preExistingDiseases: buildAntecedent(p.Enfermedadespre, p.enfermedadespre1),
                neurological: buildAntecedent(p.neurologicas, p.neurologicas1, p.neurologicasotros),
                metabolic: buildAntecedent(p.metabolicas, p.metabolicas1, p.metabolicasotros),
                dermatological: buildAntecedent(p.dermatologicas, p.dermatologicas1, p.dermatologicasotros),
                respiratory: buildAntecedent(p.respiratoria, p.respiratoria1, p.respiratoria2, p.respiratoriaotros),
                cardiac: buildAntecedent(p.cardiacas, p.cardiacas1, p.cardiacas2, p.cardiacasotros),
                gastro: buildAntecedent(p.gastrointestinales, p.gastrointestinales1, p.gastrointestinales2, p.gastrointestinalesotros),
                hepato: buildAntecedent(p.hepatobiliopancreatica, p.hepatobiliopancreatica1, p.hepatobiliopancreatica2, p.hepatobiliopancreaticaotros),
                renal: buildAntecedent(p.reno, p.reno1, p.reno2, p.renootros),
                peripheral: buildAntecedent(p.arterias, p.arterias1, p.arterias2, p.arteriasotros),
                hematological: buildAntecedent(p.hematologico, p.hematologico1, p.hematologico2, p.hematologicootros),
                rheumatological: buildAntecedent(p.reumatologicas, p.reumatologicas1, p.reumatologicas2, p.reumatologicasotros),
                infectious: buildAntecedent(p.infecciosas, p.infecciosas1, p.infecciosas2, p.infecciosasotros),
                psychiatric: buildAntecedent(p.psiquiatricas, p.psiquiatricas1, p.psiquiatricas2, p.psiquiatricasotros),
                gyneco: buildAntecedent(p.gineco, p.gineco1, p.gineco2, p.ginecootros),

                regularMeds: buildAntecedent(p.medicamentousoregularo, p.medicamentousoregular1, p.medicamentousoregular2, p.medicamentousoregularotros),
                naturalMeds: buildAntecedent(p.medicinanaturalo, p.medicinanatural1),

                surgicalHistory: buildAntecedent(p.hospipreviaso, p.hospiprevias1),
                surgeries: buildAntecedent(p.cirugine, p.cirugine1) && buildAntecedent(p.hospipreviaso, p.hospiprevias1),
                endoscopy: buildAntecedent(p.proceendoprevios, [p.proceendoprevios1, p.proceendoprevios2, p.proceendoprevios3].filter(Boolean).join(', ')),
                implants: buildAntecedent(p.implanteso, p.implantes1),

                allergies: buildAntecedent(p.alergiaso, p.alergias1, p.alergiasotros),

                familyHistory: cleanString(p.antecedentesheredofamiliares) ? { yes: true, list: cleanString(p.antecedentesheredofamiliares) } : buildAntecedent(p.antecedentemedicoso, p.antecedentemedicos1, p.antecedentemedicosotros),

                habits: buildAntecedent(p.habitoso, p.habitos1, p.habitosotros),
                transfusions: buildAntecedent(p.transfusion, p.reacciono),
                exposures: buildAntecedent(p.exposicioneso, p.exposiciones1, p.exposiciones2, p.exposicionesotros),

                physicalExam: {
                    fc: cleanString(p.fc),
                    fr: cleanString(p.fr),
                    temp: cleanString(p.t),
                    pa: cleanString(p.pa),
                    weight: cleanString(p.peso),
                    height: cleanString(p.talla),
                    imc: cleanString(p.imc) || cleanString(p.txtimc),

                    // MOVED SYSTEMS INSIDE physicalExam for correct UI mapping
                    systems: {
                        piel: formatSystemField(p.piel, p.piel1),
                        cabeza: formatSystemField(p.cabeza, p.cabeza1),
                        torax: formatSystemField(p.torax, p.torax1),
                        cardiaco: formatSystemField(p.cardiaco, p.cardiaco1),
                        pulmonar: formatSystemField(p.pulmonar, p.pulmonar1),
                        abdomen: formatSystemField(p.abdomen, p.abdomen1),
                        miembrosuper: formatSystemField(p.miembrosuper, p.miembrosuper1),
                        miembroinfe: formatSystemField(p.miembroinfe, p.miembroinfe1),
                        neuro: formatSystemField(p.neuro, p.neuro1),
                        genitales: formatSystemField(p.genitales, p.genitales1),
                        tacto: formatSystemField(p.tacto, p.tacto1),

                        cuello: formatSystemField(p.cuello, p.cuello1),
                        ojos: formatSystemField(p.ojos, p.ojos1),
                        oidos: formatSystemField(p.oidos, p.oidos1),
                        nariz: formatSystemField(p.nariz, p.nariz1),
                        boca: formatSystemField(p.boca, p.boca1),
                    }
                },

                // Plan / Tratamiento fields from Patient Profile
                treatment: {
                    food: cleanString(p.Alimentos),
                    meds: stringToArray(p.Medicamentos),
                    exams: stringToArray(p.Examenes),
                    norms: stringToArray(p.Normas)
                },

                diagnosticStudies: cleanString(p.Estudiosendocopicos) || cleanString(p.Estudiolabora1),

                notes: cleanString(p.Notas) || cleanString(p.Comentarios),
                diagnosis: cleanString(p.diagnostico) || cleanString(p.Diagnosticomotivoconsulta),
                createdAt: parseDate(p['Created Date'])
            };

            await batchManager.setWithId('initialHistories', initialHistoryId, initialHistoryData);
            processedPatients++;
            if (processedPatients % 10 === 0) process.stdout.write('.');

        } catch (err) {
            console.error(`\n❌ Error en paciente ${p.ID}:`, err);
        }
    }
    console.log(`\n✅ ${processedPatients} pacientes procesados.`);


    // PASO 3: EVOLUCIONES
    console.log("\n--- Migrando evoluciones ---");
    let processedConsults = 0;

    for (const c of wixEvolucion) {
        try {
            const patientIdRef = c.idpaciente;
            if (!patientIdRef) continue;

            const consultId = randomUUID();
            const motivesRawList = [c.motivo, c.motivo1, c.motivo2, c.motivo3, c.motivo4].filter(Boolean);
            let allMotives = [];
            motivesRawList.forEach(m => {
                const parsed = safeJsonParse(m);
                if (Array.isArray(parsed)) allMotives = [...allMotives, ...parsed];
                else if (typeof parsed === 'string') allMotives.push(parsed);
            });
            const motivesMap = {};
            allMotives.forEach(m => { if (m) motivesMap[m] = true; });

            const consultData = {
                patientId: patientIdRef,
                date: parseDate(c['Created Date']),
                reason: cleanString(c.Historiaenfermedad) || allMotives.join(', '),
                motives: motivesMap,
                evolutionNotes: cleanString(c.Historiaenfermedad) || cleanString(c.Comentarios),
                vitalSigns: {
                    bloodPressure: cleanString(c.pa),
                    heartRate: cleanString(c.fc),
                    temperature: cleanString(c.t),
                    weight: cleanString(c.peso),
                    height: cleanString(c.talla)
                },
                diagnosis: cleanString(c.diagnostico),
                diagnoses: stringToArray(c.diagnostico),
                treatment: {
                    medications: stringToArray(c.medicamentos),
                    exams: stringToArray(c.examenes),
                    instructions: cleanString(c.instrucciones)
                },
                createdAt: parseDate(c['Created Date'])
            };

            await batchManager.setWithId('subsequentConsults', consultId, consultData);
            processedConsults++;
            if (processedConsults % 20 === 0) process.stdout.write('.');

        } catch (err) {
            console.error(`\n❌ Error en evolución ${c.ID}:`, err);
        }
    }

    await batchManager.commit();

    console.timeEnd("Migración Completa");
    console.log(`\n✨ EXCELENTE. Migración Completada.`);
    console.log(`- Pacientes Migrados: ${processedPatients}`);
    console.log(`- Consultas Migradas: ${processedConsults}`);
    process.exit(0);
}

migrate().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
