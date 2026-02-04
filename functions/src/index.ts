import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params"; // Removed defineSecret
import * as admin from "firebase-admin";
// import * as nodemailer from "nodemailer"; // Keep generic imports

// Initialize Firebase Admin
admin.initializeApp();

// Export Admin functions (roles, tokens, audit logs)
export {
    assignUserRole,
    revokeRole,
    renewToken,
    forceLogout,
    checkTokenExpiration,
    getAuditLogs,
    getAuditStats,
    listUsers,
    toggleUserStatus,
} from "./admin";

// Export Backup functions
export {
    scheduledBackup,
    triggerManualBackup,
    getBackupHistory,
    restoreFromBackup
} from "./backup";

// Re-export audit log utilities for use in other functions
export { createAuditLog, logPaymentEvent, logMedicalRecordDeletion } from "./auditLogs";

// Export client audit logging function
export { logAuditFromClient } from "./auditClient";

// Export IP access control function
export { checkSystemAccess } from "./accessControl";

export { setUserRole, getUserRole, isAdmin, isPrivileged, isTokenExpired, ASSIGNABLE_ROLES, ROLE_NAMES } from "./roles";

// Environment variables
export const baseUrl = defineString("BASE_URL", { default: "https://historia-clinica-2026.web.app" });

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
export const createPaymentIntent = onCall(async () => {
    throw new HttpsError(
        "unimplemented",
        "Los pagos están deshabilitados temporalmente en esta versión."
    );
});

// ============================================================
// SCHEDULED FUNCTION: APPOINTMENT REMINDERS
// ============================================================

export const sendAppointmentReminders = onSchedule(
    {
        schedule: "0 8 * * *",  // Every day at 8:00 AM
        timeZone: "America/Managua",  // Nicaragua timezone (CST/UTC-6)
        region: "us-central1",
    },
    async (event) => {
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

        } catch (error: any) {
            console.error("❌ Critical error in appointment reminder job:", error);
        }
    }
);

// ============================================================
// AI ANALYSIS FUNCTION
// ============================================================

export const generateAIAnalysis = onCall(
    async (request) => {
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "Debes iniciar sesión para realizar el análisis."
            );
        }
        return {
            summary: "El paciente presenta un cuadro metabólico estable (Simulado).",
            risks: ["Riesgo moderado de hipertensión arterial.", "Posible predisposición a diabetes tipo 2."],
            recommendations: ["Iniciar programa de actividad física.", "Reducción de consumo de sodio."]
        };
    }
);

// ============================================================
// DASHBOARD ANALYTICS FUNCTION
// ============================================================

export const getDashboardAdvancedStats = onCall(
    async (request) => {
        if (!request.auth) {
            throw new HttpsError(
                "unauthenticated",
                "Debes iniciar sesión para ver estadísticas."
            );
        }

        const db = admin.firestore();
        try {
            const historySnapshot = await db.collection("medicalHistory").limit(300).get(); // Limit for safety

            // Basic mock logic or simplified logic for stats
            let normal = 0, overweight = 0, obese = 0;
            const riskPatients: any[] = [];

            historySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const imc = parseFloat(data.physicalExam?.imc || "0");
                if (imc > 0) {
                    if (imc < 25) normal++;
                    else if (imc < 30) overweight++;
                    else obese++;
                }
            });

            return {
                obesityPrevalence: { normal, overweight, obese },
                topDiagnoses: [{ name: "Gastritis", count: 12 }, { name: "Reflujo", count: 8 }],
                riskPatients: riskPatients
            };

        } catch (error: any) {
            console.error("Error generating dashboard stats:", error);
            throw new HttpsError("internal", "Error calculando estadísticas");
        }
    }
);

// ============================================================
// PUBLIC: CHECK EMAIL AVAILABILITY
// ============================================================

export const checkEmailAvailability = onCall(
    async (request) => {
        const { email } = request.data;
        if (!email) throw new HttpsError("invalid-argument", "El email es requerido.");

        try {
            const patientsSnapshot = await admin.firestore()
                .collection("patients")
                .where("email", "==", email)
                .limit(1)
                .get();

            return { exists: !patientsSnapshot.empty };
        } catch (error: any) {
            console.error("Error checking email availability:", error);
            throw new HttpsError("internal", "Error verificando disponibilidad del email.");
        }
    }
);

// ============================================================
// ENDOSCOPIC CONTROL REMINDERS
// ============================================================

/**
 * Store scheduled endoscopic reminders
 */
export const scheduleEndoscopicReminders = onCall(
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");

        const { patientId, patientName, patientEmail, controlDate, reminders } = request.data;

        if (!patientId || !controlDate || !reminders) {
            throw new HttpsError("invalid-argument", "Faltan datos requeridos.");
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
        } catch (error: any) {
            console.error("Error scheduling reminders:", error);
            throw new HttpsError("internal", "Error programando recordatorios.");
        }
    }
);
