import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Palette, Wind, BookOpen } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import StreakCalendar from "@/components/StreakCalendar";
import ActionCard from "@/components/ActionCard";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [practiceProgress] = useState({ current: 15, total: 30 });
  const [streakDays] = useState([true, true, false, true, true, false, false]);

  const actionCards = [
    {
      title: "Processes",
      icon: Sparkles,
      gradient: "bg-gradient-wellness",
      path: "/processes",
      testId: "card-processes"
    },
    {
      title: "Design Your Practice",
      icon: Palette,
      gradient: "bg-gradient-growth",
      path: "/design-practice",
      testId: "card-design-practice"
    },
    {
      title: "Spiritual Breaths",
      icon: Wind,
      gradient: "bg-gradient-calm",
      path: "/spiritual-breaths",
      testId: "card-spiritual-breaths"
    },
    {
      title: "Articles",
      icon: BookOpen,
      gradient: "bg-gradient-energy",
      path: "/articles",
      testId: "card-articles"
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
