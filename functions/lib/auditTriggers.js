"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onConsultCreated = exports.onHistoryUpdated = exports.onHistoryCreated = exports.onMessageSent = exports.onChatCreated = exports.onAppointmentUpdated = exports.onAppointmentCreated = exports.onPatientDeleted = exports.onPatientUpdated = exports.onPatientCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const auditLogs_1 = require("./auditLogs");
// Helper to extract relevant changes
function getChangeDetails(before, after) {
    const changes = {};
    if (!before || !after)
        return undefined;
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
exports.onPatientCreated = (0, firestore_1.onDocumentCreated)("patients/{patientId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
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
    await (0, auditLogs_1.createAuditLog)("PATIENT_CREATED", userId, {
        targetId: patientId,
        targetCollection: "patients",
        newData: data,
        metadata: {
            source: "trigger"
        }
    });
});
exports.onPatientUpdated = (0, firestore_1.onDocumentUpdated)("patients/{patientId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const before = change.before.data();
    const after = change.after.data();
    const patientId = event.params.patientId;
    const userId = after.updatedBy || after.lastModifiedBy || "SYSTEM_OR_UNKNOWN";
    const changes = getChangeDetails(before, after);
    if (!changes)
        return; // No actual changes
    await (0, auditLogs_1.createAuditLog)("PATIENT_UPDATED", userId, {
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
exports.onPatientDeleted = (0, firestore_1.onDocumentDeleted)("patients/{patientId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const patientId = event.params.patientId;
    const userId = "SYSTEM_ADMIN"; // Deletions usually hard to attribute in triggers unless soft delete
    await (0, auditLogs_1.createAuditLog)("PATIENT_DELETED", userId, {
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
exports.onAppointmentCreated = (0, firestore_1.onDocumentCreated)("appointments/{appointmentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const appointmentId = event.params.appointmentId;
    const userId = data.createdBy || data.patientId || "SYSTEM";
    await (0, auditLogs_1.createAuditLog)("APPOINTMENT_CREATED", userId, {
        targetId: appointmentId,
        targetCollection: "appointments",
        newData: data
    });
});
exports.onAppointmentUpdated = (0, firestore_1.onDocumentUpdated)("appointments/{appointmentId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const before = change.before.data();
    const after = change.after.data();
    const appointmentId = event.params.appointmentId;
    const userId = after.updatedBy || "SYSTEM";
    // Detect cancellation specifically
    const action = (after.status === 'cancelled' && before.status !== 'cancelled')
        ? "APPOINTMENT_CANCELLED"
        : "APPOINTMENT_UPDATED";
    const changes = getChangeDetails(before, after);
    await (0, auditLogs_1.createAuditLog)(action, userId, {
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
exports.onChatCreated = (0, firestore_1.onDocumentCreated)("chats/{chatId}", async (event) => {
    var _a;
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const chatId = event.params.chatId;
    // owner or authUid in metadata
    const userId = ((_a = data.metadata) === null || _a === void 0 ? void 0 : _a.authUid) || "VISITOR";
    await (0, auditLogs_1.createAuditLog)("CHAT_CREATED", userId, {
        targetId: chatId,
        targetCollection: "chats",
        newData: data
    });
});
exports.onMessageSent = (0, firestore_1.onDocumentCreated)("chats/{chatId}/messages/{messageId}", async (event) => {
    var _a;
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const chatId = event.params.chatId;
    const messageId = event.params.messageId;
    const userId = data.senderId || (data.sender === 'visitor' ? 'VISITOR' : 'STAFF');
    // To avoid spamming audit logs with every message, we might want to comment this out 
    // OR only log specific high-risk messages. Use with caution.
    // For now, logging it as requested.
    await (0, auditLogs_1.createAuditLog)("MESSAGE_SENT", userId, {
        targetId: messageId,
        targetCollection: `chats/${chatId}/messages`,
        metadata: {
            chatId,
            snippet: (_a = data.text) === null || _a === void 0 ? void 0 : _a.substring(0, 50)
        }
    });
});
// ============================================================
// MEDICAL RECORD TRIGGERS (HISTORY & CONSULT)
// ============================================================
exports.onHistoryCreated = (0, firestore_1.onDocumentCreated)("patients/{patientId}/histories/{historyId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const userId = data.createdBy || "SYSTEM";
    await (0, auditLogs_1.createAuditLog)("HISTORY_CREATED", userId, {
        targetId: event.params.historyId,
        targetCollection: "histories",
        metadata: { patientId: event.params.patientId }
    });
});
exports.onHistoryUpdated = (0, firestore_1.onDocumentUpdated)("patients/{patientId}/histories/{historyId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const after = change.after.data();
    const userId = after.updatedBy || "SYSTEM";
    await (0, auditLogs_1.createAuditLog)("HISTORY_UPDATED", userId, {
        targetId: event.params.historyId,
        targetCollection: "histories",
        metadata: {
            patientId: event.params.patientId,
            changes: getChangeDetails(change.before.data(), after)
        }
    });
});
exports.onConsultCreated = (0, firestore_1.onDocumentCreated)("patients/{patientId}/consults/{consultId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const userId = data.createdBy || "SYSTEM";
    await (0, auditLogs_1.createAuditLog)("CONSULT_CREATED", userId, {
        targetId: event.params.consultId,
        targetCollection: "consults",
        metadata: { patientId: event.params.patientId }
    });
});
//# sourceMappingURL=auditTriggers.js.map