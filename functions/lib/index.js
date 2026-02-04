"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleEndoscopicReminders = exports.checkEmailAvailability = exports.getDashboardAdvancedStats = exports.generateAIAnalysis = exports.sendAppointmentReminders = exports.createPaymentIntent = exports.baseUrl = exports.ROLE_NAMES = exports.ASSIGNABLE_ROLES = exports.isTokenExpired = exports.isPrivileged = exports.isAdmin = exports.getUserRole = exports.setUserRole = exports.checkSystemAccess = exports.logAuditFromClient = exports.logMedicalRecordDeletion = exports.logPaymentEvent = exports.createAuditLog = exports.restoreFromBackup = exports.getBackupHistory = exports.triggerManualBackup = exports.scheduledBackup = exports.toggleUserStatus = exports.listUsers = exports.getAuditStats = exports.getAuditLogs = exports.checkTokenExpiration = exports.forceLogout = exports.renewToken = exports.revokeRole = exports.assignUserRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params"); // Removed defineSecret
const admin = require("firebase-admin");
// import * as nodemailer from "nodemailer"; // Keep generic imports
// Initialize Firebase Admin
admin.initializeApp();
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
// Export IP access control function
var accessControl_1 = require("./accessControl");
Object.defineProperty(exports, "checkSystemAccess", { enumerable: true, get: function () { return accessControl_1.checkSystemAccess; } });
var roles_1 = require("./roles");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return roles_1.setUserRole; } });
Object.defineProperty(exports, "getUserRole", { enumerable: true, get: function () { return roles_1.getUserRole; } });
Object.defineProperty(exports, "isAdmin", { enumerable: true, get: function () { return roles_1.isAdmin; } });
Object.defineProperty(exports, "isPrivileged", { enumerable: true, get: function () { return roles_1.isPrivileged; } });
Object.defineProperty(exports, "isTokenExpired", { enumerable: true, get: function () { return roles_1.isTokenExpired; } });
Object.defineProperty(exports, "ASSIGNABLE_ROLES", { enumerable: true, get: function () { return roles_1.ASSIGNABLE_ROLES; } });
Object.defineProperty(exports, "ROLE_NAMES", { enumerable: true, get: function () { return roles_1.ROLE_NAMES; } });
// Environment variables
exports.baseUrl = (0, params_1.defineString)("BASE_URL", { default: "https://historia-clinica-2026.web.app" });
// ============================================================
// PAYMENT FUNCTIONS DISABLED FOR NOW
// ============================================================
/*
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const tilopayApiKey = defineSecret("TILOPAY_API_KEY");
const tilopayApiUser = defineSecret("TILOPAY_API_USER");
const tilopayApiPassword = defineSecret("TILOPAY_API_PASSWORD");
const powertranzId = defineSecret("POWERTRANZ_ID");
const powertranzPassword = defineSecret("POWERTRANZ_PASSWORD");

export const createPaymentIntent = ... (Disabled)
*/
// Mock payment function to prevent frontend errors if called
exports.createPaymentIntent = (0, https_1.onCall)(async () => {
    throw new https_1.HttpsError("unimplemented", "Los pagos están deshabilitados temporalmente en esta versión.");
});
// ============================================================
// SCHEDULED FUNCTION: APPOINTMENT REMINDERS
// ============================================================
exports.sendAppointmentReminders = (0, scheduler_1.onSchedule)({
    schedule: "0 8 * * *", // Every day at 8:00 AM
    timeZone: "America/Managua", // Nicaragua timezone (CST/UTC-6)
    region: "us-central1",
}, async (event) => {
    console.log("🔔 Starting daily appointment reminder job...");
    try {
        // Calculate tomorrow's date range
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(now.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
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
        // Logic to send emails (simulated for now)
        console.log("Simulating email listing...");
        appointmentsSnapshot.docs.forEach(doc => {
            console.log(` - Reminder for appointment ${doc.id}`);
        });
    }
    catch (error) {
        console.error("❌ Critical error in appointment reminder job:", error);
    }
});
// ============================================================
// AI ANALYSIS FUNCTION
// ============================================================
exports.generateAIAnalysis = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión para realizar el análisis.");
    }
    return {
        summary: "El paciente presenta un cuadro metabólico estable (Simulado).",
        risks: ["Riesgo moderado de hipertensión arterial.", "Posible predisposición a diabetes tipo 2."],
        recommendations: ["Iniciar programa de actividad física.", "Reducción de consumo de sodio."]
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
        const historySnapshot = await db.collection("medicalHistory").limit(300).get(); // Limit for safety
        // Basic mock logic or simplified logic for stats
        let normal = 0, overweight = 0, obese = 0;
        const riskPatients = [];
        historySnapshot.docs.forEach(doc => {
            var _a;
            const data = doc.data();
            const imc = parseFloat(((_a = data.physicalExam) === null || _a === void 0 ? void 0 : _a.imc) || "0");
            if (imc > 0) {
                if (imc < 25)
                    normal++;
                else if (imc < 30)
                    overweight++;
                else
                    obese++;
            }
        });
        return {
            obesityPrevalence: { normal, overweight, obese },
            topDiagnoses: [{ name: "Gastritis", count: 12 }, { name: "Reflujo", count: 8 }],
            riskPatients: riskPatients
        };
    }
    catch (error) {
        console.error("Error generating dashboard stats:", error);
        throw new https_1.HttpsError("internal", "Error calculando estadísticas");
    }
});
// ============================================================
// PUBLIC: CHECK EMAIL AVAILABILITY
// ============================================================
exports.checkEmailAvailability = (0, https_1.onCall)(async (request) => {
    const { email } = request.data;
    if (!email)
        throw new https_1.HttpsError("invalid-argument", "El email es requerido.");
    try {
        const patientsSnapshot = await admin.firestore()
            .collection("patients")
            .where("email", "==", email)
            .limit(1)
            .get();
        return { exists: !patientsSnapshot.empty };
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
 */
exports.scheduleEndoscopicReminders = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Debe iniciar sesión.");
    const { patientId, patientName, patientEmail, controlDate, reminders } = request.data;
    if (!patientId || !controlDate || !reminders) {
        throw new https_1.HttpsError("invalid-argument", "Faltan datos requeridos.");
    }
    try {
        const batch = admin.firestore().batch();
        for (const reminder of reminders) {
            const reminderRef = admin.firestore().collection("scheduled_reminders").doc();
            batch.set(reminderRef, {
                type: "endoscopic_control",
                patientId,
                patientName,
                patientEmail,
                controlDate,
                scheduledDate: reminder.date,
                status: "pending",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        await batch.commit();
        return { success: true, count: reminders.length };
    }
    catch (error) {
        console.error("Error scheduling reminders:", error);
        throw new https_1.HttpsError("internal", "Error programando recordatorios.");
    }
});
//# sourceMappingURL=index.js.map