import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/BadgeIcon";
import { BADGE_REGISTRY, type BadgeDefinition } from "@/lib/badgeRegistry";
import { Loader2, Award, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function BadgesPage() {
  const [, setLocation] = useLocation();
  const { badgeKeys, isLoading } = useBadges();

  const earnedSet = new Set(badgeKeys);

  const coreBadges = BADGE_REGISTRY.filter((b) => b.type === "core");
  const metaBadges = BADGE_REGISTRY.filter((b) => b.type === "meta");
  const adminBadges = BADGE_REGISTRY.filter((b) => b.type === "admin");

  const renderBadgeCard = (badge: BadgeDefinition, index: number) => {
    const isEarned = earnedSet.has(badge.key);

    return (
      <motion.div
        key={badge.key}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card
          className={`flex items-center gap-4 p-5 rounded-3xl border-0 shadow-sm transition-all duration-300 ${
            isEarned
              ? "bg-white ring-1 ring-indigo-50 shadow-indigo-100/50"
              : "bg-white opacity-100 ring-1 ring-gray-100/40"
          }`}
          data-testid={`badge-card-${badge.key}`}
        >
          <div className="relative">
            {!isEarned && (
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-full z-10" />
            )}
            <BadgeIcon
              badgeKey={badge.key}
              size="xl"
              earned={isEarned}
              className={
                isEarned ? "scale-105" : "grayscale opacity-40 scale-100"
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`font-bold text-base leading-none tracking-tight truncate ${
                  isEarned ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {badge.displayName}
              </h3>
              {isEarned && <Sparkles className="w-3.5 h-3.5 text-brand/60" />}
            </div>

            <p
              className={`text-xs mt-1 font-medium line-clamp-2 ${
                isEarned ? "text-gray-600" : "text-gray-400/80"
              }`}
            >
              {badge.meaning}
            </p>

            {!isEarned && (
              <div className="flex items-center gap-1.5 mt-2 bg-gray-100/50 w-fit px-2 py-0.5 rounded-full border border-gray-200/50">
                <Lock className="w-2.5 h-2.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  Locked
                </span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F9FAFB]">
      <Header
        title="Milestone Badges"
        hasBackButton={true}
        onBack={() => setLocation("/profile")}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
            <p className="text-gray-400 font-bold text-sm tracking-wide">
              Gathering achievements...
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Header Description */}
            <div className="text-center max-w-lg mx-auto mb-4">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-brand mb-4 border border-indigo-100 shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                Your Milestone Journey
              </h1>
              <p className="text-gray-500 font-medium text-sm leading-relaxed px-4">
                Collect badges as you progress through your transformation. Each
                one represents a significant step in your destiny.
              </p>
            </div>

            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-4 w-1 bg-brand rounded-full" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Journey Badges
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coreBadges.map((badge, idx) => renderBadgeCard(badge, idx))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-4 w-1 bg-emerald-400 rounded-full" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Consistency Milestones
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metaBadges.map((badge, idx) => renderBadgeCard(badge, idx))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-4 w-1 bg-amber-400 rounded-full" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Special Recognition
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adminBadges.map((badge, idx) => renderBadgeCard(badge, idx))}
              </div>
            </section>

            {/* Slogan Footer */}
            <div className="flex flex-col items-center gap-2 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                  Design Your Destiny
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
