import { getBadgeByKey, getBadgeSvgPath } from "@/lib/badgeRegistry";

interface BadgeIconProps {
  badgeKey: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  earned?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
  "2xl": "w-32 h-32",
};

export function BadgeIcon({
  badgeKey,
  size = "md",
  earned = true,
  showTooltip = false,
  className = "",
}: BadgeIconProps) {
  const badge = getBadgeByKey(badgeKey);
  const svgPath = getBadgeSvgPath(badgeKey);

  return (
    <div
      className={`relative ${sizeMap[size]} ${className}`}
      title={
        showTooltip && badge
          ? `${badge.displayName}: ${badge.meaning}`
          : undefined
      }
      data-testid={`badge-icon-${badgeKey}`}
    >
      <img
        src={svgPath}
        alt={badge?.displayName || badgeKey}
        className={`w-full h-full object-contain transition-all ${
          earned ? "" : "grayscale opacity-50"
        }`}
      />
    </div>
  );
}
