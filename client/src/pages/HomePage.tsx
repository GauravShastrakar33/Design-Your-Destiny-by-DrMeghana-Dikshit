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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import ActionCard from "@/components/ActionCard";

export default function HomePage() {
  const [, setLocation] = useLocation();
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
      title: "Mental Health",
      icon: Heart, // ✅ Lucide icon instead of Remix
      gradient: "bg-gradient-focus",
      path: "/mental-health",
      testId: "card-mental-health",
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Header with Notification and Search */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, Gaurav
              </h1>
              <p className="text-sm text-muted-foreground">
                Every step you take is shaping the best version of you
              </p>
            </div>
            <button
              onClick={() => setLocation("/notifications")}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover-elevate active-elevate-2"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search practices, workshops..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="input-search"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              🔍
            </span>
          </div>
        </div>

        {/* 🔴 Live Session Section */}
        <div className="w-full mb-6">
          {/* 📌 Image Banner */}
          <div className="relative w-full h-56 overflow-hidden shadow-md">
            <img
              src="/DrM.png"
              alt="Live Session"
              className="w-full h-full object-cover"
            />

            {/* ✅ LIVE Tag */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/20 backdrop-blur-lg px-3 py-1 rounded-md">
              <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-white">LIVE</span>
            </div>
          </div>

          {/* ✅ Join Button — Smaller Width + Less Gap */}
          <div className="w-full flex justify-center">
            <button
              onClick={() =>
                window.open("https://zoom.us/j/your-meeting-id", "_blank")
              }
              className="mt-2 w-[85%] px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                         text-white font-medium shadow-md hover:opacity-90 transition text-sm"
            >
              JOIN NOW
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="px-3 pt-0 pb-4 space-y-4">
          {/* Compact Quick Actions Grid */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              {actionCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => setLocation(card.path)}
                  className="bg-white border border-[#232A34]/10 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md active:scale-[0.98] transition h-[60px]"
                  data-testid={card.testId}
                >
                  {/* ✅ Icon without purple background */}
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
            className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl p-4 shadow-md relative"
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

          {/* AI Insights Card */}
          <div
            className="bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 rounded-2xl p-5 shadow-md relative"
            data-testid="card-ai-insights"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-white text-lg font-bold mb-1">
                  AI Insights ✨
                </h3>
                <p className="text-white/90 text-xs">
                  Receive personalised insights for your streak
                </p>
              </div>
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-white/70 text-[11px] mt-2">Unlocks in 7 days</p>
            <button
              onClick={() => setLocation("/ai-insights")}
              className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-semibold rounded-xl backdrop-blur-sm transition"
              data-testid="button-ai-insights"
            >
              View Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
