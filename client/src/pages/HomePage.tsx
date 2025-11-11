import { useState } from "react";
import { useLocation } from "wouter";
import {
  Sparkles,
  Users,
  Wind,
  BookOpen,
  ListMusic,
  Heart,
  DollarSign,
  Music,
  CheckSquare,
  TrendingUp,
  Bell,
  Play,
  Lock,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import ActionCard from "@/components/ActionCard";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [practiceProgress] = useState({ current: 15, total: 30 });
  const [streakDays] = useState([true, true, false, true, true, false, false]);

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
      title: "My ProcessList",
      icon: ListMusic,
      gradient: "bg-gradient-harmony",
      path: "/playlist",
      testId: "card-my-playlist",
    },
    {
      title: "Emotion Mastery",
      icon: Heart,
      gradient: "bg-gradient-focus",
      path: "/emotion-mastery",
      testId: "card-emotional-mastery",
    },
    {
      title: "Articles",
      icon: BookOpen,
      gradient: "bg-gradient-ocean",
      path: "/articles",
      testId: "card-articles",
    },
    {
      title: "Abundance Mastery",
      icon: DollarSign,
      gradient: "bg-gradient-forest",
      path: "/money-mastery",
      testId: "card-money-mastery",
    },
    {
      title: "Process Checklist",
      icon: CheckSquare,
      gradient: "bg-gradient-desert",
      path: "/process-checklist",
      testId: "card-process-checklist",
    },
    {
      title: "Music Journaling",
      icon: Music,
      gradient: "bg-gradient-lavender",
      path: "/music-journaling",
      testId: "card-music-journaling",
    },
    {
      title: "Level Up",
      icon: TrendingUp,
      gradient: "bg-gradient-fire",
      path: "/level-up",
      testId: "card-level-up",
    },
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        {/* Header with Search and Notification */}
        <div className="bg-white px-4 py-3 shadow-sm border-b border-[#232A34]/10 flex items-center justify-between gap-3">
          <div className="flex-1">
            <h1
              className="text-[21px] font-bold"
              style={{ fontFamily: "Bebas Neue" }}
            >
              Welcome back, Champion 🎖️
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              How's your energy today?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => toast({ title: "Search coming soon!", description: "This feature is under development." })}
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

        {/* Live Session Section */}
        <div className="w-full mt-3 mb-4">
          {/* Image Banner */}
          <div className="relative w-full h-56 overflow-hidden shadow-md">
            <img
              src="/DrM.png"
              alt="Live Session"
              className="w-full h-full object-cover"
            />

            {/* LIVE Tag */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/20 backdrop-blur-lg px-3 py-1 rounded-md">
              <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-white">LIVE</span>
            </div>
          </div>

          {/* Join Button */}
          <div className="w-full flex justify-center">
            <button
              onClick={() =>
                window.open("https://zoom.us/j/your-meeting-id", "_blank")
              }
              className="mt-3 w-[85%] px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                         text-white font-medium shadow-md hover:opacity-90 transition text-sm"
              data-testid="button-join-live"
            >
              JOIN NOW
            </button>
          </div>
        </div>

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
            className="bg-gradient-to-br from-purple-600 via-violet-500 to-purple-400 rounded-2xl p-4 shadow-md relative mt-6"
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
    </div>
  );
}
