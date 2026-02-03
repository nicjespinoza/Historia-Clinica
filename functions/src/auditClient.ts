/**
 * Client Audit Logging Cloud Function
 * 
 * Provides secure audit logging from the client via Cloud Function
 * instead of direct Firestore writes (which would violate security rules)
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

interface AuditLogRequest {
    action: string;
    details: string;
    targetId?: string;
    metadata?: Record<string, any>;
}

/**
 * Log audit events from client securely via Cloud Function
 * This ensures audit logs can only be created by authenticated users
 * and are written server-side (not directly from client)
 */
export const logAuditFromClient = onCall(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Must be logged in to log audit events"
        );
    }

    const data = request.data as AuditLogRequest;
    const { action, details, targetId, metadata } = data;

    // Validate required fields
    if (!action || !details) {
        throw new HttpsError(
            "invalid-argument",
            "action and details are required fields"
        );
    }

    // Validate action string length
    if (action.length > 50 || details.length > 500) {
        throw new HttpsError(
            "invalid-argument",
            "action (max 50 chars) and details (max 500 chars) are too long"
        );
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
            ipAddress: request.rawRequest?.ip || null,
            userAgent: request.rawRequest?.headers?.["user-agent"] || null,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error writing audit log:", error);
        throw new HttpsError(
            "internal",
            "Failed to write audit log"
        );
    }
});
