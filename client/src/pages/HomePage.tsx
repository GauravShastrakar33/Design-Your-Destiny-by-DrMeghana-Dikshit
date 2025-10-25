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
  TrendingUp 
} from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import StreakCalendar from "@/components/StreakCalendar";
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
      gradient: "bg-gradient-wellness",
      path: "/processes",
      testId: "card-processes"
    },
    // Right Column
    {
      title: "Spiritual Breaths",
      icon: Wind,
      gradient: "bg-gradient-calm",
      path: "/spiritual-breaths",
      testId: "card-spiritual-breaths"
    },
    // Left Column
    {
      title: "Community Practices",
      icon: Users,
      gradient: "bg-gradient-growth",
      path: "/community-practices",
      testId: "card-community-practices"
    },
    // Right Column
    {
      title: "My Playlist",
      icon: ListMusic,
      gradient: "bg-gradient-energy",
      path: "/playlist",
      testId: "card-my-playlist"
    },
    // Left Column
    {
      title: "Emotion Mastery",
      icon: Heart,
      gradient: "bg-gradient-calm",
      path: "/emotion-mastery",
      testId: "card-emotion-mastery"
    },
    // Right Column
    {
      title: "Articles",
      icon: BookOpen,
      gradient: "bg-gradient-wellness",
      path: "/articles",
      testId: "card-articles"
    },
    // Left Column
    {
      title: "Money Mastery Hub",
      icon: DollarSign,
      gradient: "bg-gradient-growth",
      path: "/money-mastery",
      testId: "card-money-mastery"
    },
    // Right Column
    {
      title: "Process Checklist",
      icon: CheckSquare,
      gradient: "bg-gradient-energy",
      path: "/process-checklist",
      testId: "card-process-checklist"
    },
    // Left Column
    {
      title: "Music Journaling",
      icon: Music,
      gradient: "bg-gradient-calm",
      path: "/music-journaling",
      testId: "card-music-journaling"
    },
    // Right Column
    {
      title: "Level Up",
      icon: TrendingUp,
      gradient: "bg-gradient-wellness",
      path: "/level-up",
      testId: "card-level-up"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Dr.M App
          </h1>
          <p className="text-muted-foreground">
            Your personal wellness journey starts here
          </p>
        </div>

        <div className="space-y-6">
          <ProgressBar
            current={practiceProgress.current}
            total={practiceProgress.total}
          />
          <StreakCalendar completedDays={streakDays} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {actionCards.map((card) => (
              <ActionCard
                key={card.path}
                title={card.title}
                icon={card.icon}
                gradient={card.gradient}
                onClick={() => setLocation(card.path)}
                testId={card.testId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
