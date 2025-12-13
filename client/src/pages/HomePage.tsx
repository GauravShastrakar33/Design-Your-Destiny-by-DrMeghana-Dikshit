import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import ActionCard from "@/components/ActionCard";
import { useToast } from "@/hooks/use-toast";
import SearchOverlay from "@/components/SearchOverlay";

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

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [practiceProgress] = useState({ current: 15, total: 30 });
  const [streakDays] = useState([true, true, false, true, true, false, false]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: bannerData } = useQuery<BannerData>({
    queryKey: ["/api/public/v1/session-banner"],
  });

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

  const actionCards = [
    {
      title: "Processes",
      icon: Sparkles,
      gradient: "bg-gradient-ocean",
      path: "/processes",
      testId: "card-processes",
    },
    {
      title: "Spiritual Breaths",
      icon: Wind,
      gradient: "bg-gradient-calm",
      path: "/spiritual-breaths",
      testId: "card-spiritual-breaths",
    },
    {
      title: "Community Practices",
      icon: Users,
      gradient: "bg-gradient-sunrise",
      path: "/community-practices",
      testId: "card-community-practices",
    },
    {
      title: "My Processes",
      icon: ListMusic,
      gradient: "bg-gradient-harmony",
      path: "/playlist",
      testId: "card-my-playlist",
    },
    {
      title: "Abundance Mastery",
      icon: DollarSign,
      gradient: "bg-gradient-forest",
      path: "/money-mastery",
      testId: "card-money-mastery",
    },
    {
      title: "My Daily Tracker",
      icon: CheckSquare,
      gradient: "bg-gradient-desert",
      path: "/process-checklist",
      testId: "card-process-checklist",
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
                <button
                  onClick={toggleVideoPlayback}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                  data-testid="button-video-toggle"
                >
                  {isVideoPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
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

          {/* Motivational Quote Card */}
          <div
            className="rounded-2xl p-4 shadow-md relative mt-6"
            style={{
              background: "#703DFA",
            }}
            data-testid="card-quote"
          >
            <div className="text-center mb-3 px-2">
              <p className="text-white text-lg font-medium mb-2.5 leading-relaxed italic">
                "The only impossible journey is the one you never begin."
              </p>
              <p className="text-white/90 text-sm font-light">— Tony Robbins</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setLocation("/more-quotes")}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-semibold rounded-full backdrop-blur-sm transition"
                data-testid="button-more-quotes"
              >
                More Quotes →
              </button>
            </div>
          </div>
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
