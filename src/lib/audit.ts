import { db, auth } from './firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

export interface AuditEntry {
    action: string;
    details: string;
    targetId?: string;
    metadata?: any;
}

/**
 * Log critical actions to 'auditLogs' collection
 * Automatic capturing of User ID and Role (if available)
 */
export const logAudit = async (entry: AuditEntry) => {
    try {
        const user = auth.currentUser;
        let userRole = 'unknown';
        let userEmail = 'unknown';

        if (user) {
            userEmail = user.email || 'no-email';
            // Try to get role from claims or user doc if critical, 
            // but for performance we might just log UID and analyze later.
            // Or simple fetch:
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    userRole = userDoc.data().role || 'unknown';
                }
            } catch (e) {
                // Ignore
            }
        }

        await addDoc(collection(db, 'auditLogs'), {
            ...entry,
            userId: user?.uid || 'anonymous',
            userEmail,
            userRole,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
};
