import { useState, useEffect } from "react";
import { Edit2, ChevronRight, Settings as SettingsIcon, Bell, MessageCircle, LogOut, Eye, EyeOff, Calendar as CalendarIcon, Star, TrendingUp, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface StreakDay {
  date: string;
  status: "streak" | "missed" | "neutral";
}

interface StreakData {
  [date: string]: "streak" | "missed";
}

export default function ProfilePage() {
  const [affirmation, setAffirmation] = useState("");
  const [editingAffirmation, setEditingAffirmation] = useState(false);
  const [tempAffirmation, setTempAffirmation] = useState("");
  
  const [partner, setPartner] = useState("");
  const [editingPartner, setEditingPartner] = useState(false);
  const [tempPartner, setTempPartner] = useState("");
  
  const [streakVisible, setStreakVisible] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [streakData, setStreakData] = useState<StreakData>({});

  // Load from localStorage on mount
  useEffect(() => {
    const savedAffirmation = localStorage.getItem("karmicAffirmation");
    const savedPartner = localStorage.getItem("accountabilityPartner");
    const savedStartDate = localStorage.getItem("streakStartDate");
    const savedStreakVisible = localStorage.getItem("streakVisible");
    const savedStreakData = localStorage.getItem("streakData");
    
    setAffirmation(savedAffirmation || "I am aligned with my higher purpose, attracting peace and growth every day.");
    setPartner(savedPartner || "Amit");
    setStartDate(savedStartDate || "2025-01-01");
    setStreakVisible(savedStreakVisible === null ? true : savedStreakVisible === "true");
    setStreakData(savedStreakData ? JSON.parse(savedStreakData) : generateInitialStreakData());
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
        const dateStr = date.toISOString().split('T')[0];
        
        if (date < today) {
          // Use date as seed for consistent pattern
          const seed = (year * 10000 + month * 100 + day) % 100;
          if (seed > 30) {
            data[dateStr] = "streak";
          } else if (seed > 10) {
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

  const handleSaveAffirmation = () => {
    setAffirmation(tempAffirmation);
    localStorage.setItem("karmicAffirmation", tempAffirmation);
    setEditingAffirmation(false);
  };

  const handleSavePartner = () => {
    setPartner(tempPartner);
    localStorage.setItem("accountabilityPartner", tempPartner);
    setEditingPartner(false);
  };

  const handleSaveStartDate = () => {
    setStartDate(tempStartDate);
    localStorage.setItem("streakStartDate", tempStartDate);
    setEditingStartDate(false);
  };

  const toggleStreakVisibility = () => {
    const newValue = !streakVisible;
    setStreakVisible(newValue);
    localStorage.setItem("streakVisible", String(newValue));
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
        const dateStr = date.toISOString().split('T')[0];
        
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
    
    const today = new Date().toISOString().split('T')[0];
    const streakStartDate = new Date(startDate);
    const sortedDays = [...calendarDays]
      .filter(day => new Date(day.date) >= streakStartDate)
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

  const { currentStreak, bestStreak } = calculateStreaks();

  // Group days by month
  const daysByMonth = calendarDays.reduce((acc, day) => {
    const month = new Date(day.date).getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(day);
    return acc;
  }, {} as Record<number, StreakDay[]>);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarImage src="" alt="Gaurav Shastrakar" />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-2xl font-bold">
                  GS
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">Gaurav Shastrakar</h2>
                <p className="text-sm text-muted-foreground mt-1">Member Since 2023</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30">
                  <Star className="w-5 h-5 text-yellow-600 fill-yellow-600 animate-pulse" />
                  <span className="text-lg font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    33
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Stars from Dr.M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Karmic Affirmation */}
        <Card className="bg-gradient-to-br from-amber-50/50 to-blue-50/50 dark:from-amber-950/20 dark:to-blue-950/20 border-amber-200/50 dark:border-amber-800/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Karmic Affirmation</h3>
              <Dialog open={editingAffirmation} onOpenChange={setEditingAffirmation}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => {
                      setTempAffirmation(affirmation);
                      setEditingAffirmation(true);
                    }}
                    className="hover-elevate active-elevate-2 rounded-lg p-2"
                    data-testid="button-edit-affirmation"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-edit-affirmation">
                  <DialogHeader>
                    <DialogTitle>Edit Karmic Affirmation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="affirmation">Your Affirmation</Label>
                      <Textarea
                        id="affirmation"
                        value={tempAffirmation}
                        onChange={(e) => setTempAffirmation(e.target.value)}
                        className="mt-2"
                        rows={4}
                        data-testid="input-affirmation"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditingAffirmation(false)} data-testid="button-cancel-affirmation">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveAffirmation} data-testid="button-save-affirmation">
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-foreground italic font-serif leading-relaxed" data-testid="text-affirmation">
              "{affirmation}"
            </p>
          </CardContent>
        </Card>

        {/* Accountability Partner */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Accountability Partner</h3>
                <p className="text-foreground" data-testid="text-partner">{partner}</p>
              </div>
              <Dialog open={editingPartner} onOpenChange={setEditingPartner}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => {
                      setTempPartner(partner);
                      setEditingPartner(true);
                    }}
                    className="hover-elevate active-elevate-2 rounded-lg p-2"
                    data-testid="button-edit-partner"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-edit-partner">
                  <DialogHeader>
                    <DialogTitle>Edit Accountability Partner</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="partner">Partner Name</Label>
                      <Input
                        id="partner"
                        value={tempPartner}
                        onChange={(e) => setTempPartner(e.target.value)}
                        className="mt-2"
                        data-testid="input-partner"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditingPartner(false)} data-testid="button-cancel-partner">
                        Cancel
                      </Button>
                      <Button onClick={handleSavePartner} data-testid="button-save-partner">
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Streak Tracker */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">2025 Streak Tracker</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleStreakVisibility}
                  data-testid="button-toggle-streak"
                >
                  {streakVisible ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {streakVisible ? "Hide" : "Show"}
                </Button>
                <Dialog open={editingStartDate} onOpenChange={setEditingStartDate}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempStartDate(startDate);
                        setEditingStartDate(true);
                      }}
                      data-testid="button-change-start-date"
                    >
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Change Start
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-change-start-date">
                    <DialogHeader>
                      <DialogTitle>Change Start Date</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="mt-2"
                          data-testid="input-start-date"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setEditingStartDate(false)} data-testid="button-cancel-start-date">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveStartDate} data-testid="button-save-start-date">
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {streakVisible && (
              <>
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Your Consistency Map</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                    <span className="text-xs text-muted-foreground">Streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                    <span className="text-xs text-muted-foreground">Relapse</span>
                  </div>
                </div>

                {/* Calendar */}
                <div className="overflow-x-auto scrollbar-hide" data-testid="streak-calendar">
                  <div className="flex gap-6 pb-4">
                    {Object.entries(daysByMonth).map(([month, days]) => (
                      <div key={month} className="flex-shrink-0">
                        <h4 className="text-sm font-medium text-foreground mb-2">{monthNames[parseInt(month)]}</h4>
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

                {/* Streak Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">BEST STREAK</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent" data-testid="text-best-streak">
                      {bestStreak} Days
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">CURRENT STREAK</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent" data-testid="text-current-streak">
                      {currentStreak} Days
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
            <div className="space-y-1">
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-account"
              >
                <div className="flex items-center gap-3">
                  <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Account</p>
                    <p className="text-xs text-muted-foreground">Change your account settings</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-notifications-settings"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">Manage your notification preferences</p>
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
                    <p className="text-xs text-muted-foreground">Talk with our Coaches</p>
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
                    <p className="text-xs text-muted-foreground">Log out of your account</p>
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
