import { ArrowLeft, Music, CheckSquare } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

// Horizontal Bar Component for Monthly View
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

export default function AIInsightsPage() {
  const [, setLocation] = useLocation();
  const [monthlyData, setMonthlyData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // DUMMY DATA FOR DEMONSTRATION
    const dummyMonthlyData = {
      playlist: [
        ['Vibration Elevation', 12],
        ['Wealth Code Activation 1', 10],
        ['Neurolinking', 8],
        ['Birth Story Healing', 6],
        ['Memory Development Breath', 5],
        ['Wealth Code Activation 2', 4]
      ],
      checklist: [
        ['Gratitude Journal', 15],
        ['Recognition', 12],
        ['Mirror Work', 8],
        ['Visualisation', 7],
        ['EET', 5],
        ['Story Burning', 3]
      ],
      maxCount: 15
    };
    
    setMonthlyData(dummyMonthlyData);
  };

  const getMonthName = () => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[new Date().getMonth()];
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F3F3F3' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
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
          {/* Monthly View */}
          {monthlyData && (
            <Card className="p-5 shadow-sm bg-white" data-testid="card-monthly-progress">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {getMonthName()} {new Date().getFullYear()} Progress
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Your practice journey this month
              </p>

              {/* Playlist Practices */}
              {monthlyData.playlist.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-[#703DFA]" />
                    <h3 className="text-md font-medium text-foreground">Playlist Practices</h3>
                  </div>
                  {monthlyData.playlist.map(([practice, count]: [string, number], idx: number) => (
                    <HorizontalBar
                      key={idx}
                      label={practice}
                      count={count}
                      maxCount={monthlyData.maxCount}
                      gradient="from-purple-300 to-purple-500"
                    />
                  ))}
                </div>
              )}

              {/* Process Checklist */}
              {monthlyData.checklist.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-[#703DFA]" />
                    <h3 className="text-md font-medium text-foreground">Process Checklist</h3>
                  </div>
                  {monthlyData.checklist.map(([practice, count]: [string, number], idx: number) => (
                    <HorizontalBar
                      key={idx}
                      label={practice}
                      count={count}
                      maxCount={monthlyData.maxCount}
                      gradient="from-green-300 to-green-500"
                    />
                  ))}
                </div>
              )}

              {/* Inspirational Message */}
              {(monthlyData.playlist.length > 0 || monthlyData.checklist.length > 0) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-sm italic text-center text-foreground/80">
                    "You came back again and again. That's growth."
                  </p>
                </div>
              )}

              {monthlyData.playlist.length === 0 && monthlyData.checklist.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No activity recorded this month yet. Start your practice journey!
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
