import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronDown,
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
  Sparkles,
  Heart,
  Edit2,
  Check,
  X,
  Sun,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { UserWellnessProfile } from "@shared/schema";

interface PrescriptionData {
  morning?: string[];
  afternoon?: string[];
  evening?: string[];
}

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
  const [prescriptionExpanded, setPrescriptionExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [userName, setUserName] = useState("UserName");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const userToken = localStorage.getItem("@app:user_token");
  const { data: wellnessProfile, isLoading: isLoadingProfile } = useQuery<UserWellnessProfile | { karmicAffirmation: null; prescription: null }>({
    queryKey: ["/api/v1/me/wellness-profile"],
    queryFn: async () => {
      const response = await fetch("/api/v1/me/wellness-profile", {
        headers: {
          "Authorization": `Bearer ${userToken}`,
        },
      });
      if (!response.ok) {
        return { karmicAffirmation: null, prescription: null };
      }
      return response.json();
    },
    enabled: !!userToken,
  });

  const prescriptionFromApi = (wellnessProfile?.prescription as PrescriptionData) || {};
  const hasPrescription = prescriptionFromApi.morning?.length || prescriptionFromApi.afternoon?.length || prescriptionFromApi.evening?.length;

  // Load from localStorage on mount
  useEffect(() => {
    const savedStartDate = localStorage.getItem("streakStartDate");
    const savedStreakVisible = localStorage.getItem("streakVisible");
    const savedStreakData = localStorage.getItem("streakData");
    const savedUserName = localStorage.getItem("@app:userName");

    setStartDate(savedStartDate || "2025-01-01");
    setStreakVisible(
      savedStreakVisible === null ? true : savedStreakVisible === "true",
    );
    setStreakData(
      savedStreakData
        ? JSON.parse(savedStreakData)
        : generateInitialStreakData(),
    );
    setUserName(savedUserName || "UserName");
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

  const handleEditName = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem("@app:userName", tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setTempName("");
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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
  const bestStreak = 45;

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

  // ✅ Sort each month by actual day number (fixes 31 appearing first)
  for (const month in daysByMonth) {
    daysByMonth[month].sort((a, b) => {
      return new Date(a.date).getDate() - new Date(b.date).getDate();
    });
  }

  const hardcodedGreenDates = [
    // October 2025
    "2025-10-01",
    "2025-10-02",
    "2025-10-03",
    "2025-10-04",
    "2025-10-05",
    "2025-10-06",
    "2025-10-07",
    "2025-10-08",
    "2025-10-09",
    "2025-10-10",
    "2025-10-11",
    "2025-10-12",
    "2025-10-13",
    "2025-10-14",
    "2025-10-15",
    "2025-10-16",
    "2025-10-17",
    "2025-10-18",
    "2025-10-19",
    "2025-10-20",
    "2025-10-21",
    "2025-10-22",
    "2025-10-23",
    "2025-10-24",
    "2025-10-25",
    "2025-10-26",
    "2025-10-27",
    "2025-10-28",
    "2025-10-29",
    "2025-10-30",
    "2025-10-31",

    // November 2025
    "2025-11-01",
    "2025-11-02",
    "2025-11-03",
    "2025-11-04",
    "2025-11-05",
    "2025-11-06",
    "2025-11-07",
    "2025-11-08",
    "2025-11-09",
    "2025-11-10",
    "2025-11-11",
    "2025-11-12",
    "2025-11-13",
    "2025-11-14",
  ];

  // 🎯 Apply final hardcoded + mixed + future logic
  for (const [month, days] of Object.entries(daysByMonth)) {
    days.forEach((day) => {
      const isFuture = new Date(day.date) > new Date("2025-11-14"); // today

      // 2️⃣ YOUR 25-DAY STREAK (OCT 1 → NOV 14)
      if (hardcodedGreenDates.includes(day.date)) {
        day.status = "streak";
        return;
      }

      // 3️⃣ All future dates → GREY
      if (isFuture) {
        day.status = "neutral";
        return;
      }

      // 4️⃣ PRE-STREAK MIX LOGIC
      const seed = parseInt(day.date.replaceAll("-", ""));

      if (day.date.endsWith("-31")) {
        day.status = "neutral"; // or "missed"
        return;
      }

      if (seed % 3 === 0 || seed % 7 === 0) {
        day.status = "streak"; // green
      } else {
        day.status = "missed"; // red
      }
    });
  }

  // 🚨 FINAL SAFETY OVERRIDE — NOTHING CAN OVERRIDE THIS
  for (const m in daysByMonth) {
    daysByMonth[m].forEach((day) => {
      if (day.date === "2025-12-31") {
        day.status = "neutral"; // FORCE GREY
      }
    });
  }

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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F3F3F3" }}>
      {/* White Header Section */}
      <div className="bg-white border-b py-4 px-4">
        <div className="flex items-center">
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase">
              PROFILE
            </h1>
          </div>
        </div>
      </div>

      {/* Profile Card - Full Width */}
      <div className="bg-white border rounded-xl mt-2 mx-2 sm:mx-6">
        <div className="max-w-sm mx-auto px-3 py-3 relative">
          {/* Edit button at top right */}
          {!isEditingName && (
            <button
              onClick={handleEditName}
              className="absolute top-3 right-3 p-1.5 hover:bg-white/50 rounded-lg transition"
              data-testid="button-edit-name"
            >
              <Edit2 className="w-4 h-4 text-brand" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-white flex items-center justify-center text-white text-xl font-bold border-2 border-white/30 shadow-md flex-shrink-0">
              {getInitials(userName)}
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-foreground bg-white"
                    placeholder="Enter your name"
                    autoFocus
                    data-testid="input-username"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 bg-brand text-white rounded-lg hover:bg-brand/90"
                    data-testid="button-save-name"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <h2 className="text-xl font-['Poppins'] font-semibold text-gray-600 dark:text-gray-200 tracking-tight">
                  {userName}
                </h2>
              )}
            </div>
          </div>
          <div className="mt-1">
            <p className="text-lg text-muted-foreground mb-2 text-center">
              My Karmic Affirmation
            </p>

            {isLoadingProfile ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : wellnessProfile?.karmicAffirmation ? (
              <p
                className="text-foreground font-['Playfair_Display'] text-base sm:text-lg leading-normal tracking-wide"
                data-testid="text-affirmation"
              >
                {wellnessProfile.karmicAffirmation}
              </p>
            ) : (
              <p
                className="text-muted-foreground italic text-sm text-center"
                data-testid="text-affirmation-empty"
              >
                Your personalized affirmation will appear here.
              </p>
            )}
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
                    <span className="text-green-600 font-semibold ml-3">
                      {bestStreak} Days
                    </span>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* My Prescription Card */}
        <div
          className="bg-white rounded-2xl shadow-md overflow-hidden"
          data-testid="card-prescription"
        >
          <button
            onClick={() => setPrescriptionExpanded(!prescriptionExpanded)}
            className="w-full text-left p-5 hover-elevate active-elevate-2"
            data-testid="button-prescription"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-black text-sm font-bold tracking-wider uppercase mb-2">
                  MY PRESCRIPTION
                </h3>
                <p className="text-gray-700 text-sm">
                  View your personalized daily practices
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <Heart className="w-6 h-6 text-[#703DFA]" />
              </div>
            </div>
            <div className="flex items-center justify-end mt-3">
              <ChevronDown
                className={`w-5 h-5 text-[#703DFA] transition-transform ${prescriptionExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {prescriptionExpanded && (
            <div className="px-5 pb-5 space-y-3">
              {isLoadingProfile ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : !hasPrescription ? (
                <p className="text-muted-foreground italic text-sm text-center py-2" data-testid="text-prescription-empty">
                  Your personalized practices will appear here.
                </p>
              ) : (
                <>
                  {prescriptionFromApi.morning && prescriptionFromApi.morning.length > 0 && (
                    <div className="flex items-start gap-3" data-testid="prescription-morning">
                      <Sunrise className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Morning: </span>
                        {prescriptionFromApi.morning.join(" • ")}
                      </p>
                    </div>
                  )}
                  {prescriptionFromApi.afternoon && prescriptionFromApi.afternoon.length > 0 && (
                    <div className="flex items-start gap-3" data-testid="prescription-afternoon">
                      <Sun className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Afternoon: </span>
                        {prescriptionFromApi.afternoon.join(" • ")}
                      </p>
                    </div>
                  )}
                  {prescriptionFromApi.evening && prescriptionFromApi.evening.length > 0 && (
                    <div className="flex items-start gap-3" data-testid="prescription-evening">
                      <Moon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Evening: </span>
                        {prescriptionFromApi.evening.join(" • ")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Settings Card */}
        <div
          className="bg-white rounded-2xl shadow-md overflow-hidden"
          data-testid="card-settings"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-black text-sm font-bold tracking-wider uppercase mb-2">
                  SETTINGS
                </h3>
                <p className="text-gray-700 text-sm">
                  Manage your account and preferences
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <SettingsIcon className="w-6 h-6 text-[#703DFA]" />
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <button
                  onClick={() => setAccountExpanded(!accountExpanded)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                  data-testid="button-account"
                >
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="w-5 h-5 text-[#703DFA]" />
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
                  <Bell className="w-5 h-5 text-[#703DFA]" />
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
                  <MessageCircle className="w-5 h-5 text-[#703DFA]" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
