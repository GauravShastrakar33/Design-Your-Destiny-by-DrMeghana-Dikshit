import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { X, Trophy } from "lucide-react";
import { BadgeIcon } from "./BadgeIcon";
import { getBadgeByKey } from "@/lib/badgeRegistry";
import { useLocation } from "wouter";

const confettiStylesInjected = { current: false };

function injectConfettiStyles() {
  if (confettiStylesInjected.current) return;
  confettiStylesInjected.current = true;
  
  const style = document.createElement("style");
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translateY(300px) rotate(720deg);
      }
    }
    @keyframes badge-pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `;
  document.head.appendChild(style);
}

interface BadgeEarnedToastProps {
  badgeKey: string;
  onDismiss: () => void;
}

function ConfettiParticle({ delay, left }: { delay: number; left: number }) {
  const colors = ["#703DFA", "#5FB77D", "#E5AC19", "#FF6B6B", "#4ECDC4"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: "-10px",
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        transform: `rotate(${rotation}deg)`,
        animation: `confetti-fall 2s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.3,
    left: 10 + Math.random() * 80,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} left={p.left} />
      ))}
    </div>
  );
}

export function BadgeEarnedToast({ badgeKey, onDismiss }: BadgeEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const badge = getBadgeByKey(badgeKey);
  const [, setLocation] = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    injectConfettiStyles();
    
    setTimeout(() => {
      setIsVisible(true);
      setShowConfetti(true);
    }, 50);
    
    timerRef.current = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  const handleToastClick = () => {
    handleClose();
    setLocation("/badges");
  };

  if (!badge) return null;

  return (
    <div 
      className={`fixed z-50 left-1/2 transition-all duration-300 ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 -translate-y-4"
      }`}
      style={{ 
        width: 340,
        top: "15%",
        transform: "translateX(-50%)",
      }}
      data-testid="badge-celebration-overlay"
    >
      {showConfetti && <Confetti />}
      
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer relative overflow-hidden"
        onClick={handleToastClick}
        data-testid="badge-earned-toast"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
          data-testid="button-dismiss-badge-toast"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2 text-amber-500">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Badge Unlocked
            </span>
            <Trophy className="w-5 h-5" />
          </div>

          <div 
            className="mb-4"
            style={{ animation: "badge-pulse 2s ease-in-out infinite" }}
          >
            <BadgeIcon badgeKey={badgeKey} size="lg" earned className="w-24 h-24" />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            {badge.displayName}
          </h3>

          <p className="text-sm text-muted-foreground max-w-[280px]">
            {badge.meaning}
          </p>

          <p className="mt-3 text-xs text-muted-foreground/70">
            Tap to view all badges
          </p>
        </div>
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
