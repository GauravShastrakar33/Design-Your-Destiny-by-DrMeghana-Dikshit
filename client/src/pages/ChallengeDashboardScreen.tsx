import { useState, useEffect } from "react";
import { ArrowLeft, Flame, CheckCircle2, Trophy, Sparkles } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ChallengeData {
  type: string;
  totalDays: number;
  startDate: string;
  completedDays: number;
  streak: number;
  isCompleted: boolean;
  lastCompletedDate?: string;
}

const challengeInfo: Record<string, { title: string; gradient: string }> = {
  "7-day": {
    title: "7-Day Calm Mind",
    gradient: "from-green-400 to-emerald-500"
  },
  "21-day": {
    title: "21-Day Mind Discipline",
    gradient: "from-blue-400 to-indigo-500"
  },
  "90-day": {
    title: "90-Day Life Transformation",
    gradient: "from-purple-400 to-pink-500"
  }
};

export default function ChallengeDashboardScreen() {
  const [, params] = useRoute("/level-up/:challengeId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const challengeId = params?.challengeId || "";
  
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const info = challengeInfo[challengeId];
  const totalDays = parseInt(challengeId.split("-")[0]);

  useEffect(() => {
    // Load or create challenge data
    const saved = localStorage.getItem("@app:active_challenge");
    const today = new Date().toISOString().split('T')[0];
    
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's the same challenge
      if (parsed.type === info?.title) {
        setChallenge(parsed);
      } else {
        // New challenge - create fresh data
        const newChallenge: ChallengeData = {
          type: info?.title || "",
          totalDays: totalDays,
          startDate: today,
          completedDays: 0,
          streak: 0,
          isCompleted: false
        };
        setChallenge(newChallenge);
        localStorage.setItem("@app:active_challenge", JSON.stringify(newChallenge));
      }
    } else {
      // No saved challenge - create new
      const newChallenge: ChallengeData = {
        type: info?.title || "",
        totalDays: totalDays,
        startDate: today,
        completedDays: 0,
        streak: 0,
        isCompleted: false
      };
      setChallenge(newChallenge);
      localStorage.setItem("@app:active_challenge", JSON.stringify(newChallenge));
    }
  }, [challengeId, totalDays, info?.title]);

  const handleMarkComplete = () => {
    if (!challenge) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    if (challenge.lastCompletedDate === today) {
      toast({
        title: "Already completed today",
        description: "You've already marked today as complete. Come back tomorrow!",
        variant: "destructive",
      });
      return;
    }

    setIsAnimating(true);
    
    setTimeout(() => {
      const newCompletedDays = challenge.completedDays + 1;
      
      // Calculate streak - check if today is consecutive to last completed date
      let newStreak = 1;
      if (challenge.lastCompletedDate) {
        const lastDate = new Date(challenge.lastCompletedDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // If completed yesterday, increment streak. Otherwise reset to 1.
        if (diffDays === 1) {
          newStreak = challenge.streak + 1;
        }
      }
      
      const isNowCompleted = newCompletedDays >= challenge.totalDays;
      
      const updatedChallenge: ChallengeData = {
        ...challenge,
        completedDays: newCompletedDays,
        streak: newStreak,
        lastCompletedDate: today,
        isCompleted: isNowCompleted
      };
      
      setChallenge(updatedChallenge);
      
      if (isNowCompleted) {
        // Save to history
        const history = JSON.parse(localStorage.getItem("@app:challenge_history") || "[]");
        history.push({
          ...updatedChallenge,
          completedDate: today
        });
        localStorage.setItem("@app:challenge_history", JSON.stringify(history));
        
        // Clear active challenge
        localStorage.removeItem("@app:active_challenge");
        
        // Show completion modal
        setTimeout(() => {
          setShowCompletionModal(true);
        }, 500);
      } else {
        localStorage.setItem("@app:active_challenge", JSON.stringify(updatedChallenge));
        
        toast({
          title: "Day completed! 🎉",
          description: `${newCompletedDays} of ${challenge.totalDays} days completed. Keep going!`,
        });
      }
      
      setIsAnimating(false);
    }, 600);
  };

  if (!challenge || !info) {
    return null;
  }

  const progressPercentage = (challenge.completedDays / challenge.totalDays) * 100;
  const remainingDays = challenge.totalDays - challenge.completedDays;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#FFFDF8" }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: "#FFFDF8" }}>
          <div className="px-4 py-4 flex items-center gap-4 border-b" style={{ borderColor: "#EDE6DA" }}>
            <button
              onClick={() => setLocation("/level-up")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: "#2E2C28" }} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#2E2C28" }}>
                {info.title}
              </h1>
              <p className="text-sm" style={{ color: "#726C63" }}>
                Your transformation journey
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Progress Ring */}
          <Card className="p-8" style={{ backgroundColor: "#FFFFFF", borderColor: "#EDE6DA" }}>
            <div className="flex flex-col items-center">
              {/* Circular Progress */}
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-48 h-48 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#EDE6DA"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#F4B860"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPercentage / 100)}`}
                    strokeLinecap="round"
                    className={isAnimating ? "transition-all duration-500" : "transition-all duration-300"}
                    data-testid="progress-ring"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-5xl font-bold" style={{ color: "#2E2C28" }} data-testid="text-completed-days">
                    {challenge.completedDays}
                  </p>
                  <p className="text-sm" style={{ color: "#726C63" }}>
                    of {challenge.totalDays} days
                  </p>
                </div>
              </div>

              <p className="text-center text-lg font-semibold mb-2" style={{ color: "#2E2C28" }}>
                {Math.round(progressPercentage)}% Complete
              </p>
              <p className="text-center text-sm" style={{ color: "#726C63" }}>
                {remainingDays} days remaining
              </p>
            </div>
          </Card>

          {/* Streak Card */}
          <Card className="p-6" style={{ backgroundColor: "#FFF5E5", borderColor: "#F4B860" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD580, #F8A14D)" }}>
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "#726C63" }}>Current Streak</p>
                  <p className="text-3xl font-bold" style={{ color: "#2E2C28" }} data-testid="text-streak">
                    {challenge.streak} 🔥
                  </p>
                </div>
              </div>
              {challenge.streak >= 7 && (
                <Trophy className="w-8 h-8" style={{ color: "#F4B860" }} />
              )}
            </div>
          </Card>

          {/* Mark Complete Button */}
          <Button
            onClick={handleMarkComplete}
            className="w-full font-semibold text-lg"
            disabled={isAnimating || challenge.isCompleted}
            style={{
              background: challenge.isCompleted 
                ? "#A0A0A0"
                : "linear-gradient(90deg, #FFD580, #F8A14D)",
              color: "#2E2C28",
              fontFamily: "Poppins, sans-serif",
              boxShadow: challenge.isCompleted ? "none" : "0 4px 12px rgba(0, 0, 0, 0.1)",
              minHeight: "3rem"
            }}
            data-testid="button-mark-complete"
          >
            {isAnimating ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : challenge.isCompleted ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Challenge Completed!
              </span>
            ) : (
              "Mark Day as Complete"
            )}
          </Button>

          {/* Motivational Message */}
          <Card className="p-4" style={{ backgroundColor: "#F5F5F5", borderColor: "#EDE6DA" }}>
            <p className="text-center text-sm italic" style={{ color: "#726C63" }}>
              {challenge.completedDays === 0 && "Every journey begins with a single step. You've got this, Champion!"}
              {challenge.completedDays > 0 && challenge.completedDays < challenge.totalDays / 2 && "Great start! Consistency is the key to transformation."}
              {challenge.completedDays >= challenge.totalDays / 2 && challenge.completedDays < challenge.totalDays && "You're more than halfway there! The finish line is in sight."}
            </p>
          </Card>
        </div>
      </div>

      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="max-w-sm p-8" style={{ backgroundColor: "#FFFDF8", borderColor: "#F4B860" }}>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD580, #F8A14D)" }}>
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#2E2C28" }}>
                Congratulations!
              </h2>
              <p className="text-lg" style={{ color: "#726C63" }}>
                You leveled up 🌟
              </p>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: "#FFF5E5" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "#2E2C28" }}>
                {info.title}
              </p>
              <p className="text-xs" style={{ color: "#726C63" }}>
                Completed with a {challenge.streak}-day streak!
              </p>
            </div>

            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="w-6 h-6 animate-pulse" style={{ color: "#F4B860", animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  setShowCompletionModal(false);
                  setLocation("/level-up/history");
                }}
                className="w-full"
                style={{ background: "linear-gradient(90deg, #FFD580, #F8A14D)", color: "#2E2C28" }}
                data-testid="button-view-history"
              >
                View History
              </Button>
              <Button
                onClick={() => {
                  setShowCompletionModal(false);
                  setLocation("/level-up");
                }}
                variant="outline"
                className="w-full"
                data-testid="button-new-challenge"
              >
                Start New Challenge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
