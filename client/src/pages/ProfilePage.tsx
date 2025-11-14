import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronRight,
  Settings as SettingsIcon,
  Bell,
  MessageCircle,
  LogOut,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Circle,
  Sunrise,
  Leaf,
  Moon,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakDay {
  date: string;
  status: "streak" | "missed" | "neutral";
}

interface StreakData {
  [date: string]: "streak" | "missed";
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [streakVisible, setStreakVisible] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [streakData, setStreakData] = useState<StreakData>({});
  const [accountExpanded, setAccountExpanded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedStartDate = localStorage.getItem("streakStartDate");
    const savedStreakVisible = localStorage.getItem("streakVisible");
    const savedStreakData = localStorage.getItem("streakData");

    setStartDate(savedStartDate || "2025-01-01");
    setStreakVisible(
      savedStreakVisible === null ? true : savedStreakVisible === "true",
    );
    setStreakData(
      savedStreakData
        ? JSON.parse(savedStreakData)
        : generateInitialStreakData(),
    );
  }, []);

  // Generate initial streak data (deterministic based on date)
  const generateInitialStreakData = (): StreakData => {
    const data: StreakData = {};
    const today = new Date();
    const year = 2025;

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split("T")[0];

        if (date < today) {
          // Use date as seed for consistent pattern
          // More green (streak) than red (missed)
          const seed = (year * 10000 + month * 100 + day) % 100;
          if (seed > 20) {
            data[dateStr] = "streak";
          } else if (seed > 5) {
            data[dateStr] = "missed";
          }
        } else if (date.toDateString() === today.toDateString()) {
          data[dateStr] = "streak";
        }
      }
    }

    localStorage.setItem("streakData", JSON.stringify(data));
    return data;
  };

  const toggleStreakVisibility = () => {
    const newValue = !streakVisible;
    setStreakVisible(newValue);
    localStorage.setItem("streakVisible", String(newValue));
  };

  const handleResetPOH = () => {
    if (
      confirm(
        "Are you sure you want to reset your Project of Heart? This will clear all POH progress and set stars to 0.",
      )
    ) {
      localStorage.removeItem("@app:poh_data");
      localStorage.removeItem("@app:weekly_action");
      alert("Project of Heart has been reset successfully.");
    }
  };

  const handleResetChecklist = () => {
    if (
      confirm(
        "Are you sure you want to reset your Process Checklist? This will remove your current selections and daily progress.",
      )
    ) {
      localStorage.removeItem("userChecklist");
      localStorage.removeItem("dailyLogs");
      setLocation("/process-checklist");
    }
  };

  const handleClearDrMChats = () => {
    if (
      confirm(
        "Are you sure you want to clear all your conversations with Dr.M? This cannot be undone.",
      )
    ) {
      localStorage.removeItem("@app:drm_conversations");
      alert("Dr.M chat history has been cleared successfully.");
    }
  };

  // Generate calendar days using persisted streak data and start date
  const generateCalendarDays = (): StreakDay[] => {
    const days: StreakDay[] = [];
    const today = new Date();
    const year = 2025;
    const streakStartDate = new Date(startDate);

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split("T")[0];

        let status: "streak" | "missed" | "neutral" = "neutral";

        // Only consider dates after start date
        if (date >= streakStartDate && date <= today) {
          status = streakData[dateStr] || "neutral";
        } else if (date > today) {
          status = "neutral";
        }

        days.push({ date: dateStr, status });
      }
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Calculate streaks based on persisted data and start date
  const calculateStreaks = () => {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split("T")[0];
    const streakStartDate = new Date(startDate);
    const sortedDays = [...calendarDays]
      .filter((day) => new Date(day.date) >= streakStartDate)
      .reverse();

    let foundCurrent = false;

    for (const day of sortedDays) {
      if (day.date > today) continue;

      if (day.status === "streak") {
        tempStreak++;
        if (!foundCurrent) {
          currentStreak = tempStreak;
        }
      } else if (day.status === "missed") {
        foundCurrent = true;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }

    return { currentStreak, bestStreak };
  };

  const streaks = calculateStreaks();
  // Override with specified values
  const currentStreak = 9;
  const bestStreak = 25;

  // Group days by month
  const daysByMonth = calendarDays.reduce(
    (acc, day) => {
      const month = new Date(day.date).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(day);
      return acc;
    },
    {} as Record<number, StreakDay[]>,
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* White Header Section */}
      <div className="bg-white border-b py-4">
        <h1 className="text-center text-gray-500 text-xl font-bold tracking-wider font-['Montserrat'] uppercase">
          PROFILE
        </h1>
      </div>

      {/* Profile Card - Full Width */}
      <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-amber-950/30 border-b border-purple-200/50 dark:border-purple-800/30 mt-2">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white/30 shadow-md flex-shrink-0">
              GS
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                Gaurav Shastrakar
              </h2>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg text-muted-foreground mb-2">
              My Karmic Affirmation
            </p>
            <p
              className="text-foreground font-['Playfair_Display'] text-base sm:text-lg leading-relaxed tracking-wide"
              data-testid="text-affirmation"
            >
              I trust the universe to guide me toward my highest purpose. Every
              challenge is an opportunity for growth, and I embrace it with
              grace and courage.
            </p>
          </div>
        </div>
      </div>

      {/* Other Cards Container */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Streak Tracker */}
        <Card className="bg-white border shadow-sm rounded-xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                Your Consistency Map 📈
              </h3>
              <button
                onClick={toggleStreakVisibility}
                className="p-1 hover:bg-gray-100 rounded-md transition"
              >
                {streakVisible ? (
                  <Eye className="w-5 h-5 text-gray-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {streakVisible && (
              <>
                {/* Legend */}
                <div className="flex justify-end gap-4 text-xs mb-4">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">Streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600">Missed</span>
                  </div>
                </div>

                {/* Calendar */}
                <div
                  className="overflow-x-auto scrollbar-hide"
                  data-testid="streak-calendar"
                >
                  <div className="flex gap-6 pb-4">
                    {Object.entries(daysByMonth).map(([month, days]) => (
                      <div key={month} className="flex-shrink-0">
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          {monthNames[parseInt(month)]}
                        </h4>
                        <div className="grid grid-cols-7 gap-1">
                          {days.map((day) => {
                            const dayNum = new Date(day.date).getDate();
                            return (
                              <div
                                key={day.date}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                                  day.status === "streak"
                                    ? "bg-green-500 text-white"
                                    : day.status === "missed"
                                      ? "bg-red-500 text-white"
                                      : "bg-muted text-muted-foreground"
                                }`}
                                data-testid={`day-${day.date}`}
                              >
                                {dayNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Streak Section */}
                <div className="mt-4 text-left">
                  <p className="text-sm text-gray-500 tracking-wide">
                    BEST STREAK ----&gt;{" "}
                    <span className="text-green-600 font-semibold">
                      {bestStreak} Days
                    </span>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Card */}
        <div
          className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 shadow-md relative"
          data-testid="card-ai-insights"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-white text-lg font-bold mb-1">
                AI Insights ✨
              </h3>
              <p className="text-white/90 text-xs">
                Receive personalised insights for your streak
              </p>
            </div>
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-white/70 text-[11px] mt-2">Unlocks in 7 days</p>
          <button
            onClick={() => setLocation("/ai-insights")}
            className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-semibold rounded-xl backdrop-blur-sm transition"
            data-testid="button-ai-insights"
          >
            View Insights
          </button>
        </div>

        {/* Prescription Card */}
        <Card className="bg-[#f5fff8] dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              My Prescription
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Sunrise className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Morning:</span> USM Practice +
                  Gratitude Journal
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Afternoon:</span> 15-min Money
                  Meditation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Evening:</span> Project of
                  Heart Reflection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Settings
            </h3>
            <div className="space-y-1">
              <div>
                <button
                  onClick={() => setAccountExpanded(!accountExpanded)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                  data-testid="button-account"
                >
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">Account</p>
                      <p className="text-xs text-muted-foreground">
                        Change your account settings
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-muted-foreground transition-transform ${accountExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                {accountExpanded && (
                  <div className="pl-11 pr-3 py-2 space-y-2">
                    <button
                      onClick={handleResetPOH}
                      className="w-full text-left p-3 rounded-lg hover-elevate active-elevate-2 border border-red-200 dark:border-red-800/30"
                      data-testid="button-reset-poh"
                    >
                      <p className="font-medium text-red-600 dark:text-red-400">
                        Reset Project of Heart
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clear all POH progress (for demonstration)
                      </p>
                    </button>
                    <button
                      onClick={handleResetChecklist}
                      className="w-full text-left p-3 rounded-lg hover-elevate active-elevate-2 border border-red-200 dark:border-red-800/30"
                      data-testid="button-reset-checklist"
                    >
                      <p className="font-medium text-red-600 dark:text-red-400">
                        Reset Process Checklist
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clear checklist and daily progress
                      </p>
                    </button>
                    <button
                      onClick={handleClearDrMChats}
                      className="w-full text-left p-3 rounded-lg hover-elevate active-elevate-2 border border-orange-200 dark:border-orange-800/30"
                      data-testid="button-clear-drm-chats"
                    >
                      <p className="font-medium text-orange-600 dark:text-orange-400">
                        Clear Dr.M Chat History
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Delete all conversations with Dr.M avatar
                      </p>
                    </button>
                  </div>
                )}
              </div>

              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-notifications-settings"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Manage your notification preferences
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-support"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Get Support</p>
                    <p className="text-xs text-muted-foreground">
                      Talk with our Coaches
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-logout"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <p className="font-medium text-red-500">Logout</p>
                    <p className="text-xs text-muted-foreground">
                      Log out of your account
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
