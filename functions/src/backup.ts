/**
 * Firestore Backup Cloud Functions
 * 
 * Provides automated backup functionality for critical patient data.
 * Runs daily at midnight to export Firestore data to Cloud Storage.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Ensure Firebase Admin is initialized (it's initialized in main index.ts)
const db = admin.firestore();
const storage = admin.storage();

// Collections to backup
const BACKUP_COLLECTIONS = [
    'patients',
    'appointments',
    'users'
];

// Subcollections under patients
const PATIENT_SUBCOLLECTIONS = [
    'histories',
    'consults',
    'observations',
    'snapshots'
];

interface BackupResult {
    success: boolean;
    timestamp: string;
    collectionsBackedUp: number;
    documentsBackedUp: number;
    errors: string[];
    backupPath?: string;
}

/**
 * Scheduled backup - Runs daily at midnight (America/El_Salvador timezone)
 * Exports all critical data to Cloud Storage as JSON files
 */
export const scheduledBackup = onSchedule(
    {
        schedule: "0 0 * * *", // Every day at midnight
        timeZone: "America/El_Salvador",
        retryCount: 3,
        memory: "512MiB"
    },
    async (context) => {
        console.log("Starting scheduled Firestore backup...");

        const result = await performBackup();

        if (result.success) {
            console.log(`✅ Backup completed successfully. ${result.documentsBackedUp} documents backed up.`);
        } else {
            console.error(`❌ Backup failed with errors:`, result.errors);
        }

        // Log backup result to audit collection
        await db.collection('auditLogs').add({
            action: 'SCHEDULED_BACKUP',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            result: result,
            triggeredBy: 'SYSTEM_SCHEDULER'
        });
    }
);

/**
 * Manual backup trigger - For admin users to trigger backup on demand
 */
export const triggerManualBackup = onCall(
    {
        memory: "512MiB"
    },
    async (request) => {
        // Verify user is authenticated and is admin
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
        }

        // Check if user is admin
        const userDoc = await db.collection('users').doc(request.auth.uid).get();
        const userData = userDoc.data();

        if (!userData || (userData.role !== 'admin' && userData.role !== 'doctor')) {
            throw new HttpsError("permission-denied", "Solo administradores pueden ejecutar backups.");
        }

        console.log(`Manual backup triggered by user: ${request.auth.uid}`);

        const result = await performBackup();

        // Log to audit
        await db.collection('auditLogs').add({
            action: 'MANUAL_BACKUP',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            result: result,
            triggeredBy: request.auth.uid,
            userEmail: request.auth.token.email
        });

        return result;
    }
);

/**
 * Get backup history - List recent backups
 */
export const getBackupHistory = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
    }

    // Get recent backup logs
    const logsSnapshot = await db.collection('auditLogs')
        .where('action', 'in', ['SCHEDULED_BACKUP', 'MANUAL_BACKUP'])
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

    return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
});

/**
 * Core backup function - Exports collections to Cloud Storage
 */
async function performBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupPath = `backups/${timestamp}`;
    const bucket = storage.bucket();

    const result: BackupResult = {
        success: true,
        timestamp,
        collectionsBackedUp: 0,
        documentsBackedUp: 0,
        errors: [],
        backupPath
    };

    try {
        // Backup main collections
        for (const collectionName of BACKUP_COLLECTIONS) {
            try {
                const snapshot = await db.collection(collectionName).get();
                const documents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (documents.length > 0) {
                    // Save to Cloud Storage as JSON
                    const file = bucket.file(`${backupPath}/${collectionName}.json`);
                    await file.save(JSON.stringify(documents, null, 2), {
                        contentType: 'application/json',
                        metadata: {
                            backupDate: timestamp,
                            documentCount: documents.length.toString()
                        }
                    });

                    result.collectionsBackedUp++;
                    result.documentsBackedUp += documents.length;
                    console.log(`✅ Backed up ${documents.length} documents from ${collectionName}`);
                }
            } catch (error: any) {
                result.errors.push(`Error backing up ${collectionName}: ${error.message}`);
                console.error(`Error backing up ${collectionName}:`, error);
            }
        }

        // Backup patient subcollections
        const patientsSnapshot = await db.collection('patients').get();

        for (const patientDoc of patientsSnapshot.docs) {
            for (const subCollection of PATIENT_SUBCOLLECTIONS) {
                try {
                    const subSnapshot = await db.collection('patients')
                        .doc(patientDoc.id)
                        .collection(subCollection)
                        .get();

                    if (!subSnapshot.empty) {
                        const subDocuments = subSnapshot.docs.map(doc => ({
                            id: doc.id,
                            patientId: patientDoc.id,
                            ...doc.data()
                        }));

                        // Save subcollection data
                        const file = bucket.file(
                            `${backupPath}/patients_${patientDoc.id}_${subCollection}.json`
                        );
                        await file.save(JSON.stringify(subDocuments, null, 2), {
                            contentType: 'application/json',
                            metadata: {
                                backupDate: timestamp,
                                patientId: patientDoc.id,
                                subCollection: subCollection,
                                documentCount: subDocuments.length.toString()
                            }
                        });

                        result.documentsBackedUp += subDocuments.length;
                    }
                } catch (error: any) {
                    // Don't fail entire backup for subcollection errors
                    result.errors.push(`Error backing up ${subCollection} for patient ${patientDoc.id}: ${error.message}`);
                }
            }
        }

        // Create backup manifest
        const manifest = {
            timestamp,
            completedAt: new Date().toISOString(),
            collectionsBackedUp: result.collectionsBackedUp,
            documentsBackedUp: result.documentsBackedUp,
            errors: result.errors
        };

        const manifestFile = bucket.file(`${backupPath}/manifest.json`);
        await manifestFile.save(JSON.stringify(manifest, null, 2), {
            contentType: 'application/json'
        });

        // Set backup retention policy - delete backups older than 30 days
        await cleanupOldBackups(bucket, 30);

    } catch (error: any) {
        result.success = false;
        result.errors.push(`Critical backup error: ${error.message}`);
        console.error("Critical backup error:", error);
    }

    return result;
}

/**
 * Cleanup old backups - Removes backups older than specified days
 */
async function cleanupOldBackups(bucket: any, retentionDays: number): Promise<void> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const [files] = await bucket.getFiles({ prefix: 'backups/' });

        for (const file of files) {
            const fileDate = file.name.split('/')[1]; // Extract date from path
            if (fileDate && new Date(fileDate) < cutoffDate) {
                await file.delete();
                console.log(`Deleted old backup file: ${file.name}`);
            }
        }
    } catch (error) {
        console.warn("Error cleaning up old backups:", error);
        // Don't throw - cleanup failure shouldn't fail the backup
    }
}

/**
 * Restore from backup - Admin only function to restore data
 */
export const restoreFromBackup = onCall(
    {
        memory: "1GiB"
    },
    async (request) => {
        // Strict admin-only access
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Authentication required.");
        }

        const userDoc = await db.collection('users').doc(request.auth.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            throw new HttpsError("permission-denied", "Admin access required.");
        }

        const { backupDate, collections } = request.data as {
            backupDate: string;
            collections?: string[];
        };

        if (!backupDate) {
            throw new HttpsError("invalid-argument", "backupDate is required.");
        }

        // This is a dangerous operation - log it extensively
        await db.collection('auditLogs').add({
            action: 'RESTORE_INITIATED',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            triggeredBy: request.auth.uid,
            backupDate,
            collections: collections || 'all'
        });

        // For safety, only return the backup manifest
        // Actual restoration should be done carefully via Firebase Console
        const bucket = storage.bucket();
        const manifestFile = bucket.file(`backups/${backupDate}/manifest.json`);

        try {
            const [contents] = await manifestFile.download();
            const manifest = JSON.parse(contents.toString());

            return {
                success: true,
                message: "Backup manifest retrieved. Use Firebase Console for actual restoration.",
                manifest
            };
        } catch (error: any) {
            throw new HttpsError("not-found", `Backup not found for date: ${backupDate}`);
        }
    }
);
