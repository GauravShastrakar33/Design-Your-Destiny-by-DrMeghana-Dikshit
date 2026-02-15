import { Capacitor } from "@capacitor/core";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  Wind,
  ListMusic,
  IndianRupee,
  CheckSquare,
  Bell,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Flame,
  ChevronRight,
  GraduationCap,
  TrendingUp,
  Quote,
  Feather,
  LayoutGrid,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import SearchOverlay from "@/components/SearchOverlay";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEvaluateBadgesOnMount } from "@/hooks/useBadges";
import { BadgeToastManager } from "@/components/BadgeEarnedToast";
import { fetchUnreadCount } from "@/lib/notificationState";
import { useAuth } from "@/contexts/AuthContext";

interface BannerData {
  banner: {
    id: number;
    type: "session" | "advertisement";
    thumbnailUrl: string | null;
    videoUrl: string | null;
    posterUrl: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    liveEnabled: boolean;
  } | null;
  status: "active" | "scheduled" | "expired" | "none";
}

interface StreakDay {
  date: string;
  active: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function HomePage() {
  const isNative = Capacitor.isNativePlatform();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [practiceProgress] = useState({ current: 15, total: 30 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [markAttempted, setMarkAttempted] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeEvaluated, setBadgeEvaluated] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    };

    // Initial load when Home opens
    loadUnread();

    // 🔔 Listen for live updates (push received)
    window.addEventListener("unread-changed", loadUnread);

    return () => {
      window.removeEventListener("unread-changed", loadUnread);
    };
  }, []);

  const { evaluate } = useEvaluateBadgesOnMount({
    onNewBadges: (badgeKeys) => {
      setNewBadges(badgeKeys);
    },
  });

  const { data: bannerData, isLoading: isBannerLoading } = useQuery<BannerData>(
    {
      queryKey: ["/api/public/v1/session-banner"],
    }
  );

  // Fetch today's daily quote
  const { data: quoteData } = useQuery<{
    quote: string | null;
    author: string | null;
  }>({
    queryKey: ["/api/quotes/today"],
  });

  // Check if user is authenticated
  const { isAuthenticated } = useAuth();

  // Fetch streak data - only when authenticated
  const { data: streakData } = useQuery<StreakDay[]>({
    queryKey: ["/api/v1/streak/last-7-days"],
    enabled: isAuthenticated,
  });

  // Mark today mutation
  const markTodayMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/v1/streak/mark-today");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/v1/streak/last-7-days"],
      });
    },
    onError: (error) => {
      console.error("Failed to mark streak:", error);
    },
  });

  // Mark today on page load (only once per session, only if authenticated)
  useEffect(() => {
    if (!markAttempted && isAuthenticated) {
      setMarkAttempted(true);
      markTodayMutation.mutate();
    }
  }, [markAttempted, isAuthenticated]);

  // Evaluate badges on mount (only once per session)
  useEffect(() => {
    if (!badgeEvaluated && isAuthenticated) {
      setBadgeEvaluated(true);
      evaluate();
    }
  }, [badgeEvaluated, isAuthenticated, evaluate]);

  // Update user timezone on mount
  useEffect(() => {
    const updateTimezone = async () => {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await apiRequest("PUT", "/api/v1/user/timezone", {
          timezone: userTimezone,
        });
        console.log(`Timezone updated to: ${userTimezone}`);
      } catch (error) {
        console.error("Failed to update timezone:", error);
      }
    };
    if (isAuthenticated) {
      updateTimezone();
    }
  }, [isAuthenticated]);

  const banner = bannerData?.banner;
  const bannerStatus = bannerData?.status;

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const actionCards = [
    {
      title: "My Playlist",
      icon: ListMusic,
      path: "/playlist",
      testId: "card-my-playlist",
      color: "from-blue-500/10 to-blue-600/10",
      iconColor: "text-blue-600",
    },
    {
      title: "All Processes",
      icon: Sparkles,
      path: "/processes",
      testId: "card-processes",
      color: "from-purple-500/10 to-purple-600/10",
      iconColor: "text-purple-600",
    },
    {
      title: "Community Practices",
      icon: Users,
      path: "/community-practices",
      testId: "card-community-practices",
      color: "from-emerald-500/10 to-emerald-600/10",
      iconColor: "text-emerald-600",
    },
    {
      title: "Daily Abundance",
      icon: IndianRupee,
      path: "/money-mastery",
      testId: "card-money-mastery",
      color: "from-amber-500/10 to-amber-600/10",
      iconColor: "text-amber-600",
    },
    {
      title: "Masterclasses",
      icon: GraduationCap,
      path: "/masterclasses",
      testId: "card-masterclasses",
      fullWidth: true,
      color: "from-brand/10 to-brand/20",
      iconColor: "text-brand",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans text-slate-800">
      {/* Badge Earned Toast */}
      <BadgeToastManager
        newBadges={newBadges}
        onAllDismissed={() => setNewBadges([])}
      />

      <div className="w-full mx-auto min-h-screen flex flex-col max-w-5xl transition-all duration-300">
        {/* Header Section - Refined Glassmorphism */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-all">
          <div className="flex-1">
            <h1 className="text-xl sm:text-xl font-bold text-slate-900 tracking-tight">
              Hello, Designer{" "}
              <span className="inline-block animate-pulse origin-bottom">
                ✨
              </span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 mt-0.5">
              Ready to design your destiny?
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:text-brand transition-all active:scale-90"
              data-testid="button-search"
            >
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div className="relative">
              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:text-brand transition-all active:scale-90"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" strokeWidth={2.5} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white shadow-lg animate-in zoom-in">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main Content with Entrance Animations */}
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 w-full px-4 py-6 space-y-6"
        >
          {/* Hero Banner Section */}
          <motion.section variants={itemVariants} className="w-full">
            {isBannerLoading ? (
              <Skeleton className="w-full aspect-[16/9] rounded-xl shadow-xl shadow-black/[0.03]" />
            ) : (
              banner && (
                <div className="relative group">
                  <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl shadow-black/[0.05] bg-slate-100 ring-1 ring-black/5">
                    {banner.type === "advertisement" && banner.videoUrl ? (
                      <>
                        <video
                          ref={videoRef}
                          src={banner.videoUrl}
                          poster={banner.posterUrl || undefined}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          data-testid="video-banner"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                          <button
                            onClick={toggleMute}
                            className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 text-white transition-all active:scale-90"
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={toggleVideoPlayback}
                            className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 text-white transition-all active:scale-90"
                          >
                            {isVideoPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      banner.thumbnailUrl && (
                        <>
                          <img
                            src={banner.thumbnailUrl}
                            alt="Banner"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            data-testid="img-banner"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          {banner.type === "session" &&
                            banner.liveEnabled &&
                            bannerStatus === "active" && (
                              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-full shadow-xl animate-pulse">
                                <span className="h-2 w-2 bg-white rounded-full"></span>
                                <span className="text-xs font-black text-white uppercase tracking-widest">
                                  Live Now
                                </span>
                              </div>
                            )}
                        </>
                      )
                    )}
                  </div>

                  {banner.ctaText &&
                    banner.ctaLink &&
                    banner.ctaLink.trim() !== "" && (
                      <div className="absolute -bottom-5 inset-x-0 flex justify-center z-10 px-10">
                        <button
                          onClick={() =>
                            banner.ctaLink &&
                            window.open(banner.ctaLink, "_blank")
                          }
                          className="w-full max-w-[200px] h-11 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/30 bg-brand text-white hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white"
                        >
                          {banner.ctaText}
                        </button>
                      </div>
                    )}
                </div>
              )
            )}
          </motion.section>

          {/* Quick Actions Grid - App Style */}
          <motion.section variants={itemVariants} className="space-y-5 pt-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm md:text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {actionCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => setLocation(card.path)}
                  className={`group relative flex items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-300 active:scale-95 text-left overflow-hidden ${
                    card.fullWidth ? "col-span-2" : ""
                  }`}
                  data-testid={card.testId}
                >
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-500 shrink-0`}
                  >
                    <card.icon
                      className={`w-4 h-4 md:w-5 md:h-5 ${card.iconColor}`}
                      strokeWidth={2}
                    />
                  </div>
                  <span className="flex-1 text-sm md:text-lg font-bold text-slate-800 leading-tight line-clamp-2 pr-1">
                    {card.title}
                  </span>
                  <div className="text-slate-400 group-hover:text-brand transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </button>
              ))}
            </div>
          </motion.section>

          {/* Journey Section - Dashboard Style */}
          <motion.section variants={itemVariants} className="space-y-5">
            <h2 className="text-sm md:text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-brand" />
              Your Progress
            </h2>

            <div className="flex flex-col gap-6">
              {/* Streak Card */}
              {isAuthenticated && (
                <div
                  className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden"
                  data-testid="card-streak"
                >
                  <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 bg-orange-500/5 rounded-full blur-3xl w-32 h-32 pointer-events-none" />

                  <div className="flex items-center justify-between mb-6 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-50 rounded-xl">
                        <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500 fill-orange-500/20" />
                      </div>
                      <div>
                        <span className="block text-sm md:text-lg font-bold text-slate-900">
                          7 Day Streak
                        </span>
                        <span className="text-xs md:text-sm font-medium text-slate-500">
                          Keep the momentum going!
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-100">
                      <span className="text-xs md:text-sm font-bold text-slate-700">
                        {streakData
                          ? `${streakData.filter((d) => d.active).length}/7`
                          : "0/7"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end gap-2 relative">
                    {(
                      streakData || Array(7).fill({ date: "", active: false })
                    ).map((day, index) => {
                      const dayDate = day.date
                        ? new Date(day.date + "T12:00:00")
                        : new Date();
                      const dayName = day.date
                        ? dayDate
                            .toLocaleDateString("en-US", { weekday: "short" })
                            .charAt(0)
                        : ["M", "T", "W", "T", "F", "S", "S"][index];
                      const isToday =
                        day.date === new Date().toISOString().split("T")[0];

                      return (
                        <div
                          key={day.date || index}
                          className="flex flex-col items-center gap-2 flex-1"
                          data-testid={`streak-day-${index}`}
                        >
                          <div
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                              day.active
                                ? "bg-gradient-to-b from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 scale-100"
                                : "bg-slate-50 border border-slate-400 scale-90"
                            } ${
                              isToday
                                ? "ring-2 ring-orange-400 ring-offset-2"
                                : ""
                            }`}
                          >
                            {day.active ? (
                              <Flame
                                className="w-4 h-4 md:w-5 md:h-5 text-white"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-400" />
                            )}
                          </div>
                          <span
                            className={`text-xs md:text-sm font-bold tracking-wide ${
                              day.active ? "text-orange-600" : "text-slate-500"
                            }`}
                          >
                            {dayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Progress Insights Card - Hero Style */}
              {isAuthenticated && (
                <button
                  onClick={() => setLocation("/progress-insights")}
                  className="w-full group relative overflow-hidden bg-brand rounded-2xl p-6 shadow-xl shadow-brand/20 hover:shadow-brand/30 transition-all duration-500 active:scale-95 border border-white/10"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />

                  <div className="relative flex items-center justify-between z-10">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <TrendingUp
                          className="w-6 h-6 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-white">
                          Progress Insights
                        </h3>
                        <p className="text-xs md:text-sm font-semibold text-white/70 tracking-wide mt-1">
                          Track your daily growth and milestones
                        </p>
                      </div>
                    </div>
                    <div>
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                </button>
              )}
            </div>
          </motion.section>

          {/* Daily Quote Section - Minimalist Premium */}
          {quoteData?.quote && (
            <div
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-200 overflow-hidden text-center"
              data-testid="card-quote"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-brand/[0.2]" />
              <div className="absolute -top-6 -right-6 opacity-[0.04] transform rotate-12 group-hover:rotate-6 transition-transform duration-1000">
                <Feather className="w-48 h-48 text-slate-900" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand/5 flex items-center justify-center ring-4 ring-white shadow-sm">
                    <Quote className="w-5 h-5 md:w-6 md:h-6 text-brand fill-brand/20" />
                  </div>
                </div>
                <p className="text-slate-700 text-lg md:text-xl leading-relaxed font-normal mb-5 px-3">
                  "{quoteData.quote}"
                </p>
                {quoteData.author && (
                  <div className="flex items-center justify-center gap-4">
                    <span className="h-px w-12 bg-gradient-to-r from-transparent to-slate-500 " />
                    <p className="text-slate-500 text-xs md:text-sm font-bold tracking-[0.2em]">
                      {quoteData.author}
                    </p>
                    <span className="h-px w-12 bg-gradient-to-r from-slate-500 to-transparent" />
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.main>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
