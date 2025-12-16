import { ArrowLeft, Music, CheckSquare, Wind, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ActivityItem {
  lessonId: number;
  lessonName: string;
  count: number;
}

interface MonthlyStats {
  PROCESS: ActivityItem[];
  BREATH: ActivityItem[];
  CHECKLIST: ActivityItem[];
  maxCount: number;
}

function HorizontalBar({ 
  label, 
  count, 
  maxCount, 
  gradient = "from-purple-300 to-purple-500" 
}: { 
  label: string; 
  count: number; 
  maxCount: number; 
  gradient?: string;
}) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-muted-foreground">{count}×</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${gradient}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getAvailableMonths(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  
  return months;
}

export default function AIInsightsPage() {
  const [, setLocation] = useLocation();
  const availableMonths = getAvailableMonths();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  
  const selectedMonth = availableMonths[selectedMonthIndex];
  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  const { data: monthlyData, isLoading, error } = useQuery<MonthlyStats>({
    queryKey: ["/api/v1/activity/monthly-stats", selectedMonth?.value],
    queryFn: async () => {
      const response = await fetch(`/api/v1/activity/monthly-stats?month=${selectedMonth?.value}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("@app:user_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch monthly stats");
      return response.json();
    },
    enabled: isAuthenticated && !!selectedMonth,
  });

  const handlePrevMonth = () => {
    if (selectedMonthIndex < availableMonths.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  const hasAnyData = monthlyData && (
    monthlyData.PROCESS.length > 0 || 
    monthlyData.BREATH.length > 0 || 
    monthlyData.CHECKLIST.length > 0
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: '#F3F3F3' }}>
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-white border-b border-border z-10">
            <div className="px-4 py-4 flex items-center gap-4">
              <button
                onClick={() => setLocation("/")}
                className="hover-elevate active-elevate-2 rounded-lg p-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-600 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>AI Insights</h1>
            </div>
          </div>
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">Please log in to view your practice insights.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F3F3F3' }}>
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-600 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>AI Insights</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              disabled={selectedMonthIndex >= availableMonths.length - 1}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-foreground" data-testid="text-selected-month">
              {selectedMonth?.label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={selectedMonthIndex <= 0}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#703DFA]" />
            </div>
          )}

          {error && (
            <Card className="p-5 shadow-sm bg-white text-center">
              <p className="text-sm text-muted-foreground">Failed to load insights. Please try again.</p>
            </Card>
          )}

          {!isLoading && !error && monthlyData && (
            <Card className="p-5 shadow-sm bg-white" data-testid="card-monthly-progress">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {selectedMonth?.label} Progress
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Your practice journey this month
              </p>

              {monthlyData.PROCESS.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-[#703DFA]" />
                    <h3 className="text-md font-medium text-foreground">Processes</h3>
                  </div>
                  {monthlyData.PROCESS.map((item, idx) => (
                    <HorizontalBar
                      key={item.lessonId || idx}
                      label={item.lessonName}
                      count={item.count}
                      maxCount={monthlyData.maxCount}
                      gradient="from-purple-300 to-purple-500"
                    />
                  ))}
                </div>
              )}

              {monthlyData.BREATH.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Wind className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-md font-medium text-foreground">Spiritual Breaths</h3>
                  </div>
                  {monthlyData.BREATH.map((item, idx) => (
                    <HorizontalBar
                      key={item.lessonId || idx}
                      label={item.lessonName}
                      count={item.count}
                      maxCount={monthlyData.maxCount}
                      gradient="from-cyan-300 to-cyan-500"
                    />
                  ))}
                </div>
              )}

              {monthlyData.CHECKLIST.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-green-500" />
                    <h3 className="text-md font-medium text-foreground">Process Checklist</h3>
                  </div>
                  {monthlyData.CHECKLIST.map((item, idx) => (
                    <HorizontalBar
                      key={item.lessonId || idx}
                      label={item.lessonName}
                      count={item.count}
                      maxCount={monthlyData.maxCount}
                      gradient="from-green-300 to-green-500"
                    />
                  ))}
                </div>
              )}

              {hasAnyData && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-sm italic text-center text-foreground/80">
                    "You came back again and again. That's growth."
                  </p>
                </div>
              )}

              {!hasAnyData && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No activity recorded for {selectedMonth?.label}. Start your practice journey!
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
