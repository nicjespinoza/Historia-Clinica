import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { offlineQueue } from '../../lib/offlineQueue';
import { api } from '../../lib/api';

export const NetworkStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);
    // New state for sync
    const [pendingActions, setPendingActions] = useState(offlineQueue.getQueue().length);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOnlineMessage(true);
            // Hide "Back Online" message after 5 seconds if no pending actions
            const queueLength = offlineQueue.getQueue().length;
            if (queueLength === 0) {
                setTimeout(() => setShowOnlineMessage(false), 5000);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOnlineMessage(false);
        };

        const updateQueueStatus = () => {
            setPendingActions(offlineQueue.getQueue().length);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('offline-queue-changed', updateQueueStatus);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('offline-queue-changed', updateQueueStatus);
        };
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        const queue = offlineQueue.getQueue();

        // Process queue sequentially
        for (const action of queue) {
            try {
                // Determine API method based on action type
                switch (action.type) {
                    case 'CREATE_HISTORY':
                        await api.createHistory(action.data);
                        break;
                    case 'CREATE_CONSULT':
                        await api.createConsult(action.data);
                        break;
                    case 'CREATE_APPOINTMENT':
                        await api.createAppointment(action.data);
                        break;
                }
                // Determine success and remove
                offlineQueue.removeAction(action.id);
            } catch (e) {
                console.error(`Failed to sync action ${action.id}`, e);
                // Keep in queue? Or move to dead letter? For now keep to retry later.
            }
        }

        setIsSyncing(false);
        setPendingActions(offlineQueue.getQueue().length);
        // Hide if empty
        if (offlineQueue.getQueue().length === 0) {
            setTimeout(() => setShowOnlineMessage(false), 3000);
        }
    };

    if (isOnline && !showOnlineMessage && pendingActions === 0) return null;

    return (
        <div className={`fixed bottom-4 left-4 z-[9999] transition-all duration-500 transform ${isOnline && !showOnlineMessage && pendingActions === 0 ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div className={`flex flex-col gap-2 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-colors duration-300 ${isOnline
                ? (pendingActions > 0 ? 'bg-blue-600/95 border-blue-500 text-white' : 'bg-green-500/90 border-green-400 text-white')
                : 'bg-amber-500/90 border-amber-400 text-white animate-pulse'
                }`}>

                <div className="flex items-center gap-3">
                    {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                    <span className="font-bold text-sm">
                        {!isOnline ? 'Modo Sin Conexión (Guardando localmente)' :
                            pendingActions > 0 ? `Conexión Restablecida - ${pendingActions} ítems pendientes` :
                                'Conexión Restablecida'}
                    </span>
                </div>

                {/* Sync Button */}
                {isOnline && pendingActions > 0 && (
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="mt-1 w-full bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSyncing ? (
                            <>Sincronizando...</>
                        ) : (
                            <>Guardar Datos Pendientes ({pendingActions})</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
