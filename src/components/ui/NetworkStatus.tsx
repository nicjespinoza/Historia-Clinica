import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOnlineMessage(true);
            // Hide "Back Online" message after 3 seconds
            setTimeout(() => setShowOnlineMessage(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOnlineMessage(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showOnlineMessage) return null;

    return (
        <div className={`fixed bottom-4 left-4 z-[9999] transition-all duration-500 transform ${isOnline && !showOnlineMessage ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg border backdrop-blur-md ${isOnline
                    ? 'bg-green-500/90 border-green-400 text-white'
                    : 'bg-amber-500/90 border-amber-400 text-white animate-pulse'
                }`}>
                {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                <span className="font-bold text-sm">
                    {isOnline ? 'Conexión Restablecida' : 'Modo Sin Conexión (Guardando localmente)'}
                </span>
            </div>
        </div>
    );
};
