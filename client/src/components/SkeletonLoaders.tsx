import { motion } from "framer-motion";

/** ✨ Smooth CSS-based skeleton loader to improve perceived speed. */
export const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200/80 rounded-lg ${className}`} />
);

/** Hero banner skeleton for HomePage */
export const BannerSkeleton = () => (
  <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] rounded-3xl overflow-hidden bg-white shadow-xl p-2 sm:p-3">
    <SkeletonPulse className="w-full h-full rounded-2xl" />
    <div className="absolute inset-0 p-8 flex flex-col justify-end gap-3">
      <SkeletonPulse className="w-48 h-8 rounded-lg" />
      <SkeletonPulse className="w-32 h-4 rounded-md" />
    </div>
  </div>
);

/** Grid item skeleton for lists and grids */
export const CardSkeleton = () => (
  <div className="p-4 rounded-2xl bg-white shadow-sm space-y-3">
    <SkeletonPulse className="w-full aspect-video rounded-xl" />
    <div className="space-y-2">
      <SkeletonPulse className="w-3/4 h-5" />
      <SkeletonPulse className="w-1/2 h-4" />
    </div>
  </div>
);

/** List row skeleton */
export const RowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-gray-100">
    <SkeletonPulse className="w-12 h-12 rounded-xl" />
    <div className="flex-1 space-y-2">
      <SkeletonPulse className="w-1/3 h-4" />
      <SkeletonPulse className="w-1/4 h-3" />
    </div>
  </div>
);
