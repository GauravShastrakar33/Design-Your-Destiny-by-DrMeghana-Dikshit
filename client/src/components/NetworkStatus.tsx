import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkStatusProps {
  children: React.ReactNode;
}

export default function NetworkStatus({ children }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Network: Back online");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("📴 Network: Offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      const response = await fetch("/api/health", { 
        method: "HEAD",
        cache: "no-store" 
      });
      
      if (response.ok) {
        setIsOnline(true);
      }
    } catch (error) {
      console.log("📴 Still offline");
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOnline) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        data-testid="offline-screen"
      >
        <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-offline-title">
              No Internet Connection
            </h1>
            <p className="text-muted-foreground" data-testid="text-offline-description">
              Please check your internet connection and try again.
            </p>
          </div>

          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-[#703DFA] hover:bg-[#5c31d4] text-white gap-2"
            data-testid="button-retry-connection"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
