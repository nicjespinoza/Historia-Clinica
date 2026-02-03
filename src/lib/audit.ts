/**
 * Client-side Audit Logging
 * 
 * Logs critical actions via Cloud Function instead of direct Firestore writes.
 * This ensures audit logs are written securely server-side and comply with
 * Firestore security rules (which block direct client writes to auditLogs).
 */

import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

export interface AuditEntry {
    action: string;
    details: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
}

// Lazy-load the Cloud Function reference
let logAuditFn: ReturnType<typeof httpsCallable> | null = null;

const getLogAuditFn = () => {
    if (!logAuditFn) {
        logAuditFn = httpsCallable(functions, 'logAuditFromClient');
    }
    return logAuditFn;
};

/**
 * Log critical actions to 'auditLogs' collection via Cloud Function
 * 
 * This function is fire-and-forget to avoid blocking main operations.
 * Audit failures are logged to console but don't throw errors.
 * 
 * @param entry - The audit entry to log
 */
export const logAudit = async (entry: AuditEntry): Promise<void> => {
    try {
        const fn = getLogAuditFn();
        await fn(entry);
    } catch (error) {
        // Log error but don't throw - audit failures shouldn't break main operations
        console.error("Failed to write audit log via Cloud Function:", error);
    }
};

/**
 * Convenience wrapper for logging patient-related actions
 */
export const logPatientAction = async (
    action: 'create' | 'update' | 'delete' | 'view',
    patientId: string,
    details: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    await logAudit({
        action: `PATIENT_${action.toUpperCase()}`,
        details,
        targetId: patientId,
        metadata
    });
};

/**
 * Convenience wrapper for logging history-related actions
 */
export const logHistoryAction = async (
    action: 'create' | 'update' | 'delete' | 'view',
    historyId: string,
    patientId: string,
    details: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    await logAudit({
        action: `HISTORY_${action.toUpperCase()}`,
        details,
        targetId: historyId,
        metadata: { ...metadata, patientId }
    });
};
