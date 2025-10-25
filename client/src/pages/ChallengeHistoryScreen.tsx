import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Flame, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompletedChallenge {
  type: string;
  totalDays: number;
  startDate: string;
  completedDays: number;
  streak: number;
  completedDate: string;
}

const gradients: Record<string, string> = {
  "7-Day Calm Mind": "from-green-400 to-emerald-500",
  "21-Day Mind Discipline": "from-blue-400 to-indigo-500",
  "90-Day Life Transformation": "from-purple-400 to-pink-500"
};

export default function ChallengeHistoryScreen() {
  const [, setLocation] = useLocation();
  const [history, setHistory] = useState<CompletedChallenge[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("@app:challenge_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sort by completion date (newest first)
        const sorted = parsed.sort((a: CompletedChallenge, b: CompletedChallenge) => 
          new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
        );
        setHistory(sorted);
      } catch (error) {
        console.error("Error loading challenge history:", error);
        setHistory([]);
      }
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/level-up")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Challenge History</h1>
              <p className="text-sm text-muted-foreground">Your completed achievements</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Summary Card */}
          <Card className="p-6 bg-gradient-to-br from-yellow-400 to-orange-500 border-0">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-white" />
              <div>
                <h2 className="text-white text-xl font-bold">
                  {history.length} Challenge{history.length !== 1 ? 's' : ''} Completed
                </h2>
                <p className="text-white/90 text-sm">
                  {history.reduce((sum, c) => sum + c.completedDays, 0)} total days of growth
                </p>
              </div>
            </div>
          </Card>

          {/* History List */}
          {history.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-foreground font-medium mb-2">No completed challenges yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first challenge to begin your transformation journey
                </p>
                <Button onClick={() => setLocation("/level-up")} data-testid="button-start-first">
                  Start a Challenge
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((challenge, index) => {
                const gradient = gradients[challenge.type] || "from-purple-400 to-pink-500";
                
                return (
                  <Card key={index} className="overflow-hidden" data-testid={`history-item-${index}`}>
                    <div className={`bg-gradient-to-br ${gradient} p-4`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white text-lg font-bold">{challenge.type}</h3>
                          <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>Completed on {formatDate(challenge.completedDate)}</span>
                          </div>
                        </div>
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/20 rounded-lg p-3">
                          <p className="text-white/80 text-xs mb-1">Days Completed</p>
                          <p className="text-white text-xl font-bold">
                            {challenge.completedDays}/{challenge.totalDays}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                          <p className="text-white/80 text-xs mb-1">Final Streak</p>
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-white" />
                            <p className="text-white text-xl font-bold">{challenge.streak}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Start Another Challenge */}
          {history.length > 0 && (
            <Card className="p-6">
              <div className="text-center">
                <p className="text-foreground font-medium mb-3">Ready for another challenge?</p>
                <Button
                  onClick={() => setLocation("/level-up")}
                  className="w-full"
                  data-testid="button-start-another"
                >
                  Start Another Challenge
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
