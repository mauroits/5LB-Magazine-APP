import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-xl animate-bounce">
      <WifiOff className="w-5 h-5 shrink-0" />
      <div>
        <p className="font-semibold text-xs uppercase tracking-wider">Modalità Offline</p>
        <p className="text-xs text-amber-100">
          Sei offline. Stai consultando i contenuti e articoli salvati in cache.
        </p>
      </div>
    </div>
  );
};
