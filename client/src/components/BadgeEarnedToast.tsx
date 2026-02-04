import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { X, Trophy } from "lucide-react";
import { BadgeIcon } from "./BadgeIcon";
import { getBadgeByKey, getBadgeSvgPath } from "@/lib/badgeRegistry";
import { useLocation } from "wouter";

const confettiStylesInjected = { current: false };

function injectConfettiStyles() {
  if (confettiStylesInjected.current) return;
  confettiStylesInjected.current = true;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes confetti-burst {
      0% {
        transform: translate(0, 0) scale(1) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translate(var(--x), var(--y)) scale(0) rotate(var(--r));
        opacity: 0;
      }
    }
    @keyframes badge-gentle-rotate {
      0%, 100% { transform: perspective(1000px) rotateY(-15deg); }
      50% { transform: perspective(1000px) rotateY(15deg); }
    }
    @keyframes toast-shimmer {
      0% { transform: translateX(-150%) skewX(-20deg); }
      100% { transform: translateX(150%) skewX(-20deg); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
}

interface BadgeEarnedToastProps {
  badgeKey: string;
  onDismiss: () => void;
}

function ConfettiParticle({ delay, index }: { delay: number; index: number }) {
  const side = index % 2 === 0 ? "left" : "right";
  const colors = [
    "#FFD700",
    "#703DFA",
    "#5FB77D",
    "#FF6B6B",
    "#4ECDC4",
    "#FF1493",
    "#00BFFF",
  ];
  const color = colors[index % colors.length];
  const size = 10 + Math.random() * 12;

  // Burst from bottom corners towards the center
  const baseAngle = side === "left" ? -Math.PI / 3 : (-2 * Math.PI) / 3;
  const angle = baseAngle + (Math.random() - 0.5) * 0.4;
  const velocity = 250 + Math.random() * 300;
  const x = Math.cos(angle) * velocity;
  const y = Math.sin(angle) * velocity;
  const rotation = 360 + Math.random() * 720;

  const duration = 4 + Math.random() * 2;

  return (
    <div
      className={`absolute pointer-events-none z-50 bottom-0 ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: index % 3 === 0 ? "50%" : "2px",
          "--x": `${x}px`,
          "--y": `${y}px`,
          "--r": `${rotation}deg`,
          animation: `confetti-burst ${duration}s cubic-bezier(0.1, 0.8, 0.3, 1) ${delay}s infinite`,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        } as any
      }
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.4,
  }));

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} index={p.id} />
      ))}
    </div>
  );
}

export function BadgeEarnedToast({
  badgeKey,
  onDismiss,
}: BadgeEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const badge = getBadgeByKey(badgeKey);
  const [, setLocation] = useLocation();

  useEffect(() => {
    injectConfettiStyles();

    // Preload image
    const img = new Image();
    img.src = getBadgeSvgPath(badgeKey);

    let entryTimeout: ReturnType<typeof setTimeout>;

    img.onload = () => {
      setIsLoaded(true);
      entryTimeout = setTimeout(() => {
        setIsVisible(true);
        setShowConfetti(true);
      }, 100);
    };

    return () => {
      if (entryTimeout) clearTimeout(entryTimeout);
    };
  }, [badgeKey]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  const handleToastClick = () => {
    handleClose();
    setLocation("/badges");
  };

  if (!badge || !isLoaded) return null;

  return (
    <>
      {/* Backdrop Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed z-[70] left-1/2 transition-all duration-500 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
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
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 p-8 cursor-pointer relative overflow-hidden group"
          onClick={handleToastClick}
          style={{
            animation: isVisible ? "float 5s ease-in-out infinite" : "none",
          }}
          data-testid="badge-earned-toast"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ animation: "toast-shimmer 4s infinite linear" }}
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-5 right-5 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors z-10"
            data-testid="button-dismiss-badge-toast"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 text-amber-500">
              <Trophy className="w-5 h-5 fill-amber-500/20" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                Badge Unlocked
              </span>
              <Trophy className="w-5 h-5 fill-amber-500/20" />
            </div>

            <div
              className="mb-8 relative flex justify-center items-center"
              style={{
                animation: "badge-gentle-rotate 4s ease-in-out infinite",
              }}
            >
              <div className="absolute inset-0 bg-brand/15 blur-3xl rounded-full scale-125 animate-pulse" />
              <BadgeIcon
                badgeKey={badgeKey}
                size="xl"
                earned
                className="w-32 h-32 relative z-10 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)]"
              />
            </div>

            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              {badge.displayName}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px] font-medium">
              {badge.meaning}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-[10px] font-bold text-brand uppercase tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                Tap to keep exploring
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface BadgeToastManagerProps {
  newBadges: string[];
  onAllDismissed?: () => void;
}

export function BadgeToastManager({
  newBadges,
  onAllDismissed,
}: BadgeToastManagerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [batchVersion, setBatchVersion] = useState(0);
  const prevBadgesRef = useRef<string[]>([]);

  useLayoutEffect(() => {
    if (newBadges !== prevBadgesRef.current) {
      prevBadgesRef.current = newBadges;
      if (newBadges.length > 0) {
        setCurrentIndex(0);
        setBatchVersion((v) => v + 1);
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
