import { Patient, InitialHistory, SubsequentConsult, Appointment } from '../types';
import { db } from './firebase';
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
    QueryDocumentSnapshot
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
            'patients:all_v3', // Cache busted for sort order
            async () => {
                const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => docToData<Patient>(d));
            },
            5 * 60 * 1000
        );
    },

    /**
     * Get patients with pagination (OPTIMIZED)
     * Use for large lists to reduce reads
     */
    getPatientsPaginated: async (
        pageSize: number = PAGE_SIZES.patients,
        lastDoc?: QueryDocumentSnapshot
    ): Promise<PaginatedResult<Patient>> => {
        let q = query(
            collection(db, 'patients'),
            orderBy('createdAt', 'desc'),
            limit(pageSize + 1) // Fetch one extra to check if more exist
        );

        if (lastDoc) {
            q = query(
                collection(db, 'patients'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize + 1)
            );
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
            const batch = import('firebase/firestore').then(mod => { // Lazy load writeBatch if needed or use db.batch()
                // Note: we can't use db.batch() directly inside a loop easily if > 500 docs, 
                // but for individual patient cleanup it's likely fine.
                // safe approach: delete one by one or small batches.
                const b = mod.writeBatch(db);
                subDocs.docs.forEach(d => b.delete(d.ref));
                return b.commit();
            });
            await batch;
        }

        // 2. Delete Related Appointments
        const appointmentsQ = query(collection(db, 'appointments'), where('patientId', '==', id));
        const appointmentsSnap = await getDocs(appointmentsQ);
        const batchAppt = import('firebase/firestore').then(mod => {
            const b = mod.writeBatch(db);
            appointmentsSnap.docs.forEach(d => b.delete(d.ref));
            return b.commit();
        });
        await batchAppt;

        // 3. Delete Patient Doc
        await deleteDoc(patientRef);
        firestoreCache.invalidate('patients:all_v3');
        firestoreCache.invalidatePattern('^appointments:');
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

        // If no patientId, get all histories (expensive, mainly for dev/debug)
        const patientsSnapshot = await getDocs(collection(db, 'patients'));
        const allHistories: InitialHistory[] = [];
        for (const patientDoc of patientsSnapshot.docs) {
            const historiesSnapshot = await getDocs(collection(db, 'patients', patientDoc.id, 'histories'));
            allHistories.push(...historiesSnapshot.docs.map(doc => docToData<InitialHistory>(doc)));
        }
        return allHistories;
    },

    createHistory: async (data: Omit<InitialHistory, 'id'>): Promise<InitialHistory> => {
        // Always save new histories to the subcollection
        const docRef = await addDoc(collection(db, 'patients', data.patientId, 'histories'), data);
        return { id: docRef.id, ...data } as InitialHistory;
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
            const combined = [...subDocs, ...rootDocs].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
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

    createConsult: async (data: Omit<SubsequentConsult, 'id'>): Promise<SubsequentConsult> => {
        const docRef = await addDoc(collection(db, 'patients', data.patientId, 'consults'), data);
        return { id: docRef.id, ...data } as SubsequentConsult;
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
