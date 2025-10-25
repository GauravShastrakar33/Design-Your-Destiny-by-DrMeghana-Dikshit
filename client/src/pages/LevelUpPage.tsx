import { ArrowLeft, Trophy, TrendingUp, Flame } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const challenges = [
  {
    id: "7-day",
    title: "7-Day Calm Mind",
    description: "Build a foundation of daily mindfulness practice",
    duration: 7,
    gradient: "bg-gradient-to-br from-teal-400 to-cyan-500"
  },
  {
    id: "21-day",
    title: "21-Day Mind Discipline",
    description: "Develop mental strength and consistency",
    duration: 21,
    gradient: "bg-gradient-to-br from-cyan-400 to-blue-500"
  },
  {
    id: "90-day",
    title: "90-Day Life Transformation",
    description: "Complete transformation of habits and mindset",
    duration: 90,
    gradient: "bg-gradient-to-br from-blue-400 to-teal-500"
  }
];

export default function LevelUpPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Level Up Challenge</h1>
              <p className="text-sm text-muted-foreground">Choose your transformation journey</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-cyan-400 to-teal-500 border-0">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-white" />
              <div>
                <h2 className="text-white text-xl font-bold">Choose Your Challenge</h2>
                <p className="text-white/90 text-sm">Commit to growth and transformation</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden" data-testid={`challenge-${challenge.id}`}>
                <div className={`${challenge.gradient} p-4`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white text-xl font-bold mb-1">{challenge.title}</h3>
                      <p className="text-white/90 text-sm mb-3">{challenge.description}</p>
                      <div className="flex items-center gap-2 text-white/80">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-medium">{challenge.duration} Days</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <Button
                    onClick={() => setLocation(`/level-up/${challenge.id}`)}
                    className="w-full"
                    data-testid={`button-start-${challenge.id}`}
                  >
                    Start Challenge
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Challenge History</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  View your completed challenges and achievements
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/level-up/history")}
                  data-testid="button-view-history"
                >
                  View History
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
