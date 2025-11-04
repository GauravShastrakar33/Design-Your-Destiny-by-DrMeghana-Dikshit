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
    // Left Column
    {
      title: "Processes",
      icon: Sparkles,
      gradient: "bg-gradient-ocean",
      path: "/processes",
      testId: "card-processes",
    },
    // Right Column
    {
      title: "Spiritual Breaths",
      icon: Wind,
      gradient: "bg-gradient-calm",
      path: "/spiritual-breaths",
      testId: "card-spiritual-breaths",
    },
    // Left Column
    {
      title: "Community Practices",
      icon: Users,
      gradient: "bg-gradient-sunrise",
      path: "/community-practices",
      testId: "card-community-practices",
    },
    // Right Column
    {
      title: "My Playlist",
      icon: ListMusic,
      gradient: "bg-gradient-harmony",
      path: "/playlist",
      testId: "card-my-playlist",
    },
    // Left Column
    {
      title: "Emotion Mastery",
      icon: Heart,
      gradient: "bg-gradient-focus",
      path: "/emotion-mastery",
      testId: "card-emotion-mastery",
    },
    // Right Column
    {
      title: "Articles",
      icon: BookOpen,
      gradient: "bg-gradient-ocean",
      path: "/articles",
      testId: "card-articles",
    },
    // Left Column
    {
      title: "Money Mastery Hub",
      icon: DollarSign,
      gradient: "bg-gradient-forest",
      path: "/money-mastery",
      testId: "card-money-mastery",
    },
    // Right Column
    {
      title: "Process Checklist",
      icon: CheckSquare,
      gradient: "bg-gradient-desert",
      path: "/process-checklist",
      testId: "card-process-checklist",
    },
    // Left Column
    {
      title: "Music Journaling",
      icon: Music,
      gradient: "bg-gradient-lavender",
      path: "/music-journaling",
      testId: "card-music-journaling",
    },
    // Right Column
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

        <div className="px-4 py-4 space-y-6">
          {/* Daily Progress Card - Ultra Compact */}
          <div className="bg-gradient-calm rounded-2xl pt-3 pb-4 px-4 shadow-lg">
            {/* 🌟 Streak Section - Moved Slightly Up */}
            <div className="flex items-center justify-between mb-1 -mt-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <h2 className="text-lg font-semibold text-white">
                  9 Day Streak
                </h2>
              </div>
              <div className="text-right">
                <p className="text-white/90 text-[12px] font-semibold">
                  Best Streak
                </p>
                <p className="text-white text-base font-bold leading-none">
                  25 Days
                </p>
              </div>
            </div>

            {/* ✅ Subtitle - Left aligned & slightly larger */}
            <p className="text-white/90 text-[14px] font-medium mt-0.5 ml-6">
              Keep the momentum going, Gaurav!
            </p>

            {/* ✅ Weekly Circles – Bigger Spacing */}
            <div className="flex items-center justify-center gap-4 mt-3 mb-4">
              {[
                { day: "M", done: true },
                { day: "T", done: false },
                { day: "W", done: true },
                { day: "T", done: true },
                { day: "F", done: false },
                { day: "S", done: true },
                { day: "S", done: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold
                  ${
                    item.done
                      ? "bg-white/90 text-indigo-700 shadow-sm"
                      : "bg-white/15 text-white/50 border border-white/30"
                  }`}
                >
                  {item.day}
                </div>
              ))}
            </div>

            {/* Today's Practice Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/90 text-[11px] font-medium">
                  Today's Practice
                </span>
                <span className="text-white text-[11px] font-semibold">
                  {practiceProgress.current}/{practiceProgress.total} mins
                </span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{
                    width: `${(practiceProgress.current / practiceProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setLocation("/playlist")}
              className="w-full py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 
                         text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Resume Practice
            </button>
          </div>

          {/* Compact Quick Actions Grid */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {actionCards.map((card) => (
                <button
                  key={card.path}
                  onClick={() => setLocation(card.path)}
                  className={`${card.gradient} rounded-2xl p-3 flex items-center gap-2 hover-elevate active-elevate-2 min-h-[60px]`}
                  data-testid={card.testId}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white text-left flex-1">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Motivational Quote Card */}
          <div
            className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl p-6 text-center shadow-lg"
            data-testid="card-quote"
          >
            <p className="text-white text-lg font-semibold mb-4 leading-relaxed">
              "The only impossible journey is the one you never begin."
            </p>
            <p className="text-white/80 text-sm mb-4">— Tony Robbins</p>
            <button
              onClick={() => setLocation("/more-quotes")}
              className="px-4 py-2 bg-black/30 hover:bg-black/40 active:bg-black/50 text-white text-sm font-medium rounded-full backdrop-blur-sm"
              data-testid="button-more-quotes"
            >
              More Quotes →
            </button>
          </div>

          {/* AI Insights Card */}
          <div
            className="bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 rounded-2xl p-6 shadow-lg relative"
            data-testid="card-ai-insights"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-white text-xl font-bold mb-1">
                  AI Insights ✨
                </h3>
                <p className="text-white/90 text-sm">
                  Receive personalised insights for your streak
                </p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-xs mt-3">Unlocks in 7 days</p>
            <button
              onClick={() => setLocation("/ai-insights")}
              className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-sm font-medium rounded-xl backdrop-blur-sm"
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
