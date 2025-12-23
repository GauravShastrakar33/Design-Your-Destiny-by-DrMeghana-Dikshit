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
import ConsistencyCalendar from "@/components/ConsistencyCalendar";

interface PrescriptionData {
  morning?: string[];
  afternoon?: string[];
  evening?: string[];
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [prescriptionExpanded, setPrescriptionExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [userName, setUserName] = useState("UserName");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const userToken = localStorage.getItem("@app:user_token");
  const { data: wellnessProfile, isLoading: isLoadingProfile } = useQuery<
    UserWellnessProfile | { karmicAffirmation: null; prescription: null }
  >({
    queryKey: ["/api/v1/me/wellness-profile"],
    queryFn: async () => {
      const response = await fetch("/api/v1/me/wellness-profile", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (!response.ok) {
        return { karmicAffirmation: null, prescription: null };
      }
      return response.json();
    },
    enabled: !!userToken,
  });

  const prescriptionFromApi =
    (wellnessProfile?.prescription as PrescriptionData) || {};
  const hasPrescription =
    prescriptionFromApi.morning?.length ||
    prescriptionFromApi.afternoon?.length ||
    prescriptionFromApi.evening?.length;

  // Load from localStorage on mount
  useEffect(() => {
    const savedUserName = localStorage.getItem("@app:userName");
    setUserName(savedUserName || "UserName");
  }, []);

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
        {/* Consistency Calendar */}
        <div className="relative">
          <ConsistencyCalendar />
        </div>

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
                <p
                  className="text-muted-foreground italic text-sm text-center py-2"
                  data-testid="text-prescription-empty"
                >
                  Your personalized practices will appear here.
                </p>
              ) : (
                <>
                  {prescriptionFromApi.morning &&
                    prescriptionFromApi.morning.length > 0 && (
                      <div
                        className="flex items-start gap-3"
                        data-testid="prescription-morning"
                      >
                        <Sunrise className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Morning: </span>
                          {prescriptionFromApi.morning.join(" • ")}
                        </p>
                      </div>
                    )}
                  {prescriptionFromApi.afternoon &&
                    prescriptionFromApi.afternoon.length > 0 && (
                      <div
                        className="flex items-start gap-3"
                        data-testid="prescription-afternoon"
                      >
                        <Sun className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Afternoon: </span>
                          {prescriptionFromApi.afternoon.join(" • ")}
                        </p>
                      </div>
                    )}
                  {prescriptionFromApi.evening &&
                    prescriptionFromApi.evening.length > 0 && (
                      <div
                        className="flex items-start gap-3"
                        data-testid="prescription-evening"
                      >
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
