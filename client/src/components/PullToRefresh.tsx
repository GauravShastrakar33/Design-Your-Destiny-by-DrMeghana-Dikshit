import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  containerRef: React.RefObject<HTMLElement>;
}

const PULL_THRESHOLD = 90;
const REFRESH_HEIGHT = 70;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  containerRef,
}) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isCaptured = useRef(false);
  const queryClient = useQueryClient();

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 5 || refreshing) return;

    startY.current = e.touches[0].pageY;
    isCaptured.current = false;
    setPulling(true);
  }, [containerRef, refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return;

    const currentY = e.touches[0].pageY;
    const distance = currentY - startY.current;

    // We only capture if at the top and moving down
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      if (!isCaptured.current && distance > 5) {
        isCaptured.current = true;
      }

      if (isCaptured.current) {
        // Logarithmic-like resistance
        const resistedDistance = Math.pow(distance, 0.85) * 1.5;
        const boundedDistance = Math.min(resistedDistance, PULL_THRESHOLD + 40);
        
        setPullDistance(boundedDistance);

        if (e.cancelable) {
          e.preventDefault();
        }
      }
    } else if (distance < 0 && !isCaptured.current) {
      setPulling(false);
    }
  }, [pulling, refreshing, containerRef]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling || refreshing) {
      setPulling(false);
      isCaptured.current = false;
      return;
    }

    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(REFRESH_HEIGHT);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          await queryClient.invalidateQueries();
        }
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
          setPulling(false);
          isCaptured.current = false;
        }, 800);
      }
    } else {
      setPullDistance(0);
      setPulling(false);
      isCaptured.current = false;
    }
  }, [pulling, refreshing, pullDistance, onRefresh, queryClient]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const opt = { passive: false }; 
    const passiveOpt = { passive: true };

    container.addEventListener("touchstart", handleTouchStart, passiveOpt);
    container.addEventListener("touchmove", handleTouchMove, opt);
    container.addEventListener("touchend", handleTouchEnd, passiveOpt);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Use translateY only when active to avoid breaking position:fixed on children during normal scroll
  const showTransform = pulling || refreshing || pullDistance > 0;

  return (
    <div className="relative w-full min-h-full">
      {/* Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 pointer-events-none z-[100]" 
        style={{ height: REFRESH_HEIGHT, transform: `translateY(-${REFRESH_HEIGHT}px)` }}
      >
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={{ 
            translateY: pullDistance,
            opacity: pullDistance > 10 ? 1 : 0,
            scale: refreshing ? 1.1 : Math.min(0.5 + pullDistance / PULL_THRESHOLD, 1)
          }}
          transition={refreshing ? { type: "spring", stiffness: 300, damping: 30 } : { type: "tween", ease: "linear", duration: 0 }}
        >
          <div className="flex items-center justify-center mt-4">
            <Loader2 
              className={`w-6 h-6 text-brand/50 ${refreshing ? "animate-spin" : ""}`} 
              style={{ 
                transform: refreshing ? undefined : `rotate(${pullDistance * 4}deg)`,
                opacity: refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1)
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Content Container */}
      <motion.div
        className="w-full min-h-full will-change-transform"
        animate={showTransform ? { y: refreshing ? REFRESH_HEIGHT : pullDistance } : { y: 0 }}
        transition={refreshing || (!pulling && pullDistance === 0) ? { type: "spring", stiffness: 260, damping: 26 } : { type: "tween", duration: 0 }}
        style={{ 
          transform: showTransform ? undefined : 'none',
          WebkitTransform: showTransform ? undefined : 'none'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
