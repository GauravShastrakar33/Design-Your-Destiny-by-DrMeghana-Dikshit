import { ArrowLeft, Trophy, TrendingUp, Flame } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const challenges = [
  {
    id: "7-day",
    title: "7-Day Calm Mind",
    description: "Build a foundation of daily mindfulness practice",
    duration: 7,
  },
  {
    id: "21-day",
    title: "21-Day Mind Discipline",
    description: "Develop mental strength and consistency",
    duration: 21,
  },
  {
    id: "90-day",
    title: "90-Day Life Transformation",
    description: "Complete transformation of habits and mindset",
    duration: 90,
  },
];

export default function LevelUpPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-page-bg pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title="Level Up Challenge"
          hasBackButton={true}
          onBack={() => setLocation("/")}
        />

        <div className="px-4 py-6 space-y-6">
          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-brand" />
              <div>
                <h2 className="text-gray-900 text-xl font-bold">
                  Choose Your Challenge
                </h2>
                <p className="text-gray-600 text-sm">
                  Commit to growth and transformation
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="bg-white border border-gray-200 p-5"
                data-testid={`challenge-${challenge.id}`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-gray-900 text-xl font-bold mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-2 text-brand">
                      <Flame className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {challenge.duration} Days
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation(`/level-up/${challenge.id}`)}
                    className="w-full bg-brand hover:bg-brand/90 text-white"
                    data-testid={`button-start-${challenge.id}`}
                  >
                    Start Challenge
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-white border border-gray-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-brand flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Challenge History
                </h3>
                <p className="text-sm text-gray-600 mb-3">
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
