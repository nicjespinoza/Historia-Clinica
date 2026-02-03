
export interface OfflineAction {
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retryCount: number;
}

const STORAGE_KEY = 'offline_queue_v1';
// Privileged roles that can use offline mode (no hardcoded emails)
const ALLOWED_ROLES = ['doctor', 'admin', 'assistant'];

class OfflineQueueManager {

    /**
     * Verifica si el usuario actual tiene permisos para usar el modo offline
     * @param userRole - Role del usuario desde AuthContext (no email)
     */
    canUseOfflineMode(userRole: string | null): boolean {
        if (!userRole) return false;
        return ALLOWED_ROLES.includes(userRole);
    }

    /**
     * Guarda una acción en la cola offline
     */
    enqueueAction(actionType: string, data: any, userEmail: string | null) {
        if (!this.canUseOfflineMode(userEmail)) {
            console.warn('Offline mode not allowed for this user');
            return;
        }

        const queue = this.getQueue();
        const newAction: OfflineAction = {
            id: crypto.randomUUID(),
            type: actionType,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };

        queue.push(newAction);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

        // Dispatch event to update UI immediately
        window.dispatchEvent(new Event('offline-queue-changed'));
    }

    /**
     * Obtiene la cola actual
     */
    getQueue(): OfflineAction[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error reading offline queue', e);
            return [];
        }
    }

    /**
     * Elimina una acción de la cola (al completarse)
     */
    removeAction(id: string) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('offline-queue-changed'));
    }

    /**
     * Limpia toda la cola
     */
    clearQueue() {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('offline-queue-changed'));
    }
}

export const offlineQueue = new OfflineQueueManager();
