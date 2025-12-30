import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/BadgeIcon";
import { BADGE_REGISTRY, type BadgeDefinition } from "@/lib/badgeRegistry";
import { Loader2 } from "lucide-react";

export default function BadgesPage() {
  const [, setLocation] = useLocation();
  const { badgeKeys, isLoading } = useBadges();

  const earnedSet = new Set(badgeKeys);

  const coreBadges = BADGE_REGISTRY.filter(b => b.type === "core");
  const metaBadges = BADGE_REGISTRY.filter(b => b.type === "meta");
  const adminBadges = BADGE_REGISTRY.filter(b => b.type === "admin");

  const renderBadgeCard = (badge: BadgeDefinition) => {
    const isEarned = earnedSet.has(badge.key);
    
    return (
      <div 
        key={badge.key}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 ${
          isEarned ? "border border-purple-200 dark:border-purple-800" : "border border-gray-200 dark:border-gray-700"
        }`}
        data-testid={`badge-card-${badge.key}`}
      >
        <div className="flex items-start gap-4">
          <BadgeIcon 
            badgeKey={badge.key} 
            size="lg" 
            earned={isEarned} 
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${
              isEarned ? "text-foreground" : "text-muted-foreground"
            }`}>
              {badge.displayName}
            </h3>
            <p className={`text-sm ${
              isEarned ? "text-foreground/80" : "text-muted-foreground"
            }`}>
              {badge.meaning}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {badge.howToEarn}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="bg-white border-b py-4 px-4 sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => setLocation("/profile")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            data-testid="button-back-from-badges"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center mr-10">
            <h1 className="text-xl font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase">
              BADGES
            </h1>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-md mx-auto px-4 py-6 space-y-8">
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Journey Badges
            </h2>
            <div className="space-y-3">
              {coreBadges.map(renderBadgeCard)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Milestone Badges
            </h2>
            <div className="space-y-3">
              {metaBadges.map(renderBadgeCard)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Special Recognition
            </h2>
            <div className="space-y-3">
              {adminBadges.map(renderBadgeCard)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
