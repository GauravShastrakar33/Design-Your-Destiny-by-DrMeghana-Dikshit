import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronDown,
  Settings as SettingsIcon,
  Bell,
  BellOff,
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
  Check,
  Sun,
  Loader2,
  Phone,
  User,
} from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationStatus,
  unregisterDeviceTokens,
} from "@/lib/notifications";
import { Card, CardContent } from "@/components/ui/card";
import type { UserWellnessProfile } from "@shared/schema";
import ConsistencyCalendar from "@/components/ConsistencyCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Award } from "lucide-react";

interface PrescriptionData {
  morning?: string[];
  afternoon?: string[];
  evening?: string[];
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [prescriptionExpanded, setPrescriptionExpanded] = useState(false);
  const [userName, setUserName] = useState("UserName");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

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

  const { badges, isLoading: isLoadingBadges } = useBadges();
  const earnedBadges = badges.slice(0, 5);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUserName = localStorage.getItem("@app:userName");
    setUserName(savedUserName || "UserName");

    // Check notification status from backend (DB source of truth)
    const checkNotificationStatus = async () => {
      const enabled = await getNotificationStatus();
      setNotificationsEnabled(enabled);
    };
    checkNotificationStatus();
  }, []);

  const handleToggleNotifications = async () => {
    setNotificationsLoading(true);
    try {
      if (notificationsEnabled) {
        // Disable: unregister device tokens from backend
        const success = await unregisterDeviceTokens();
        if (!success) {
          console.error("Failed to unregister device tokens");
        }
        // Re-fetch status from DB to update toggle
        const enabled = await getNotificationStatus();
        setNotificationsEnabled(enabled);
      } else {
        // Enable: request browser permission → get FCM token → register
        const success = await requestNotificationPermission();
        // Re-fetch status from DB regardless to ensure UI matches DB state
        const enabled = await getNotificationStatus();
        setNotificationsEnabled(enabled);
        if (!success && !enabled) {
          alert(
            "Unable to enable notifications. Please check your browser settings.",
          );
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      // Re-fetch to ensure UI matches DB state even on error
      const enabled = await getNotificationStatus();
      setNotificationsEnabled(enabled);
    } finally {
      setNotificationsLoading(false);
    }
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

      {/* Profile Card */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-white flex items-center justify-center text-white text-sm font-bold border border-white/30 shadow-sm flex-shrink-0">
              {getInitials(userName)}
            </div>
            <h2 className="text-lg font-['Poppins'] font-semibold text-gray-600 dark:text-gray-200 tracking-tight" data-testid="text-username">
              {userName}
            </h2>
          </div>

          {/* Earned Badges Section */}
          {!isLoadingBadges && earnedBadges.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-muted-foreground mb-2">
                Earned Badges
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {earnedBadges.map((badge) => (
                  <BadgeIcon
                    key={badge.badgeKey}
                    badgeKey={badge.badgeKey}
                    size="lg"
                    earned
                    showTooltip
                  />
                ))}
              </div>
            </div>
          )}
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
              <button
                onClick={() => setLocation("/account-settings")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-account"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#703DFA]" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Account</p>
                    <p className="text-xs text-muted-foreground">
                      Manage your account settings
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => setLocation("/badges")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-badges-settings"
              >
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#703DFA]" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Badges</p>
                    <p className="text-xs text-muted-foreground">
                      View your journey and achievements
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={handleToggleNotifications}
                disabled={notificationsLoading}
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-notifications-settings"
              >
                <div className="flex items-center gap-3">
                  {notificationsEnabled ? (
                    <Bell className="w-5 h-5 text-[#703DFA]" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-foreground">Enable Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      {notificationsLoading
                        ? "Enabling..."
                        : notificationsEnabled
                          ? "Push notifications enabled"
                          : "Tap to enable push notifications"}
                    </p>
                  </div>
                </div>
                {notificationsLoading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : notificationsEnabled ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <a
                href="tel:+919920115400"
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-support"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#703DFA]" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">Get Support</p>
                    <p className="text-xs text-muted-foreground">
                      +91 99201 15400
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </a>

              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-logout"
                onClick={async () => {
                  try {
                    await unregisterDeviceTokens();
                  } catch (e) {
                    // Continue with logout even if token unregister fails
                  }
                  logout();
                  setLocation("/login");
                }}
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
