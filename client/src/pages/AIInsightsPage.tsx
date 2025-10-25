import { ArrowLeft, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

export default function AIInsightsPage() {
  const [, setLocation] = useLocation();

  const practiceData = [
    { practice: "Recognition", days: 12 },
    { practice: "EET", days: 8 },
    { practice: "Visualisation", days: 15 },
    { practice: "Story Burning", days: 5 },
    { practice: "Gratitude Journal", days: 20 },
    { practice: "Ho'oponopono", days: 10 },
  ];

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
            <h1 className="text-2xl font-bold text-foreground">AI Insights ✨</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 border-0">
            <h2 className="text-white text-xl font-bold mb-2">
              Your Practice Overview
            </h2>
            <p className="text-white/90 text-sm">
              Track your consistency across different practices
            </p>
          </Card>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Practice Frequency
            </h3>
            <div className="space-y-3">
              {practiceData.map((item) => (
                <Card key={item.practice} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{item.practice}</span>
                    <span className="text-sm font-semibold text-primary">{item.days} days</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${(item.days / 20) * 100}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-6 bg-gradient-to-br from-green-400 to-emerald-500 border-0">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-white flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold mb-2">AI Recommendation</h3>
                <p className="text-white/90 text-sm">
                  You're doing great with Gratitude Journal! Consider adding more Story Burning sessions to balance your practice.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
