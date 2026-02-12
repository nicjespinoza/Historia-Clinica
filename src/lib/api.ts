import { Patient, InitialHistory, SubsequentConsult, Appointment } from '../types';
import { db, auth } from './firebase';
import { offlineQueue } from './offlineQueue';
import { logAudit } from './audit';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    QueryDocumentSnapshot,
    onSnapshot,
    Unsubscribe,
    writeBatch
} from 'firebase/firestore';
import { firestoreCache, PAGE_SIZES, PaginatedResult } from './cache';


/**
 * Verifica si un valor es un Firestore Timestamp
 * @param value - Valor a verificar
 * @returns true si tiene método toDate() (indica Timestamp)
 */
const isTimestamp = (value: any): boolean => {
    return value && typeof value === 'object' && typeof value.toDate === 'function';
};

/**
 * Normaliza timestamps de Firestore a strings ISO recursivamente
 * Maneja: Timestamp.toDate(), {seconds, nanoseconds}, arrays y objetos anidados
 * @param data - Datos a normalizar
 * @returns Datos con timestamps convertidos a ISO strings
 */
const normalizeTimestamps = (data: any): any => {
    if (!data || typeof data !== 'object') return data;

    // Handle Timestamp objects
    if (isTimestamp(data)) return data.toDate().toISOString();

    // Handle raw object timestamps {seconds, nanoseconds}
    if (!Array.isArray(data) && data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length <= 2) {
        return new Date(data.seconds * 1000).toISOString();
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => normalizeTimestamps(item));
    }

    // Handle Objects
    const normalized: any = {};
    Object.keys(data).forEach(key => {
        normalized[key] = normalizeTimestamps(data[key]);
    });
    return normalized;
};

/**
 * Convierte un documento de Firestore a un objeto tipado
 * - Usa doc.id (no cualquier campo 'id' almacenado)
 * - Normaliza todos los timestamps recursivamente
 * @param doc - Documento de Firestore (snapshot)
 * @returns Objeto tipado con id del documento
 * @example
 * const patient = docToData<Patient>(snapshot);
 */
const docToData = <T>(doc: any): T => {
    const data = doc.data();
    const normalizedData = normalizeTimestamps(data);
    const { id: storedId, ...rest } = normalizedData;
    return {
        id: doc.id,
        ...rest
    } as T;
};

export const api = {
    // ==================== PATIENTS ====================

    /**
     * Get all patients (CACHED - 5 min TTL)
     * Use for dropdowns, autocomplete, etc.
     */
    getPatients: async (): Promise<Patient[]> => {
        return firestoreCache.getOrFetch(
            'patients:all_v4', // Cache busted
            async () => {
                // No orderBy = no index needed = faster cold start
                const snapshot = await getDocs(collection(db, 'patients'));
                const data = snapshot.docs.map(d => docToData<Patient>(d));
                // Sort client-side (instant for <1000 docs)
                data.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                return data;
            },
            15 * 60 * 1000
        );
    },

    /**
     * Subscribe to patients updates (REAL-TIME)
     * @param onUpdate - Callback function receiving the updated list of patients
     * @returns Unsubscribe function
     */
    subscribeToPatients: (onUpdate: (patients: Patient[]) => void): Unsubscribe => {
        return onSnapshot(collection(db, 'patients'), (snapshot) => {
            const patients = snapshot.docs.map(d => docToData<Patient>(d));
            patients.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            // Update cache silently to keep it fresh
            firestoreCache.set('patients:all_v4', patients, 15 * 60 * 1000);
            onUpdate(patients);
        }, (error) => {
            console.error("Error subscribing to patients:", error);
        });
    },

    /**
     * Get patients with pagination (OPTIMIZED)
     * Use for large lists to reduce reads
     */
    getPatientsPaginated: async (
        pageSize: number = PAGE_SIZES.patients,
        lastDoc?: QueryDocumentSnapshot,
        statuses?: string[]
    ): Promise<PaginatedResult<Patient>> => {
        let q;

        if (statuses && statuses.length > 0) {
            // If statuses are provided, filter by them
            q = query(
                collection(db, 'patients'),
                where('registrationStatus', 'in', statuses),
                orderBy('createdAt', 'desc'),
                limit(pageSize + 1)
            );

            if (lastDoc) {
                q = query(
                    collection(db, 'patients'),
                    where('registrationStatus', 'in', statuses),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(pageSize + 1)
                );
            }
        } else {
            // Default behavior
            q = query(
                collection(db, 'patients'),
                orderBy('createdAt', 'desc'),
                limit(pageSize + 1)
            );

            if (lastDoc) {
                q = query(
                    collection(db, 'patients'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(pageSize + 1)
                );
            }
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs;
        const hasMore = docs.length > pageSize;

        // Remove the extra doc we fetched
        const resultDocs = hasMore ? docs.slice(0, -1) : docs;

        return {
            data: resultDocs.map(d => docToData<Patient>(d)),
            lastDoc: resultDocs[resultDocs.length - 1] || null,
            hasMore,
            totalFetched: resultDocs.length
        };
    },


    /**
     * Crea un nuevo paciente en Firestore
     * @param data - Datos del paciente (id es ignorado si presente)
     * @returns Paciente creado con su nuevo id
     * @throws Error de Firebase si falla la creación
     */
    createPatient: async (data: Omit<Patient, 'id'> | Patient): Promise<Patient> => {
        // Explicitly remove id field if present (to prevent saving empty string IDs)
        const { id, ...patientData } = data as Patient;

        const docRef = await addDoc(collection(db, 'patients'), {
            ...patientData,
            createdAt: new Date().toISOString()
        });

        // Invalidate patients cache so next fetch gets fresh data
        firestoreCache.invalidate('patients:all_v3');

        await logAudit({
            action: 'CREATE_PATIENT',
            details: `Created patient ${patientData.firstName} ${patientData.lastName}`,
            targetId: docRef.id
        });

        return { id: docRef.id, ...patientData } as Patient;
    },


    /**
     * Actualiza un paciente existente
     * @param id - ID del paciente a actualizar
     * @param data - Campos a actualizar (parcial)
     * @returns Paciente actualizado
     */
    updatePatient: async (id: string, data: Partial<Patient>): Promise<Patient> => {
        const docRef = doc(db, 'patients', id);
        await updateDoc(docRef, data);
        firestoreCache.invalidate('patients:all_v3');
        const updated = await getDoc(docRef);
        return docToData<Patient>(updated);
    },

    /**
     * Elimina un paciente y todos sus datos relacionados
     * Incluye: subcollections (histories, consults, etc.) y appointments
     * @param id - ID del paciente a eliminar
     * @warning Esta operación es irreversible
     */
    deletePatient: async (id: string): Promise<void> => {
        // Deep delete: remove subcollections and related docs
        const patientRef = doc(db, 'patients', id);

        // 1. Delete Subcollections
        const subcollections = ['histories', 'consults', 'observations', 'snapshots'];
        for (const subCol of subcollections) {
            const subDocs = await getDocs(collection(db, 'patients', id, subCol));
            const batch = writeBatch(db);
            subDocs.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }

        // 2. Delete Related Appointments
        const appointmentsQ = query(collection(db, 'appointments'), where('patientId', '==', id));
        const appointmentsSnap = await getDocs(appointmentsQ);
        const batchAppt = writeBatch(db);
        appointmentsSnap.docs.forEach(d => batchAppt.delete(d.ref));
        await batchAppt.commit();

        // 3. Delete Patient Doc
        await deleteDoc(patientRef);
        firestoreCache.invalidate('patients:all_v3');
        firestoreCache.invalidatePattern('^appointments:');

        await logAudit({
            action: 'DELETE_PATIENT',
            details: `Deleted patient ${id} and all related data`,
            targetId: id
        });
    },

    /**
     * Get single patient by ID (Optimized)
     */
    getPatient: async (id: string): Promise<Patient | null> => {
        const docRef = doc(db, 'patients', id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return docToData<Patient>(snapshot);
    },


    getPatientStatus: async (id: string): Promise<{ canChat: boolean }> => {
        const docRef = doc(db, 'patients', id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return { canChat: false };
        const data = snapshot.data();
        return { canChat: data?.isOnline ?? false };
    },

    // ==================== HISTORIES (Subcollection & Root Fallback) ====================
    getHistories: async (patientId?: string): Promise<InitialHistory[]> => {
        if (patientId) {
            // 1. Try Subcollection (New App)
            const subColRef = collection(db, 'patients', patientId, 'histories');
            const subSnapshot = await getDocs(subColRef);
            const subDocs = subSnapshot.docs.map(doc => docToData<InitialHistory>(doc));

            // 2. Try Root Collection (Migrated Data)
            const rootColRef = query(collection(db, 'initialHistories'), where('patientId', '==', patientId));
            const rootSnapshot = await getDocs(rootColRef);
            const rootDocs = rootSnapshot.docs.map(doc => docToData<InitialHistory>(doc));

            // Combine and sort by date descending
            const combined = [...subDocs, ...rootDocs].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            return combined;
        }

        // For all histories, use getAllHistoriesFlat() instead (optimized for reports)
        return api.getAllHistoriesFlat();
    },

    /**
     * OPTIMIZED: Get all histories from root 'initialHistories' collection (1 query).
     * This is the fast path for reports - reads migrated data directly.
     * Cached for 15 minutes.
     */
    getAllHistoriesFlat: async (): Promise<InitialHistory[]> => {
        return firestoreCache.getOrFetch(
            'histories:all_flat_v1',
            async () => {
                const snapshot = await getDocs(collection(db, 'initialHistories'));
                return snapshot.docs.map(doc => docToData<InitialHistory>(doc));
            },
            15 * 60 * 1000
        );
    },

    /**
     * OPTIMIZED: Get all consults from root 'subsequentConsults' collection (1 query).
     * Cached for 15 minutes.
     */
    getAllConsultsFlat: async (): Promise<SubsequentConsult[]> => {
        return firestoreCache.getOrFetch(
            'consults:all_flat_v1',
            async () => {
                const snapshot = await getDocs(collection(db, 'subsequentConsults'));
                return snapshot.docs.map(doc => docToData<SubsequentConsult>(doc));
            },
            15 * 60 * 1000
        );
    },

    createHistory: async (data: Omit<InitialHistory, 'id'>): Promise<InitialHistory> => {
        // OFFLINE INTERCEPTION
        if (!navigator.onLine) {
            const userEmail = auth.currentUser?.email || null;
            if (offlineQueue.canUseOfflineMode(userEmail)) {
                offlineQueue.enqueueAction('CREATE_HISTORY', data, userEmail);
                return {
                    id: `temp-offline-${Date.now()}`,
                    ...data
                } as InitialHistory;
            }
        }

        // Use batch write to create history AND update patient stats
        const batch = writeBatch(db);

        // 1. History Doc Ref
        const historiesRef = collection(db, 'patients', data.patientId, 'histories');
        const newHistoryRef = doc(historiesRef); // auto-id

        // 2. Add History to Batch
        batch.set(newHistoryRef, data);

        // 3. Update Patient "lastHistoryDate" to Batch
        const patientRef = doc(db, 'patients', data.patientId);
        batch.update(patientRef, {
            lastHistoryDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // 4. Commit Batch
        await batch.commit();

        try {
            await logAudit({
                action: 'CREATE_HISTORY',
                details: `Created history for patient ${data.patientId}`,
                targetId: newHistoryRef.id,
                metadata: { patientId: data.patientId }
            });
        } catch (e) {
            console.warn("Offline: Audit log queued or failed", e);
        }
        return { id: newHistoryRef.id, ...data } as InitialHistory;
    },

    updateHistory: async (id: string, data: Partial<InitialHistory>): Promise<InitialHistory> => {
        if (!data.patientId) throw new Error('patientId required to update history');

        // Try to update in subcollection first
        try {
            const docRef = doc(db, 'patients', data.patientId, 'histories', id);
            await updateDoc(docRef, data);
            const updated = await getDoc(docRef);
            return docToData<InitialHistory>(updated);
        } catch (e) {
            // If failed, try root collection (legacy migrated)
            try {
                const rootDocRef = doc(db, 'initialHistories', id);
                await updateDoc(rootDocRef, data);
                const updated = await getDoc(rootDocRef);
                return docToData<InitialHistory>(updated);
            } catch (rootError) {
                throw new Error('History not found in either location');
            }
        }
    },

    deleteHistory: async (historyId: string, patientId?: string): Promise<void> => {
        if (!patientId) throw new Error("Patient ID required for deletion");

        // Try deleting from subcollection
        const subDocRef = doc(db, 'patients', patientId, 'histories', historyId);
        const subDoc = await getDoc(subDocRef);
        if (subDoc.exists()) {
            await deleteDoc(subDocRef);
            return;
        }

        // Try deleting from root collection
        const rootDocRef = doc(db, 'initialHistories', historyId);
        const rootDoc = await getDoc(rootDocRef);
        if (rootDoc.exists()) {
            await deleteDoc(rootDocRef);
            return;
        }
    },

    // ==================== CONSULTS (Subcollection & Root Fallback) ====================

    getConsult: async (patientId: string, consultId: string): Promise<SubsequentConsult | null> => {
        // 1. Try Subcollection (New App)
        try {
            const subDocRef = doc(db, 'patients', patientId, 'consults', consultId);
            const subSnap = await getDoc(subDocRef);
            if (subSnap.exists()) {
                return docToData<SubsequentConsult>(subSnap);
            }
        } catch (error: any) {
            // Ignore permission errors (likely due to missing doc + isNotDeleted rule)
            // or other errors, and proceed to check root collection
            console.warn("Could not fetch from subcollection, checking root:", error.message);
        }

        // 2. Try Root Collection (Migrated Data)
        try {
            const rootDocRef = doc(db, 'subsequentConsults', consultId);
            const rootSnap = await getDoc(rootDocRef);
            if (rootSnap.exists()) {
                const data = docToData<SubsequentConsult>(rootSnap);
                // Verify it belongs to this patient just in case (though consultId is UUID)
                if (data.patientId === patientId) {
                    return data;
                }
            }
        } catch (error) {
            console.error("Error fetching from root collection:", error);
        }

        return null; // Not found in either
    },

    getConsults: async (patientId?: string): Promise<SubsequentConsult[]> => {
        if (patientId) {
            // 1. Try Subcollection
            const subSnapshot = await getDocs(collection(db, 'patients', patientId, 'consults'));
            const subDocs = subSnapshot.docs.map(doc => docToData<SubsequentConsult>(doc));

            // 2. Try Root Collection (Migrated)
            const rootQ = query(collection(db, 'subsequentConsults'), where('patientId', '==', patientId));
            const rootSnapshot = await getDocs(rootQ);
            const rootDocs = rootSnapshot.docs.map(doc => docToData<SubsequentConsult>(doc));

            // Combine
            const combined = [...subDocs, ...rootDocs].sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                return dateB.getTime() - dateA.getTime();
            });
            return combined;
        }

        // Fallback for getting all
        const patientsSnapshot = await getDocs(collection(db, 'patients'));
        const allConsults: SubsequentConsult[] = [];
        for (const patientDoc of patientsSnapshot.docs) {
            const consultsSnapshot = await getDocs(collection(db, 'patients', patientDoc.id, 'consults'));
            allConsults.push(...consultsSnapshot.docs.map(doc => docToData<SubsequentConsult>(doc)));
        }
        return allConsults;
    },

    /**
     * Subscribe to patient's consults (REAL-TIME)
     * Listens to subcollection 'patients/{id}/consults'
     */
    subscribeToConsults: (patientId: string, onUpdate: (consults: SubsequentConsult[]) => void): Unsubscribe => {
        const q = query(collection(db, 'patients', patientId, 'consults'));
        return onSnapshot(q, (snapshot) => {
            const consults = snapshot.docs.map(d => docToData<SubsequentConsult>(d));
            // Update cache silently
            firestoreCache.set(`consults:${patientId}`, consults, 5 * 60 * 1000);
            onUpdate(consults);
        }, (error) => {
            console.error("Error subscribing to consults:", error);
        });
    },

    createConsult: async (data: Omit<SubsequentConsult, 'id'>): Promise<SubsequentConsult> => {
        // OFFLINE INTERCEPTION
        if (!navigator.onLine) {
            const userEmail = auth.currentUser?.email || null;
            if (offlineQueue.canUseOfflineMode(userEmail)) {
                offlineQueue.enqueueAction('CREATE_CONSULT', data, userEmail);
                return {
                    id: `temp-offline-${Date.now()}`,
                    ...data
                } as SubsequentConsult;
            }
        }

        const docRef = await addDoc(collection(db, 'patients', data.patientId, 'consults'), data);
        try {
            await logAudit({
                action: 'CREATE_CONSULT',
                details: `Created consult for patient ${data.patientId}`,
                targetId: docRef.id,
                metadata: { patientId: data.patientId }
            });
        } catch (e) {
            console.warn("Offline: Audit log queued or failed", e);
        }
        return { id: docRef.id, ...data } as SubsequentConsult;
    },

    updateConsult: async (consultId: string, data: Partial<SubsequentConsult>): Promise<SubsequentConsult> => {
        if (!data.patientId) throw new Error('patientId required to update consult');

        // Try to update in subcollection first
        try {
            const docRef = doc(db, 'patients', data.patientId, 'consults', consultId);
            await updateDoc(docRef, data);
            const updated = await getDoc(docRef);
            return docToData<SubsequentConsult>(updated);
        } catch (e) {
            // Try root collection (legacy)
            try {
                const rootDocRef = doc(db, 'subsequentConsults', consultId);
                await updateDoc(rootDocRef, data);
                const updated = await getDoc(rootDocRef);
                return docToData<SubsequentConsult>(updated);
            } catch (rootError) {
                throw new Error('Consult not found in either location');
            }
        }
    },

    deleteConsult: async (consultId: string, patientId?: string): Promise<void> => {
        if (!patientId) throw new Error("Patient ID required for deletion");

        // Try deleting from subcollection
        const subDocRef = doc(db, 'patients', patientId, 'consults', consultId);
        const subDoc = await getDoc(subDocRef);
        if (subDoc.exists()) {
            await deleteDoc(subDocRef);
            return;
        }

        // Try deleting from root collection
        const rootDocRef = doc(db, 'subsequentConsults', consultId);
        const rootDoc = await getDoc(rootDocRef);
        if (rootDoc.exists()) {
            await deleteDoc(rootDocRef);
            return;
        }
    },

    // ==================== OBSERVATIONS (Subcollection) ====================
    createObservation: async (patientId: string, data: { coordinates: { x: number, y: number, z: number }, note: string, organ: string, snapshotId?: string }) => {
        const docRef = await addDoc(collection(db, 'patients', patientId, 'observations'), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...data };
    },

    getObservations: async (patientId: string, snapshotId?: string) => {
        const obsCollection = collection(db, 'patients', patientId, 'observations');
        let snapshot;
        if (snapshotId) {
            const q = query(obsCollection, where('snapshotId', '==', snapshotId));
            snapshot = await getDocs(q);
        } else {
            snapshot = await getDocs(obsCollection);
        }
        return snapshot.docs.map(doc => docToData<any>(doc));
    },

    deleteObservation: async (patientId: string, id: string) => {
        await deleteDoc(doc(db, 'patients', patientId, 'observations', id));
        return { success: true };
    },

    // ==================== SNAPSHOTS (Subcollection) ====================
    createSnapshot: async (patientId: string, name?: string) => {
        const docRef = await addDoc(collection(db, 'patients', patientId, 'snapshots'), {
            name: name || `Snapshot ${new Date().toISOString()}`,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, name };
    },

    getSnapshots: async (patientId: string) => {
        const snapshot = await getDocs(collection(db, 'patients', patientId, 'snapshots'));
        return snapshot.docs.map(doc => docToData<any>(doc));
    },

    deleteSnapshot: async (patientId: string, id: string) => {
        await deleteDoc(doc(db, 'patients', patientId, 'snapshots', id));
        return { success: true };
    },

    // ==================== APPOINTMENTS (Root Collection) ====================

    /**
     * Get all appointments (CACHED - 2 min TTL)
     * Shorter TTL because appointments change more frequently
     */
    getAppointments: async (): Promise<Appointment[]> => {
        return firestoreCache.getOrFetch(
            'appointments:all',
            async () => {
                const q = query(
                    collection(db, 'appointments'),
                    orderBy('date', 'desc'),
                    limit(100) // Limit to last 100 appointments for performance
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => docToData<Appointment>(d));
            },
            2 * 60 * 1000 // 2 minutes cache
        );
    },

    /**
     * Get appointments for a specific date range (OPTIMIZED for agenda)
     * Only fetches the appointments you need
     */
    getAppointmentsByDateRange: async (startDate: string, endDate: string): Promise<Appointment[]> => {
        const cacheKey = `appointments:${startDate}:${endDate}`;
        return firestoreCache.getOrFetch(
            cacheKey,
            async () => {
                const q = query(
                    collection(db, 'appointments'),
                    where('date', '>=', startDate),
                    where('date', '<=', endDate),
                    orderBy('date', 'asc')
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => docToData<Appointment>(d));
            },
            5 * 60 * 1000 // 5 minutes cache for date ranges
        );
    },

    /**
     * Get upcoming appointments for a patient (OPTIMIZED)
     */
    getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
        const cacheKey = `appointments:patient:${patientId}`;
        return firestoreCache.getOrFetch(
            cacheKey,
            async () => {
                const q = query(
                    collection(db, 'appointments'),
                    where('patientId', '==', patientId),
                    orderBy('date', 'desc'),
                    limit(20)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => docToData<Appointment>(d));
            },
            3 * 60 * 1000 // 3 minutes cache
        );
    },

    createAppointment: async (data: Omit<Appointment, 'id'>): Promise<Appointment> => {
        // OFFLINE INTERCEPTION
        if (!navigator.onLine) {
            const userEmail = auth.currentUser?.email || null;
            if (offlineQueue.canUseOfflineMode(userEmail)) {
                offlineQueue.enqueueAction('CREATE_APPOINTMENT', data, userEmail);
                return {
                    id: `temp-offline-${Date.now()}`,
                    uniqueId: `OFFLINE-${Date.now()}`,
                    ...data
                } as Appointment;
            }
        }

        const uniqueId = `CITA-${Date.now()}`;
        const docRef = await addDoc(collection(db, 'appointments'), {
            ...data,
            uniqueId,
            createdAt: new Date().toISOString()
        });
        // Invalidate all appointment caches
        firestoreCache.invalidatePattern('^appointments:');
        return { id: docRef.id, uniqueId, ...data } as Appointment;
    },

    updateAppointment: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
        const docRef = doc(db, 'appointments', id);
        await updateDoc(docRef, data);
        firestoreCache.invalidatePattern('^appointments:');
        const updated = await getDoc(docRef);
        return docToData<Appointment>(updated);
    },

    deleteAppointment: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, 'appointments', id));
        firestoreCache.invalidatePattern('^appointments:');
    },


    // ==================== PATIENT AUTH ====================
    // NOTE: All patient authentication is now handled via Firebase Auth.
    // Use the useAuth() hook from src/context/AuthContext.tsx:
    //   - signUp(email, password) for registration
    //   - signIn(email, password) for login  
    //   - logout() for logout


    // ==================== PAYMENT (Cloud Function) ====================
    initiatePayment: async (data: { appointmentId: string, patientId: string, amount: number, gateway: string }) => {
        // Import functions dynamically to avoid circular dependency
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const initiatePaymentFn = httpsCallable(functions, 'initiatePayment');

        const result = await initiatePaymentFn(data);
        return result.data;
    },

    checkEmailAvailability: async (email: string): Promise<{ exists: boolean }> => {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const checkEmailFn = httpsCallable(functions, 'checkEmailAvailability');
        const result = await checkEmailFn({ email });
        return result.data as { exists: boolean };
    },

    // ==================== USERS ====================
    getUser: async (userId: string) => {
        const docRef = doc(db, 'users', userId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return docToData<any>(snapshot);
    },

    /**
     * Set user role (ADMIN ONLY)
     * Note: This should only be called from Cloud Functions with admin verification
     */
    setRole: async (userId: string, role: string) => {
        const docRef = doc(db, 'users', userId);
        const { setDoc } = await import('firebase/firestore');

        // Only update role and timestamp, don't overwrite other user data
        await setDoc(docRef, {
            role,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return { success: true };
    }

};
