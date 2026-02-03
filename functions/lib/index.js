"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEndoscopicReminders = exports.scheduleEndoscopicReminders = exports.checkEmailAvailability = exports.getDashboardAdvancedStats = exports.generateAIAnalysis = exports.sendAppointmentReminders = exports.tilopayWebhook = exports.stripeWebhook = exports.initiatePayment = exports.createPaymentIntent = exports.baseUrl = exports.ROLE_NAMES = exports.ASSIGNABLE_ROLES = exports.isTokenExpired = exports.isPrivileged = exports.isAdmin = exports.getUserRole = exports.setUserRole = exports.logAuditFromClient = exports.logMedicalRecordDeletion = exports.logPaymentEvent = exports.createAuditLog = exports.restoreFromBackup = exports.getBackupHistory = exports.triggerManualBackup = exports.scheduledBackup = exports.toggleUserStatus = exports.listUsers = exports.getAuditStats = exports.getAuditLogs = exports.checkTokenExpiration = exports.forceLogout = exports.renewToken = exports.revokeRole = exports.assignUserRole = exports.processTiloPayPayment = exports.powertranzCallback = exports.verifyPowerTranzPayment = exports.processPowerTranzPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
const nodemailer = require("nodemailer");
// Initialize Firebase Admin
admin.initializeApp();
// Export PowerTranz payment functions
var powertranz_1 = require("./powertranz");
Object.defineProperty(exports, "processPowerTranzPayment", { enumerable: true, get: function () { return powertranz_1.processPowerTranzPayment; } });
Object.defineProperty(exports, "verifyPowerTranzPayment", { enumerable: true, get: function () { return powertranz_1.verifyPowerTranzPayment; } });
Object.defineProperty(exports, "powertranzCallback", { enumerable: true, get: function () { return powertranz_1.powertranzCallback; } });
var tilopay_1 = require("./tilopay");
Object.defineProperty(exports, "processTiloPayPayment", { enumerable: true, get: function () { return tilopay_1.processTiloPayPayment; } });
// Export Admin functions (roles, tokens, audit logs)
var admin_1 = require("./admin");
Object.defineProperty(exports, "assignUserRole", { enumerable: true, get: function () { return admin_1.assignUserRole; } });
Object.defineProperty(exports, "revokeRole", { enumerable: true, get: function () { return admin_1.revokeRole; } });
Object.defineProperty(exports, "renewToken", { enumerable: true, get: function () { return admin_1.renewToken; } });
Object.defineProperty(exports, "forceLogout", { enumerable: true, get: function () { return admin_1.forceLogout; } });
Object.defineProperty(exports, "checkTokenExpiration", { enumerable: true, get: function () { return admin_1.checkTokenExpiration; } });
Object.defineProperty(exports, "getAuditLogs", { enumerable: true, get: function () { return admin_1.getAuditLogs; } });
Object.defineProperty(exports, "getAuditStats", { enumerable: true, get: function () { return admin_1.getAuditStats; } });
Object.defineProperty(exports, "listUsers", { enumerable: true, get: function () { return admin_1.listUsers; } });
Object.defineProperty(exports, "toggleUserStatus", { enumerable: true, get: function () { return admin_1.toggleUserStatus; } });
// Export Backup functions
var backup_1 = require("./backup");
Object.defineProperty(exports, "scheduledBackup", { enumerable: true, get: function () { return backup_1.scheduledBackup; } });
Object.defineProperty(exports, "triggerManualBackup", { enumerable: true, get: function () { return backup_1.triggerManualBackup; } });
Object.defineProperty(exports, "getBackupHistory", { enumerable: true, get: function () { return backup_1.getBackupHistory; } });
Object.defineProperty(exports, "restoreFromBackup", { enumerable: true, get: function () { return backup_1.restoreFromBackup; } });
// Re-export audit log utilities for use in other functions
var auditLogs_1 = require("./auditLogs");
Object.defineProperty(exports, "createAuditLog", { enumerable: true, get: function () { return auditLogs_1.createAuditLog; } });
Object.defineProperty(exports, "logPaymentEvent", { enumerable: true, get: function () { return auditLogs_1.logPaymentEvent; } });
Object.defineProperty(exports, "logMedicalRecordDeletion", { enumerable: true, get: function () { return auditLogs_1.logMedicalRecordDeletion; } });
// Export client audit logging function
var auditClient_1 = require("./auditClient");
Object.defineProperty(exports, "logAuditFromClient", { enumerable: true, get: function () { return auditClient_1.logAuditFromClient; } });
var roles_1 = require("./roles");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return roles_1.setUserRole; } });
Object.defineProperty(exports, "getUserRole", { enumerable: true, get: function () { return roles_1.getUserRole; } });
Object.defineProperty(exports, "isAdmin", { enumerable: true, get: function () { return roles_1.isAdmin; } });
Object.defineProperty(exports, "isPrivileged", { enumerable: true, get: function () { return roles_1.isPrivileged; } });
Object.defineProperty(exports, "isTokenExpired", { enumerable: true, get: function () { return roles_1.isTokenExpired; } });
Object.defineProperty(exports, "ASSIGNABLE_ROLES", { enumerable: true, get: function () { return roles_1.ASSIGNABLE_ROLES; } });
Object.defineProperty(exports, "ROLE_NAMES", { enumerable: true, get: function () { return roles_1.ROLE_NAMES; } });
// Define secrets for different payment gateways
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
const tilopayApiKey = (0, params_1.defineSecret)("TILOPAY_API_KEY");
const tilopayApiUser = (0, params_1.defineSecret)("TILOPAY_API_USER");
const tilopayApiPassword = (0, params_1.defineSecret)("TILOPAY_API_PASSWORD");
const powertranzId = (0, params_1.defineSecret)("POWERTRANZ_ID");
const powertranzPassword = (0, params_1.defineSecret)("POWERTRANZ_PASSWORD");
// Environment variables - exported for use in payment callbacks
exports.baseUrl = (0, params_1.defineString)("BASE_URL", { default: "https://historia-clinica-2026.web.app" });
/**
 * Create Payment Intent - Universal function for multiple gateways
 * Called from the frontend using Firebase SDK httpsCallable
 */
exports.createPaymentIntent = (0, https_1.onCall)({
    secrets: [stripeSecretKey, tilopayApiKey, tilopayApiUser, tilopayApiPassword, powertranzId, powertranzPassword]
}, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para realizar un pago.");
    }
    const data = request.data;
    const { amount, currency = "USD", gateway, appointmentId, patientId, description, customerEmail, customerName } = data;
    // Validate required fields
    if (!amount || amount <= 0) {
        throw new https_1.HttpsError("invalid-argument", "El monto debe ser mayor a 0.");
    }
    if (!gateway) {
        throw new https_1.HttpsError("invalid-argument", "Debe especificar una pasarela de pago (stripe, tilopay, powertranz).");
    }
    try {
        switch (gateway) {
            case "stripe":
                return await processStripePayment({
                    amount,
                    currency,
                    appointmentId,
                    patientId,
                    userId: request.auth.uid,
                    description,
                    customerEmail,
                });
            case "tilopay":
                // Use local helper with new credentials
                return await processTiloPayPaymentLocal({
                    amount,
                    currency,
                    appointmentId,
                    patientId,
                    userId: request.auth.uid,
                    description,
                    customerEmail,
                    customerName,
                });
            case "powertranz":
                // Use local helper with new credentials
                return await processPowerTranzPaymentLocal({
                    amount,
                    currency,
                    appointmentId,
                    patientId,
                    userId: request.auth.uid,
                    description,
                });
            default:
                throw new https_1.HttpsError("invalid-argument", "Gateway no soportado. Use 'stripe', 'tilopay' o 'powertranz'.");
        }
    }
    catch (error) {
        console.error("Payment error:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", `Error procesando pago: ${error.message}`);
    }
});
// ============================================================
// STRIPE PAYMENT PROCESSOR
// ============================================================
async function processStripePayment(params) {
    const stripe = new stripe_1.default(stripeSecretKey.value(), {
        apiVersion: "2023-10-16",
    });
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        metadata: {
            appointmentId: params.appointmentId || "",
            patientId: params.patientId || "",
            userId: params.userId,
        },
        description: params.description || "Consulta Médica",
        receipt_email: params.customerEmail,
    });
    return {
        success: true,
        gateway: "stripe",
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        message: "PaymentIntent creado exitosamente",
    };
}
// ============================================================
// TILOPAY PAYMENT PROCESSOR (Local Helper for Legacy Support)
// ============================================================
async function processTiloPayPaymentLocal(params) {
    const apiKey = tilopayApiKey.value();
    const apiUser = tilopayApiUser.value();
    const apiPassword = tilopayApiPassword.value();
    if (!apiKey || !apiUser || !apiPassword) {
        throw new https_1.HttpsError("failed-precondition", "Credenciales TiloPay no configuradas");
    }
    // TiloPay S2S Endpoint (Legacy usage via generic endpoint)
    // Note: Ideally effectively replaced by direct S2S function
    // const tilopayEndpoint = "https://api.tilopay.com/v1/process";
    // ... (Simplified logic or redirect to new implementation)
    // For now returning mock to avoid breaking build, assuming frontend uses new functions
    return {
        success: false,
        gateway: "tilopay",
        message: "Por favor use la nueva integración directa (PaymentModal actualizado)",
    };
}
// ============================================================
// POWERTRANZ PAYMENT PROCESSOR (Local Helper for Legacy Support)
// ============================================================
async function processPowerTranzPaymentLocal(params) {
    const merchantId = powertranzId.value();
    const password = powertranzPassword.value();
    if (!merchantId || !password) {
        throw new https_1.HttpsError("failed-precondition", "Credenciales PowerTranz no configuradas");
    }
    return {
        success: false,
        gateway: "powertranz",
        message: "Por favor use la nueva integración directa (PaymentModal actualizado)",
    };
}
// Helper function to get ISO currency codes
// function getCurrencyCode(currency: string): string {
//     const codes: { [key: string]: string } = {
//         "USD": "840",
//         "NIO": "558",
//         "CRC": "188",
//         "GTQ": "320",
//         "HNL": "340",
//     };
//     return codes[currency.toUpperCase()] || "840";
// }
// ============================================================
// LEGACY: Initiate Payment (backwards compatibility)
// ============================================================
exports.initiatePayment = (0, https_1.onCall)({ secrets: [stripeSecretKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para realizar un pago.");
    }
    const { appointmentId, patientId, amount } = request.data;
    if (!appointmentId || !amount) {
        throw new https_1.HttpsError("invalid-argument", "appointmentId y amount son requeridos.");
    }
    // Redirect to new createPaymentIntent
    return await processStripePayment({
        amount,
        currency: "USD",
        appointmentId,
        patientId,
        userId: request.auth.uid,
    });
});
// ============================================================
// STRIPE WEBHOOK - CON IDEMPOTENCIA
// ============================================================
exports.stripeWebhook = (0, https_2.onRequest)({ secrets: [stripeSecretKey] }, async (req, res) => {
    var _a;
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing signature");
        return;
    }
    let event;
    try {
        event = req.body;
    }
    catch (err) {
        console.error("Webhook error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    switch (event.type) {
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            const { appointmentId } = paymentIntent.metadata;
            if (appointmentId) {
                // IDEMPOTENCIA: Verificar si ya está pagado antes de actualizar
                const appointmentRef = admin.firestore().collection("appointments").doc(appointmentId);
                const appointmentDoc = await appointmentRef.get();
                if (appointmentDoc.exists && ((_a = appointmentDoc.data()) === null || _a === void 0 ? void 0 : _a.paymentStatus) === "paid") {
                    console.log(`Stripe: Payment already processed for appointment ${appointmentId}, skipping update`);
                    // Retornar éxito inmediatamente para evitar reintentos
                    res.json({ received: true, skipped: true });
                    return;
                }
                await appointmentRef.update({
                    paid: true,
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    paymentIntentId: paymentIntent.id,
                    paymentStatus: "paid",
                    paymentGateway: "stripe",
                });
            }
            break;
        case "payment_intent.payment_failed":
            console.log("Payment failed:", event.data.object);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
});
// ============================================================
// TILOPAY WEBHOOK - CON IDEMPOTENCIA
// ============================================================
exports.tilopayWebhook = (0, https_2.onRequest)(async (req, res) => {
    var _a;
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    try {
        const { transactionId, status, orderNumber, metadata } = req.body;
        console.log("TiloPay webhook received:", { transactionId, status, orderNumber });
        if (status === "approved" && (metadata === null || metadata === void 0 ? void 0 : metadata.appointmentId)) {
            // IDEMPOTENCIA: Verificar si ya está pagado antes de actualizar
            const appointmentRef = admin.firestore().collection("appointments").doc(metadata.appointmentId);
            const appointmentDoc = await appointmentRef.get();
            if (appointmentDoc.exists && ((_a = appointmentDoc.data()) === null || _a === void 0 ? void 0 : _a.paymentStatus) === "paid") {
                console.log(`TiloPay: Payment already processed for appointment ${metadata.appointmentId}, skipping update`);
                // Retornar éxito inmediatamente para evitar reintentos
                res.json({ received: true, skipped: true });
                return;
            }
            await appointmentRef.update({
                paid: true,
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                paymentTransactionId: transactionId,
                paymentStatus: "paid",
                paymentGateway: "tilopay",
            });
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error("TiloPay webhook error:", error);
        res.status(500).json({ error: error.message });
    }
});
// ============================================================
// SCHEDULED FUNCTION: APPOINTMENT REMINDERS
// ============================================================
/**
 * sendAppointmentReminders
 *
 * Se ejecuta todos los días a las 8:00 AM (hora de Nicaragua/Costa Rica - CST)
 * Busca citas programadas para el día siguiente y envía recordatorios por email
 *
 * Cron Expression: "0 8 * * *" = Every day at 8:00 AM
 */
exports.sendAppointmentReminders = (0, scheduler_1.onSchedule)({
    schedule: "0 8 * * *", // Every day at 8:00 AM
    timeZone: "America/Managua", // Nicaragua timezone (CST/UTC-6)
    region: "us-central1",
}, async (event) => {
    console.log("🔔 Starting daily appointment reminder job...");
    console.log(`Triggered at: ${new Date().toISOString()}`);
    try {
        // Calculate tomorrow's date range
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(now.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);
        // Format dates for comparison with stored date strings (YYYY-MM-DD)
        const tomorrowDateStr = tomorrowStart.toISOString().split("T")[0];
        console.log(`📅 Looking for appointments on: ${tomorrowDateStr}`);
        // Query appointments for tomorrow
        const appointmentsSnapshot = await admin.firestore()
            .collection("appointments")
            .where("date", "==", tomorrowDateStr)
            .get();
        if (appointmentsSnapshot.empty) {
            console.log("✅ No appointments found for tomorrow. Job complete.");
            return;
        }
        console.log(`📋 Found ${appointmentsSnapshot.size} appointment(s) for tomorrow`);
        // Process each appointment
        const reminderPromises = appointmentsSnapshot.docs.map(async (doc) => {
            const appointment = doc.data();
            const appointmentId = doc.id;
            try {
                // Get patient information
                const patientDoc = await admin.firestore()
                    .collection("patients")
                    .doc(appointment.patientId)
                    .get();
                if (!patientDoc.exists) {
                    console.warn(`⚠️ Patient not found for appointment ${appointmentId}`);
                    return { success: false, appointmentId, reason: "Patient not found" };
                }
                const patient = patientDoc.data();
                const patientEmail = patient === null || patient === void 0 ? void 0 : patient.email;
                const patientName = `${(patient === null || patient === void 0 ? void 0 : patient.firstName) || ""} ${(patient === null || patient === void 0 ? void 0 : patient.lastName) || ""}`.trim();
                // Log reminder details (simulating email send for now)
                console.log(`📧 [SIMULATED EMAIL] Sending reminder to:`);
                console.log(`   - Patient: ${patientName}`);
                console.log(`   - Email: ${patientEmail || "No email registered"}`);
                console.log(`   - Appointment ID: ${appointmentId}`);
                console.log(`   - Date: ${appointment.date}`);
                console.log(`   - Time: ${appointment.time}`);
                console.log(`   - Type: ${appointment.type || "presencial"}`);
                console.log(`   - Reason: ${appointment.reason || "Not specified"}`);
                // TODO: Implement actual email sending with Nodemailer or SendGrid
                // Example email content:
                const emailSubject = `Recordatorio: Cita médica mañana a las ${appointment.time}`;
                const emailBody = `
                        Hola ${patientName},

                        Le recordamos que tiene una cita médica programada para mañana:

                        📅 Fecha: ${new Date(appointment.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                })}
                        ⏰ Hora: ${appointment.time}
                        📍 Tipo: ${appointment.type === "virtual" ? "Consulta Virtual (Video Llamada)" : "Consulta Presencial"}
                        ${appointment.reason ? `📋 Motivo: ${appointment.reason}` : ""}

                        ${appointment.type === "virtual"
                    ? "Ingrese a su portal de paciente para unirse a la video consulta."
                    : "Por favor llegue 10 minutos antes de su cita."}

                        Si necesita cancelar o reprogramar, contáctenos con anticipación.

                        Saludos,
                        Centro de Gastroenterología
                    `;
                console.log(`   - Subject: ${emailSubject}`);
                console.log(`   - Body Preview: ${emailBody.slice(0, 100)}...`);
                // Track reminder sent in Firestore (optional)
                await admin.firestore()
                    .collection("appointments")
                    .doc(appointmentId)
                    .update({
                    reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                    reminderStatus: "sent",
                });
                return { success: true, appointmentId, patientName };
            }
            catch (err) {
                console.error(`❌ Error processing reminder for ${appointmentId}:`, err);
                return { success: false, appointmentId, reason: err.message };
            }
        });
        // Wait for all reminders to be processed
        const results = await Promise.all(reminderPromises);
        // Summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log(`\n📊 Reminder Job Summary:`);
        console.log(`   ✅ Successful: ${successful}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📧 Total processed: ${results.length}`);
        console.log(`🏁 Daily appointment reminder job completed.`);
    }
    catch (error) {
        console.error("❌ Critical error in appointment reminder job:", error);
        throw error; // Rethrow to mark the function execution as failed
    }
});
// ============================================================
// AI ANALYSIS FUNCTION
// ============================================================
exports.generateAIAnalysis = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para realizar el análisis.");
    }
    const { patientId } = request.data;
    if (!patientId) {
        throw new https_1.HttpsError("invalid-argument", "El patientId es requerido.");
    }
    // TODO: Retrieve patient data (clinical history, consultations)
    // const history = await admin.firestore().collection('medicalHistory').where('patientId', '==', patientId).limit(1).get();
    // SIMULATION: Returning mock data structure for now
    // This simulates a response from Gemini
    return {
        summary: "El paciente presenta un cuadro metabólico estable, aunque con indicadores de riesgo cardiovascular moderado debido a los antecedentes familiares y el IMC actual.",
        risks: [
            "Riesgo moderado de hipertensión arterial.",
            "Posible predisposición a diabetes tipo 2.",
            "Sobrepeso (IMC elevado)."
        ],
        recommendations: [
            "Iniciar programa de actividad física moderada (caminata 30 min/día).",
            "Reducción de consumo de sodio y carbohidratos refinados.",
            "Monitoreo de presión arterial cada 2 semanas."
        ]
    };
});
// ============================================================
// DASHBOARD ANALYTICS FUNCTION
// ============================================================
exports.getDashboardAdvancedStats = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para ver estadísticas.");
    }
    const db = admin.firestore();
    try {
        // 1. Fetch Medical Histories for Obesity and Risks
        // We fetch the latest history for each patient (simplification: fetching all 'medicalHistory' docs might be heavy in prod, 
        // but for this scope we assume a manageable dataset or we'd rely on a scheduled aggregation)
        const historySnapshot = await db.collection("medicalHistory").get();
        // 2. Fetch Consultations for Top Diagnoses (Current Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const consultationsSnapshot = await db.collection("consultations")
            .where("date", ">=", startOfMonth)
            .where("date", "<=", endOfMonth)
            .get();
        // --- Calculation: Obesity Prevalence ---
        let normal = 0;
        let overweight = 0;
        let obese = 0;
        // --- Calculation: Risk Patients ---
        const riskPatients = [];
        historySnapshot.docs.forEach(doc => {
            var _a, _b, _c, _d, _e;
            const data = doc.data();
            // IMC Check
            const imc = parseFloat(((_a = data.physicalExam) === null || _a === void 0 ? void 0 : _a.imc) || "0");
            if (imc > 0) {
                if (imc < 25)
                    normal++;
                else if (imc < 30)
                    overweight++;
                else
                    obese++;
            }
            // Risk Flags Check
            const risks = [];
            if ((_b = data.metabolic) === null || _b === void 0 ? void 0 : _b.yes)
                risks.push("Metabólico");
            if ((_c = data.cardiac) === null || _c === void 0 ? void 0 : _c.yes)
                risks.push("Cardíaco");
            if ((_d = data.respiratory) === null || _d === void 0 ? void 0 : _d.yes)
                risks.push("Respiratorio");
            if ((_e = data.preExistingDiseases) === null || _e === void 0 ? void 0 : _e.yes)
                risks.push("Preexistentes");
            if (risks.length > 0) {
                riskPatients.push({
                    id: data.patientId,
                    risks: risks
                });
            }
        });
        // --- Calculation: Top Diagnoses ---
        const diagnosisCounts = {};
        consultationsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const diagnoses = data.diagnoses || []; // Array of strings
            if (Array.isArray(diagnoses)) {
                diagnoses.forEach((dx) => {
                    if (dx) {
                        const normalizedDx = dx.trim();
                        diagnosisCounts[normalizedDx] = (diagnosisCounts[normalizedDx] || 0) + 1;
                    }
                });
            }
        });
        // Sort and take top 5
        const topDiagnoses = Object.entries(diagnosisCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            obesityPrevalence: {
                normal,
                overweight,
                obese
            },
            topDiagnoses,
            riskPatients
        };
    }
    catch (error) {
        console.error("Error generating dashboard stats:", error);
        throw new https_1.HttpsError("internal", "Error calculando estadísticas del dashboard: " + error.message);
    }
});
// ============================================================
// PUBLIC: CHECK EMAIL AVAILABILITY
// ============================================================
exports.checkEmailAvailability = (0, https_1.onCall)(async (request) => {
    // No auth check needed as this is for pre-registration
    const { email } = request.data;
    if (!email) {
        throw new https_1.HttpsError("invalid-argument", "El email es requerido.");
    }
    try {
        const patientsSnapshot = await admin.firestore()
            .collection("patients")
            .where("email", "==", email)
            .limit(1)
            .get();
        return {
            exists: !patientsSnapshot.empty
        };
    }
    catch (error) {
        console.error("Error checking email availability:", error);
        throw new https_1.HttpsError("internal", "Error verificando disponibilidad del email.");
    }
});
// ============================================================
// ENDOSCOPIC CONTROL REMINDERS
// ============================================================
/**
 * Store scheduled endoscopic reminders
 * Called when doctor creates a new endoscopic control
 */
exports.scheduleEndoscopicReminders = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Debe iniciar sesión para programar recordatorios.");
    }
    const { patientId, patientName, patientEmail, controlDate, notes, reminders } = request.data;
    if (!patientId || !patientEmail || !controlDate || !reminders) {
        throw new https_1.HttpsError("invalid-argument", "Faltan datos requeridos para programar recordatorios.");
    }
    try {
        // Store reminders in a scheduled_reminders collection for the daily job
        const batch = admin.firestore().batch();
        for (const reminder of reminders) {
            const reminderRef = admin.firestore().collection("scheduled_reminders").doc();
            batch.set(reminderRef, {
                type: "endoscopic_control",
                patientId,
                patientName,
                patientEmail,
                controlDate,
                notes: notes || "",
                scheduledDate: reminder.date,
                reminderType: reminder.type,
                sent: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: request.auth.uid
            });
        }
        await batch.commit();
        console.log(`Scheduled ${reminders.length} reminders for patient ${patientId}`);
        return {
            success: true,
            remindersScheduled: reminders.length
        };
    }
    catch (error) {
        console.error("Error scheduling reminders:", error);
        throw new https_1.HttpsError("internal", "Error al programar recordatorios.");
    }
});
/**
 * Daily scheduled function to send pending email reminders
 * Runs every day at 8:00 AM
 */
// Initialize Nodemailer Transporter
// Note: Ideally use OAuth2 or a transactional email service (SendGrid, Mailgun) for production
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Ensure this env var is set in Firebase functions config
    }
});
exports.sendEndoscopicReminders = (0, scheduler_1.onSchedule)({
    schedule: "0 8 * * *", // Every day at 8:00 AM
    timeZone: "America/Managua"
}, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    try {
        // Find all unsent reminders scheduled for today
        const remindersSnapshot = await admin.firestore()
            .collection("scheduled_reminders")
            .where("sent", "==", false)
            .where("scheduledDate", ">=", today.toISOString())
            .where("scheduledDate", "<=", todayEnd.toISOString())
            .get();
        console.log(`Found ${remindersSnapshot.size} reminders to send`);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            try {
                // Send email using nodemailer
                const controlDateFormatted = new Date(reminder.controlDate).toLocaleDateString("es-NI", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
                const daysUntil = Math.ceil((new Date(reminder.controlDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0;">🔔 Recordatorio de Control Endoscópico</h1>
                            </div>
                            <div style="background: #f0fdfa; padding: 30px; border: 2px solid #99f6e4; border-radius: 0 0 15px 15px;">
                                <p style="font-size: 18px; color: #0f766e;">Estimado(a) <strong>${reminder.patientName}</strong>,</p>
                                <p style="font-size: 16px; color: #333;">Le recordamos que tiene programado un <strong>Control Endoscópico</strong> para:</p>
                                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 2px solid #14b8a6;">
                                    <p style="font-size: 24px; font-weight: bold; color: #0d9488; margin: 0;">${controlDateFormatted}</p>
                                    <p style="color: #666; margin-top: 10px;">(en ${daysUntil} días)</p>
                                </div>
                                ${reminder.notes ? `
                                <div style="background: #fff7ed; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f97316;">
                                    <p style="margin: 0; font-weight: bold; color: #c2410c;">📝 Notas del Doctor:</p>
                                    <p style="margin: 10px 0 0 0; color: #333;">${reminder.notes}</p>
                                </div>
                                ` : ""}
                                <p style="font-size: 14px; color: #666;">Por favor contacte a la clínica si necesita reprogramar o tiene alguna consulta.</p>
                                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                                <p style="font-size: 12px; color: #999; text-align: center;">Este es un mensaje automático. Por favor no responda a este correo.</p>
                            </div>
                        </div>
                    `;
                await transporter.sendMail({
                    from: `"Sistema de Historia Clínica" <${process.env.EMAIL_USER || "noreply@historiaclinica.com"}>`,
                    to: reminder.patientEmail,
                    subject: `🔔 Recordatorio: Control Endoscópico en ${daysUntil} días`,
                    html: emailHtml
                });
                // Mark as sent
                await doc.ref.update({
                    sent: true,
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Sent reminder to ${reminder.patientEmail}`);
            }
            catch (emailError) {
                console.error(`Error sending email to ${reminder.patientEmail}:`, emailError);
            }
        }
        console.log("Daily reminder job completed");
    }
    catch (error) {
        console.error("Error in sendEndoscopicReminders:", error);
    }
});
//# sourceMappingURL=index.js.map