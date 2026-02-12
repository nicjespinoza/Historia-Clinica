import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { createAuditLog, AuditAction } from "./auditLogs";

// Helper to extract relevant changes
function getChangeDetails(before: any, after: any) {
    const changes: Record<string, { from: any; to: any }> = {};
    if (!before || !after) return undefined;

    Object.keys(after).forEach(key => {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
            changes[key] = {
                from: before[key] || null,
                to: after[key]
            };
        }
    });

    return Object.keys(changes).length > 0 ? changes : undefined;
}

// ============================================================
// PATIENT TRIGGERS
// ============================================================

export const onPatientCreated = onDocumentCreated("patients/{patientId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const patientId = event.params.patientId;
    // Attempt to identify actor via context usually requires onCall, 
    // for triggers we might rely on 'createdBy' field if it exists, or label as 'SYSTEM' if unknown.
    // However, for security audits, we really want to know WHO.
    // Best practice: Ensure client writes 'createdBy' or 'lastModifiedBy' fields, 
    // OR look at the context auth if available (only in v1 usually).
    // In v2, context.auth is not directly available in triggers same way.
    // We will rely on data fields if available, else 'SYSTEM/UNKNOWN'.

    // Note: If strict security is needed, 'createdBy' should be enforced in rules or backend functions.

    const userId = data.createdBy || data.updatedBy || "SYSTEM_OR_UNKNOWN";

    await createAuditLog("PATIENT_CREATED", userId, {
        targetId: patientId,
        targetCollection: "patients",
        newData: data,
        metadata: {
            source: "trigger"
        }
    });
});

export const onPatientUpdated = onDocumentUpdated("patients/{patientId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const before = change.before.data();
    const after = change.after.data();
    const patientId = event.params.patientId;
    const userId = after.updatedBy || after.lastModifiedBy || "SYSTEM_OR_UNKNOWN";

    const changes = getChangeDetails(before, after);
    if (!changes) return; // No actual changes

    await createAuditLog("PATIENT_UPDATED", userId, {
        targetId: patientId,
        targetCollection: "patients",
        previousData: before, // Optional: might be too large, prefer capturing granular changes in metadata if needed
        newData: after,
        metadata: {
            changes,
            source: "trigger"
        }
    });
});

export const onPatientDeleted = onDocumentDeleted("patients/{patientId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const patientId = event.params.patientId;
    const userId = "SYSTEM_ADMIN"; // Deletions usually hard to attribute in triggers unless soft delete

    await createAuditLog("PATIENT_DELETED", userId, {
        targetId: patientId,
        targetCollection: "patients",
        previousData: data,
        metadata: {
            source: "trigger"
        }
    });
});

// ============================================================
// APPOINTMENT TRIGGERS
// ============================================================

export const onAppointmentCreated = onDocumentCreated("appointments/{appointmentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const appointmentId = event.params.appointmentId;
    const userId = data.createdBy || data.patientId || "SYSTEM";

    await createAuditLog("APPOINTMENT_CREATED", userId, {
        targetId: appointmentId,
        targetCollection: "appointments",
        newData: data
    });
});

export const onAppointmentUpdated = onDocumentUpdated("appointments/{appointmentId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const before = change.before.data();
    const after = change.after.data();
    const appointmentId = event.params.appointmentId;
    const userId = after.updatedBy || "SYSTEM";

    // Detect cancellation specifically
    const action = (after.status === 'cancelled' && before.status !== 'cancelled')
        ? "APPOINTMENT_CANCELLED"
        : "APPOINTMENT_UPDATED";

    const changes = getChangeDetails(before, after);

    await createAuditLog(action, userId, {
        targetId: appointmentId,
        targetCollection: "appointments",
        metadata: {
            changes,
            source: "trigger"
        }
    });
});

// ============================================================
// CHAT TRIGGERS
// ============================================================

export const onChatCreated = onDocumentCreated("chats/{chatId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const chatId = event.params.chatId;
    // owner or authUid in metadata
    const userId = data.metadata?.authUid || "VISITOR";

    await createAuditLog("CHAT_CREATED", userId, {
        targetId: chatId,
        targetCollection: "chats",
        newData: data
    });
});

export const onMessageSent = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const chatId = event.params.chatId;
    const messageId = event.params.messageId;
    const userId = data.senderId || (data.sender === 'visitor' ? 'VISITOR' : 'STAFF');

    // To avoid spamming audit logs with every message, we might want to comment this out 
    // OR only log specific high-risk messages. Use with caution.
    // For now, logging it as requested.
    await createAuditLog("MESSAGE_SENT", userId, {
        targetId: messageId,
        targetCollection: `chats/${chatId}/messages`,
        metadata: {
            chatId,
            snippet: data.text?.substring(0, 50)
        }
    });
});

// ============================================================
// MEDICAL RECORD TRIGGERS (HISTORY & CONSULT)
// ============================================================

export const onHistoryCreated = onDocumentCreated("patients/{patientId}/histories/{historyId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const userId = data.createdBy || "SYSTEM";

    await createAuditLog("HISTORY_CREATED", userId, {
        targetId: event.params.historyId,
        targetCollection: "histories",
        metadata: { patientId: event.params.patientId }
    });
});

export const onHistoryUpdated = onDocumentUpdated("patients/{patientId}/histories/{historyId}", async (event) => {
    const change = event.data;
    if (!change) return;
    const after = change.after.data();
    const userId = after.updatedBy || "SYSTEM";

    await createAuditLog("HISTORY_UPDATED", userId, {
        targetId: event.params.historyId,
        targetCollection: "histories",
        metadata: {
            patientId: event.params.patientId,
            changes: getChangeDetails(change.before.data(), after)
        }
    });
});

export const onConsultCreated = onDocumentCreated("patients/{patientId}/consults/{consultId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const userId = data.createdBy || "SYSTEM";

    await createAuditLog("CONSULT_CREATED", userId, {
        targetId: event.params.consultId,
        targetCollection: "consults",
        metadata: { patientId: event.params.patientId }
    });
});
