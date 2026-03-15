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
  Gem,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import SearchOverlay from "@/components/SearchOverlay";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BadgeToastManager } from "@/components/BadgeEarnedToast";
import { fetchUnreadCount } from "@/lib/notificationState";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { BannerSkeleton } from "@/components/SkeletonLoaders";

interface BannerData {
  banner: {
    id: number;
    type: "session" | "advertisement";
    thumbnailUrl: string | null;
    videoUrl: string | null;
    posterUrl: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    isLive: boolean;
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

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    };

    // Initial load when Home opens
    loadUnread();

    // 🔔 Listen for live updates (push received)
    const handleUnreadChange = (e: any) => {
      if (e.detail && typeof e.detail.count === "number") {
        setUnreadCount(e.detail.count);
      }
    };

    window.addEventListener("unread-changed", handleUnreadChange);

    return () => {
      window.removeEventListener("unread-changed", handleUnreadChange);
    };
  }, []);

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/v1/streak/last-7-days"],
      });
      // Handle the newBadges array populated by trackingService
      if (data?.newBadges && data.newBadges.length > 0) {
        setNewBadges(data.newBadges);
        queryClient.invalidateQueries({ queryKey: ["/api/v1/badges"] });
      }
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
      bgColor: "bg-blue-50 border-blue-100 text-blue-500",
      iconColor: "text-blue-500",
    },
    {
      title: "All Processes",
      icon: Sparkles,
      path: "/processes",
      testId: "card-processes",
      bgColor: "bg-purple-50 border-purple-100 text-purple-500",
      iconColor: "text-purple-500",
    },
    {
      title: "Community Practices",
      icon: Users,
      path: "/community-practices",
      testId: "card-community-practices",
      bgColor: "bg-pink-50 border-pink-100 text-pink-500",
      iconColor: "text-pink-500",
    },
    {
      title: "Daily Abundance",
      icon: IndianRupee,
      path: "/money-mastery",
      testId: "card-money-mastery",
      bgColor: "bg-emerald-50 border-emerald-100 text-emerald-500",
      iconColor: "text-emerald-500",
    },
    {
      title: "Masterclasses",
      icon: GraduationCap,
      path: "/masterclasses",
      testId: "card-masterclasses",
      bgColor: "bg-brand/10 border-brand/20 text-brand",
      iconColor: "text-brand",
    },
    {
      title: "Gold Mine",
      icon: Gem,
      path: "/goldmine",
      testId: "card-goldmine",
      bgColor: "bg-amber-50 border-amber-100 text-amber-500",
      iconColor: "text-amber-500",
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
        <Header
          title="Hello, Designer"
          titleIcon={
            <span className="inline-block animate-pulse origin-bottom">✨</span>
          }
          subtitle="Ready to design your destiny?"
          rightContent={
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
          }
        />

        {/* Main Content with Entrance Animations */}
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 w-full p-4 mt-3 space-y-6"
        >
          {/* Hero Banner Section */}
          <motion.section variants={itemVariants} className="w-full">
            {isBannerLoading ? (
              <BannerSkeleton />
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
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            data-testid="img-banner"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          {banner.type === "session" &&
                            banner.isLive &&
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

          {/* Quick Actions Grid - Split Layout Style */}
          <motion.section
            variants={itemVariants}
            className="space-y-4 pt-4 px-1"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm md:text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5 px-1 md:px-2">
              {actionCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => setLocation(card.path)}
                  className="group relative flex items-center justify-start gap-2.5 min-[400px]:gap-3.5 bg-white p-2.5 min-[400px]:p-3 md:p-3.5 rounded-2xl shadow-md border border-slate-300 active:scale-[0.97] active:opacity-70 transition-all duration-200 text-left overflow-hidden min-h-[78px] md:min-h-[92px]"
                  data-testid={card.testId}
                >
                  <div
                    className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${card.bgColor}`}
                  >
                    <card.icon
                      className="w-5 h-5 md:w-6 md:h-6"
                      strokeWidth={2}
                    />
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col justify-center min-w-0">
                    <span className="block font-bold text-slate-800 text-[11.5px] min-[375px]:text-[12.5px] min-[400px]:text-[13px] sm:text-[14px] md:text-[15px] leading-[1.2] tracking-tight whitespace-pre-line break-words">
                      {card.title}
                    </span>
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
                  className="bg-white rounded-2xl p-[18px] md:p-[22px] shadow-md border border-slate-300 relative overflow-hidden"
                  data-testid="card-streak"
                >
                  <div className="flex items-center justify-between mb-[18px] md:mb-[22px] relative z-10">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100 shadow-sm shrink-0">
                        <Flame
                          className="w-5 h-5 md:w-6 md:h-6"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="block text-[14px] md:text-[16px] font-bold text-slate-800 tracking-[0.01em] leading-none mb-1">
                          7 Day Streak
                        </span>
                        <span className="block text-[12px] md:text-[13px] font-medium text-slate-500 tracking-[-0.01em] leading-none">
                          Keep the momentum going!
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center min-w-[50px]">
                      <span className="text-[11px] md:text-[12px] font-bold text-slate-900 tracking-tight">
                        {streakData
                          ? `${streakData.filter((d) => d.active).length} / 7`
                          : "0 / 7"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-1.5 md:gap-2 relative z-10">
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
                          className="flex flex-col items-center gap-2.5 flex-1"
                          data-testid={`streak-day-${index}`}
                        >
                          <div
                            className={`w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center transition-all duration-300 ${
                              day.active
                                ? "bg-gradient-to-b from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 scale-100"
                                : "bg-slate-50 border border-slate-400 scale-[0.9]"
                            } ${
                              isToday
                                ? "ring-2 ring-orange-400 ring-offset-2 scale-110"
                                : ""
                            }`}
                          >
                            {day.active ? (
                              <Flame
                                className="w-4 h-4 md:w-5 md:h-5 text-white drop-shadow-sm"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-400" />
                            )}
                          </div>
                          <span
                            className={`text-[12px] md:text-[13px] font-semibold tracking-tight ${
                              day.active ? "text-orange-600" : "text-slate-400"
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
                  className="w-full group relative overflow-hidden bg-brand rounded-2xl p-6 shadow-md border border-slate-300 hover:shadow-brand/30 transition-all duration-500 active:scale-95 border-white/10"
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
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-slate-300 overflow-hidden text-center"
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
