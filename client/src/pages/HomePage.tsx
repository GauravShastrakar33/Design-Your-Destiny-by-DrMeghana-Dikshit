import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Users,
  Wind,
  ListMusic,
  DollarSign,
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import ActionCard from "@/components/ActionCard";
import { useToast } from "@/hooks/use-toast";
import SearchOverlay from "@/components/SearchOverlay";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [practiceProgress] = useState({ current: 15, total: 30 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [markAttempted, setMarkAttempted] = useState(false);

  const { data: bannerData } = useQuery<BannerData>({
    queryKey: ["/api/public/v1/session-banner"],
  });

  // Fetch today's daily quote
  const { data: quoteData } = useQuery<{ quote: string | null; author: string | null }>({
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
      const res = await apiRequest("POST", "/api/v1/streak/mark-today", { date });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/streak/last-7-days"] });
    },
    onError: (error) => {
      console.error("Failed to mark streak:", error);
    },
  });

  // Mark today on page load (only once per session, only if authenticated)
  useEffect(() => {
    if (!markAttempted && isAuthenticated) {
      const today = new Date().toISOString().split('T')[0];
      setMarkAttempted(true);
      markTodayMutation.mutate(today);
    }
  }, [markAttempted, isAuthenticated]);

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
      gradient: "bg-gradient-harmony",
      path: "/playlist",
      testId: "card-my-playlist",
    },
    {
      title: "All Processes",
      icon: Sparkles,
      gradient: "bg-gradient-ocean",
      path: "/processes",
      testId: "card-processes",
    },
    {
      title: "Community Practices",
      icon: Users,
      gradient: "bg-gradient-sunrise",
      path: "/community-practices",
      testId: "card-community-practices",
    },
    {
      title: "Daily Abundance",
      icon: DollarSign,
      gradient: "bg-gradient-forest",
      path: "/money-mastery",
      testId: "card-money-mastery",
    },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        {/* Header with Search and Notification */}
        <div className="bg-white px-4 py-3 shadow-sm border-b border-[#232A34]/10 flex items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold" style={{ fontFamily: "Inter" }}>
              Welcome back, Champion 🏆
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              How's your energy today?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
              data-testid="button-search"
            >
              <Search className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
            </button>
            <button
              onClick={() => setLocation("/notifications")}
              className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Dynamic Banner Section */}
        {banner && (
          <div className="w-full mt-3 mb-4">
            {banner.type === "advertisement" && banner.videoUrl ? (
              <div className="relative w-full h-56 overflow-hidden shadow-md bg-black">
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
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                    data-testid="button-video-mute"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={toggleVideoPlayback}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                    data-testid="button-video-toggle"
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : banner.thumbnailUrl ? (
              <div className="relative w-full h-56 overflow-hidden shadow-md">
                <img
                  src={banner.thumbnailUrl}
                  alt="Session Banner"
                  className="w-full h-full object-cover"
                  data-testid="img-banner"
                />
                {banner.type === "session" && banner.liveEnabled && bannerStatus === "active" && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/20 backdrop-blur-lg px-3 py-1 rounded-md">
                    <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-medium text-white">LIVE</span>
                  </div>
                )}
              </div>
            ) : null}

            {banner.ctaText && banner.ctaLink && banner.ctaLink.trim() !== "" && (
              <div className="w-full flex justify-center">
                <button
                  onClick={() => {
                    if (banner.ctaLink) {
                      window.open(banner.ctaLink, "_blank");
                    }
                  }}
                  className="mt-3 w-[85%] px-4 py-3 rounded-full font-bold shadow-md hover:opacity-90 transition text-xl"
                  style={{
                    backgroundColor: "#E5AC19",
                    color: "#0D131F",
                    fontFamily: "Inter",
                  }}
                  data-testid="button-banner-cta"
                >
                  {banner.ctaText}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Container */}
        <div className="px-4 pb-4 space-y-4">
          {/* Compact Quick Actions Grid */}
          <div className="-mx-2 px-2">
            <div className="grid grid-cols-2 gap-2">
              {actionCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => setLocation(card.path)}
                  className="bg-white border border-[#232A34]/10 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md active:scale-[0.98] transition h-[60px]"
                  data-testid={card.testId}
                >
                  <div className="flex items-center justify-center flex-shrink-0">
                    <card.icon
                      className="w-[20px] h-[20px] text-[#703DFA]"
                      strokeWidth={1.6}
                    />
                  </div>

                  <span className="text-sm font-semibold text-[#232A34] text-left flex-1 line-clamp-2">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Masterclasses Card */}
          <button
            onClick={() => setLocation("/masterclasses")}
            className="w-full rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-[0.98] transition"
            style={{ background: "#703DFA" }}
            data-testid="card-masterclasses"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-white">Masterclasses</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
          </button>

          {/* 7-Day Streak Tracker - Only show when authenticated */}
          {isAuthenticated && (
          <div
            className="bg-white rounded-2xl p-4 shadow-sm border border-[#232A34]/10 mt-4"
            data-testid="card-streak"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold text-[#232A34]">7-Day Streak</span>
              </div>
              <span className="text-xs text-gray-500">
                {streakData ? `${streakData.filter(d => d.active).length} day${streakData.filter(d => d.active).length !== 1 ? 's' : ''} this week` : ''}
              </span>
            </div>
            <div className="flex justify-between gap-1">
              {(streakData || Array(7).fill({ date: '', active: false })).map((day, index) => {
                const dayDate = day.date ? new Date(day.date + 'T12:00:00') : new Date();
                const dayName = day.date ? dayDate.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0) : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index];
                const isToday = day.date === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={day.date || index}
                    className="flex flex-col items-center gap-1"
                    data-testid={`streak-day-${index}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        day.active
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm'
                          : 'bg-gray-100'
                      } ${isToday ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}
                    >
                      {day.active ? (
                        <Flame className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span className={`text-xs ${day.active ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Progress Insights Card - Only show when authenticated */}
          {isAuthenticated && (
            <button
              onClick={() => setLocation("/progress-insights")}
              className="w-full text-left bg-white rounded-2xl py-5 px-4 shadow-sm border border-[#232A34]/10 hover-elevate active-elevate-2 mt-4"
              data-testid="button-progress-insights"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#703DFA]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-black text-sm font-bold tracking-wider uppercase mb-1">
                    PROGRESS INSIGHTS
                  </h3>
                  <p className="text-gray-600 text-xs whitespace-nowrap">
                    Receive personalised insights for your streak
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          )}

          {/* Daily Quote Card */}
          {quoteData?.quote && (
            <div
              className="rounded-2xl p-4 shadow-md relative mt-4"
              style={{
                background: "#703DFA",
              }}
              data-testid="card-quote"
            >
              <div className="text-center px-2">
                <p className="text-white text-lg font-medium mb-2.5 leading-relaxed italic">
                  "{quoteData.quote}"
                </p>
                {quoteData.author && (
                  <p className="text-white/90 text-sm font-light">— {quoteData.author}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
