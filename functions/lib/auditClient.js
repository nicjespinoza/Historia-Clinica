"use strict";
/**
 * Client Audit Logging Cloud Function
 *
 * Provides secure audit logging from the client via Cloud Function
 * instead of direct Firestore writes (which would violate security rules)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditFromClient = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
/**
 * Log audit events from client securely via Cloud Function
 * This ensures audit logs can only be created by authenticated users
 * and are written server-side (not directly from client)
 */
exports.logAuditFromClient = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in to log audit events");
    }
    const data = request.data;
    const { action, details, targetId, metadata } = data;
    // Validate required fields
    if (!action || !details) {
        throw new https_1.HttpsError("invalid-argument", "action and details are required fields");
    }
    // Validate action string length
    if (action.length > 50 || details.length > 500) {
        throw new https_1.HttpsError("invalid-argument", "action (max 50 chars) and details (max 500 chars) are too long");
    }
    try {
        // Get user info from auth token
        const userId = request.auth.uid;
        const userEmail = request.auth.token.email || "unknown";
        const userRole = request.auth.token.role || "unknown";
        // Write audit log server-side
        await admin.firestore().collection("auditLogs").add({
            action,
            details,
            targetId: targetId || null,
            metadata: metadata || {},
            userId,
            userEmail,
            userRole,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: "client", // Distinguish from server-side logs
            ipAddress: ((_a = request.rawRequest) === null || _a === void 0 ? void 0 : _a.ip) || null,
            userAgent: ((_c = (_b = request.rawRequest) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c["user-agent"]) || null,
        });
        return { success: true };
    }
    catch (error) {
        console.error("Error writing audit log:", error);
        throw new https_1.HttpsError("internal", "Failed to write audit log");
    }
});
//# sourceMappingURL=auditClient.js.map