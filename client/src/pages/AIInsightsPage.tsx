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
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // DUMMY DATA FOR DEMONSTRATION
    const dummyWeeklyData = {
      playlists: [
        {
          name: "Gaurav's Morning Playlist",
          activity: [
            { day: 'Mon', height: 60 },
            { day: 'Tue', height: 35 },
            { day: 'Wed', height: 75 },
            { day: 'Thu', height: 85 },
            { day: 'Fri', height: 40 },
            { day: 'Sat', height: 95 },
            { day: 'Sun', height: 70 },
          ],
          mostPracticed: [
            ['Vibration Elevation', 3],
            ['Wealth Code Activation 1', 2],
            ['Birth Story Healing', 1]
          ]
        },
        {
          name: "Evening Relaxation",
          activity: [
            { day: 'Mon', height: 45 },
            { day: 'Tue', height: 50 },
            { day: 'Wed', height: 30 },
            { day: 'Thu', height: 65 },
            { day: 'Fri', height: 70 },
            { day: 'Sat', height: 55 },
            { day: 'Sun', height: 80 },
          ],
          mostPracticed: [
            ['Neurolinking', 4],
            ['Memory Development Breath', 2]
          ]
        }
      ],
      checklist: {
        daysCount: 5,
        mostDone: [
          ['Gratitude Journal', 5],
          ['Recognition', 3],
          ['Mirror Work', 2]
        ]
      }
    };

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
    
    setWeeklyData(dummyWeeklyData);
    setMonthlyData(dummyMonthlyData);
  };

  const processWeeklyData = (logs: any[], userChecklist: string[]) => {
    // Group by playlist
    const playlistMap = new Map();
    const checklistMap = new Map();
    const playlistDays = new Map();
    
    logs.forEach(log => {
      if (log.type === "playlist") {
        if (!playlistMap.has(log.playlist)) {
          playlistMap.set(log.playlist, new Map());
          playlistDays.set(log.playlist, new Set());
        }
        const practices = playlistMap.get(log.playlist);
        practices.set(log.practice, (practices.get(log.practice) || 0) + 1);
        playlistDays.get(log.playlist).add(log.date);
      } else if (log.type === "checklist") {
        checklistMap.set(log.practice, (checklistMap.get(log.practice) || 0) + 1);
      }
    });
    
    // Get day-by-day activity for each playlist (7 days)
    const playlists = Array.from(playlistMap.keys()).map(playlistName => {
      const practices = playlistMap.get(playlistName);
      const mostPracticed = Array.from(practices.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      // Generate 7-day activity
      const activity = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = logs.filter(l => l.date === dateStr && l.playlist === playlistName);
        activity.push({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          height: Math.min(100, dayLogs.length * 30 + 20)
        });
      }
      
      return {
        name: playlistName,
        activity,
        mostPracticed
      };
    });
    
    // Process checklist
    const checklistPractices = Array.from(checklistMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const uniqueDays = new Set(logs.filter(l => l.type === "checklist").map(l => l.date));
    
    return {
      playlists,
      checklist: {
        daysCount: uniqueDays.size,
        mostDone: checklistPractices
      }
    };
  };

  const processMonthlyData = (logs: any[]) => {
    // Count all practices
    const playlistPractices = new Map();
    const checklistPractices = new Map();
    
    logs.forEach(log => {
      if (log.type === "playlist") {
        playlistPractices.set(log.practice, (playlistPractices.get(log.practice) || 0) + 1);
      } else if (log.type === "checklist") {
        checklistPractices.set(log.practice, (checklistPractices.get(log.practice) || 0) + 1);
      }
    });
    
    const allCounts = [...playlistPractices.values(), ...checklistPractices.values()];
    const maxCount = Math.max(...allCounts, 1);
    
    return {
      playlist: Array.from(playlistPractices.entries()).sort((a, b) => b[1] - a[1]),
      checklist: Array.from(checklistPractices.entries()).sort((a, b) => b[1] - a[1]),
      maxCount
    };
  };

  const getMonthName = () => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[new Date().getMonth()];
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
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
          {/* Toggle */}
          <div className="flex gap-2 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode("weekly")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                viewMode === "weekly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover-elevate"
              }`}
              data-testid="button-weekly-view"
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                viewMode === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover-elevate"
              }`}
              data-testid="button-monthly-view"
            >
              Monthly View
            </button>
          </div>

          {/* Weekly View */}
          {viewMode === "weekly" && weeklyData && (
            <div className="space-y-6">
              {/* Playlist Sections */}
              {weeklyData.playlists.length > 0 ? (
                weeklyData.playlists.map((playlist: any, idx: number) => (
                  <Card key={idx} className="p-5 shadow-sm" data-testid={`card-playlist-${idx}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Music className="w-5 h-5 text-primary" />
                      <h3 className="text-md font-semibold text-foreground">
                        {playlist.name}
                      </h3>
                    </div>

                    {/* 7-Day Activity Chart */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Weekly Activity
                      </h4>
                      <div className="flex items-end justify-between gap-1 h-20">
                        {playlist.activity.map((day: any, dayIdx: number) => (
                          <div key={dayIdx} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all duration-300"
                              style={{ height: `${day.height}%` }}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {day.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Most Practiced */}
                    {playlist.mostPracticed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          Most Practiced:
                        </h4>
                        <ul className="space-y-1">
                          {playlist.mostPracticed.map(([practice, count]: [string, number], pIdx: number) => (
                            <li key={pIdx} className="text-sm text-muted-foreground">
                              • {practice} ({count}×)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <Card className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    No playlist activity this week. Start practicing!
                  </p>
                </Card>
              )}

              {/* Process Checklist Section */}
              <Card className="p-5 shadow-sm" data-testid="card-checklist">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <h3 className="text-md font-semibold text-foreground">
                    My Process Checklist
                  </h3>
                </div>

                {weeklyData.checklist.daysCount > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Practices done on {weeklyData.checklist.daysCount} days this week
                    </p>

                    {weeklyData.checklist.mostDone.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          Most Done:
                        </h4>
                        <ul className="space-y-1">
                          {weeklyData.checklist.mostDone.map(([practice, count]: [string, number], idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {practice} ({count}×)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No checklist practices completed this week.
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Monthly View */}
          {viewMode === "monthly" && monthlyData && (
            <Card className="p-5 shadow-sm" data-testid="card-monthly-progress">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                📅 {getMonthName()} {new Date().getFullYear()} Progress
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Your practice journey this month
              </p>

              {/* Playlist Practices */}
              {monthlyData.playlist.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-purple-500" />
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
                    <CheckSquare className="w-4 h-4 text-green-500" />
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
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                  <p className="text-sm italic text-center text-foreground/80">
                    ✨ "You came back again and again. That's growth."
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
