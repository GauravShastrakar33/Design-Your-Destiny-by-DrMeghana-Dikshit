import { Capacitor } from "@capacitor/core";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import ActionCard from "@/components/ActionCard";
import { useToast } from "@/hooks/use-toast";
import SearchOverlay from "@/components/SearchOverlay";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEvaluateBadgesOnMount } from "@/hooks/useBadges";
import { BadgeToastManager } from "@/components/BadgeEarnedToast";
import { getUnreadCount } from "@/lib/notificationState";

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
      const count = await getUnreadCount();
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

  const { data: bannerData } = useQuery<BannerData>({
    queryKey: ["/api/public/v1/session-banner"],
  });

  // Fetch today's daily quote
  const { data: quoteData } = useQuery<{
    quote: string | null;
    author: string | null;
  }>({
    queryKey: ["/api/quotes/today"],
  });

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  // Fetch streak data - only when authenticated
  const { data: streakData } = useQuery<StreakDay[]>({
    queryKey: ["/api/v1/streak/last-7-days"],
    enabled: isAuthenticated,
  });

  // Mark today mutation
  const markTodayMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await apiRequest("POST", "/api/v1/streak/mark-today", {
        date,
      });
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
      const today = new Date().toISOString().split("T")[0];
      setMarkAttempted(true);
      markTodayMutation.mutate(today);
    }
  }, [markAttempted, isAuthenticated]);

  // Evaluate badges on mount (only once per session)
  useEffect(() => {
    if (!badgeEvaluated && isAuthenticated) {
      setBadgeEvaluated(true);
      evaluate();
    }
  }, [badgeEvaluated, isAuthenticated, evaluate]);

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
    },
    {
      title: "All Processes",
      icon: Sparkles,
      path: "/processes",
      testId: "card-processes",
    },
    {
      title: "Community Practices",
      icon: Users,
      path: "/community-practices",
      testId: "card-community-practices",
    },
    {
      title: "Daily Abundance",
      icon: IndianRupee,
      path: "/money-mastery",
      testId: "card-money-mastery",
    },
    {
      title: "Masterclasses",
      icon: GraduationCap,
      path: "/masterclasses",
      testId: "card-masterclasses",
      fullWidth: true, // 👈 key change
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans text-slate-800">
      {/* Badge Earned Toast */}
      <BadgeToastManager
        newBadges={newBadges}
        onAllDismissed={() => setNewBadges([])}
      />

      <div className="w-full mx-auto min-h-screen flex flex-col max-w-5xl transition-all duration-300">
        {/* Header Section */}
        <header
          className={`sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-all ${
            isNative ? "pt-[calc(env(safe-area-inset-top)+1rem)]" : ""
          }`}
        >
          <div className="flex-1">
            <h1 className="text-xl sm:text-xl font-bold text-slate-900 tracking-tight">
              Hello, Designer <span className="animate-pulse">✨</span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 mt-0.5">
              Ready to design your destiny?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-md hover:text-brand transition-all active:scale-95"
              data-testid="button-search"
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="relative">
              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-md hover:text-brand transition-all active:scale-95"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" strokeWidth={2} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white shadow-sm animate-in zoom-in">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 w-full px-4 sm:px-6 py-6 space-y-8">
          {/* Dynamic Banner Section */}
          {banner && (
            <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-black group ring-1 ring-black/5">
                {banner.type === "advertisement" && banner.videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={banner.videoUrl}
                      poster={banner.posterUrl || undefined}
                      className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
                      autoPlay
                      muted
                      loop
                      playsInline
                      data-testid="video-banner"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                      <button
                        onClick={toggleMute}
                        className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/50 text-white transition-all active:scale-95"
                        data-testid="button-video-mute"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={toggleVideoPlayback}
                        className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/50 text-white transition-all active:scale-95"
                        data-testid="button-video-toggle"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                    </div>
                  </>
                ) : banner.thumbnailUrl ? (
                  <>
                    <img
                      src={banner.thumbnailUrl}
                      alt="Session Banner"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      data-testid="img-banner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    {banner.type === "session" &&
                      banner.liveEnabled &&
                      bannerStatus === "active" && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg z-10">
                          <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-bold text-white tracking-wider uppercase">
                            Live Now
                          </span>
                        </div>
                      )}
                  </>
                ) : null}
              </div>

              {banner.ctaText &&
                banner.ctaLink &&
                banner.ctaLink.trim() !== "" && (
                  <div className="w-full flex justify-center -mt-6 relative z-10">
                    <button
                      onClick={() => {
                        if (banner.ctaLink) {
                          window.open(banner.ctaLink, "_blank");
                        }
                      }}
                      className="px-8 py-3 rounded-full font-bold text-sm shadow-xl shadow-brand/20 bg-brand text-white hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white"
                      data-testid="button-banner-cta"
                    >
                      {banner.ctaText}
                    </button>
                  </div>
                )}
            </section>
          )}

          {/* Quick Actions Grid */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {actionCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => setLocation(card.path)}
                  className={`group relative overflow-hidden bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-brand/20 transition-all duration-300 active:scale-[0.98] flex items-center gap-2 sm:gap-3 ${
                    card.fullWidth ? "col-span-2 lg:col-span-4" : ""
                  }`}
                  data-testid={card.testId}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand/5 flex items-center justify-center group-hover:bg-brand/10 group-hover:scale-110 transition-all duration-300 shrink-0">
                    <card.icon
                      className="w-4 h-4 sm:w-5 sm:h-5 text-brand"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-brand transition-colors text-left flex-1 line-clamp-2 leading-tight">
                    {card.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-brand/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-brand/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </section>

          {/* Journey & progress */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" />
              Your Journey
            </h2>

            <div className="flex flex-col gap-6">
              {/* Streak Card */}
              {isAuthenticated && (
                <div
                  className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 shadow-sm border border-slate-200 relative overflow-hidden"
                  data-testid="card-streak"
                >
                  <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 bg-orange-500/5 rounded-full blur-3xl w-32 h-32 pointer-events-none" />

                  <div className="flex items-center justify-between mb-6 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-50 rounded-xl">
                        <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900">
                          7 Day Streak
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Keep the momentum going!
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                              day.active
                                ? "bg-gradient-to-b from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 scale-100"
                                : "bg-slate-50 border border-slate-100 scale-90"
                            } ${
                              isToday
                                ? "ring-2 ring-orange-400 ring-offset-2"
                                : ""
                            }`}
                          >
                            {day.active ? (
                              <Flame
                                className="w-4 h-4 text-white"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold tracking-wide ${
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

              {/* Progress Insights Button - Theme Color Style */}
              {isAuthenticated && (
                <button
                  onClick={() => setLocation("/progress-insights")}
                  className="w-full group relative overflow-hidden bg-brand rounded-xl p-6 shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all duration-300 active:scale-[0.99] border border-white/10"
                  data-testid="button-progress-insights"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />

                  <div className="relative flex flex-col justify-between items-start h-full z-10">
                    <div className="flex justify-between items-center gap-3 mb-2 w-full">
                      <TrendingUp className="w-8 h-8 text-white" />
                      <div className="text-left w-full">
                        <h3 className="text-lg font-bold text-white mb-1">
                          Progress Insights
                        </h3>
                      </div>
                      <ChevronRight className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-white/80 text-sm font-medium italic leading-relaxed">
                      Track your daily growth and milestones
                    </p>
                  </div>
                </button>
              )}
            </div>
          </section>

          {/* Daily Quote Card - Redesigned to Light Premium Theme */}
          {quoteData?.quote && (
            <div
              className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200 overflow-hidden text-center"
              data-testid="card-quote"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-brand/[0.2]" />
              <div className="absolute -top-6 -right-6 opacity-[0.04] transform rotate-12 group-hover:rotate-6 transition-transform duration-1000">
                <Feather className="w-48 h-48 text-slate-900" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand/5 flex items-center justify-center ring-4 ring-white shadow-sm">
                    <Quote className="w-5 h-5 text-brand fill-brand/20" />
                  </div>
                </div>
                <p className="text-slate-700 text-lg sm:text-xl leading-relaxed font-normal mb-5 px-3">
                  "{quoteData.quote}"
                </p>
                {quoteData.author && (
                  <div className="flex items-center justify-center gap-4">
                    <span className="h-px w-12 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    <p className="text-slate-500 text-xs font-bold tracking-[0.2em]">
                      {quoteData.author}
                    </p>
                    <span className="h-px w-12 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
