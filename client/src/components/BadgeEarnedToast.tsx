import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { BadgeIcon } from "./BadgeIcon";
import { getBadgeByKey } from "@/lib/badgeRegistry";

interface BadgeEarnedToastProps {
  badgeKey: string;
  onDismiss: () => void;
}

export function BadgeEarnedToast({ badgeKey, onDismiss }: BadgeEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const badge = getBadgeByKey(badgeKey);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!badge) return null;

  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      data-testid="badge-earned-toast"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 max-w-sm">
        <BadgeIcon badgeKey={badgeKey} size="md" earned />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            You earned {badge.displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {badge.meaning}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          data-testid="button-dismiss-badge-toast"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

interface BadgeToastManagerProps {
  newBadges: string[];
  onAllDismissed?: () => void;
}

export function BadgeToastManager({ newBadges, onAllDismissed }: BadgeToastManagerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [batchVersion, setBatchVersion] = useState(0);
  const prevBadgesRef = useRef<string[]>([]);

  useLayoutEffect(() => {
    if (newBadges !== prevBadgesRef.current) {
      prevBadgesRef.current = newBadges;
      if (newBadges.length > 0) {
        setCurrentIndex(0);
        setBatchVersion(v => v + 1);
      }
    }
  }, [newBadges]);

  const handleDismiss = () => {
    if (currentIndex < newBadges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onAllDismissed) {
      onAllDismissed();
    }
  };

  if (newBadges.length === 0) {
    return null;
  }

  const safeIndex = Math.min(currentIndex, newBadges.length - 1);
  const currentBadge = newBadges[safeIndex];

  return (
    <BadgeEarnedToast 
      key={`${batchVersion}-${currentBadge}-${safeIndex}`}
      badgeKey={currentBadge} 
      onDismiss={handleDismiss} 
    />
  );
}
