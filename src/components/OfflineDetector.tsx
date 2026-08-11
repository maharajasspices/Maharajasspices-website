import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OfflineDetector = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Ping a tiny resource to verify real connectivity
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-store',
      });
      if (response.ok) {
        setIsOffline(false);
        window.location.reload();
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      // Verify with an actual fetch before declaring online
      checkConnection();
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [checkConnection]);

  // Auto-retry every 5 seconds when offline
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      checkConnection();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOffline, checkConnection]);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You're Offline</h1>
        <p className="text-muted-foreground mb-6">
          It looks like you've lost your internet connection. We'll automatically reconnect when your connection is restored.
        </p>
        <Button
          onClick={checkConnection}
          disabled={isChecking}
          className="gap-2"
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Retry Now'}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Auto-retrying every 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default OfflineDetector;
