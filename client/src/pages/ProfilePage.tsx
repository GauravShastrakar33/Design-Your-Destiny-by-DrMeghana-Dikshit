import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
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
import {
  isNativePlatform,
  checkNativePermissionStatus,
  requestNativePushPermission,
  setupNativePushListeners,
} from "@/lib/nativePush";
import { Card, CardContent } from "@/components/ui/card";
import type { UserWellnessProfile } from "@shared/schema";
import ConsistencyCalendar from "@/components/ConsistencyCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/BadgeIcon";
import { Award } from "lucide-react";
import { App } from "@capacitor/app";

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

  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const info = await App.getInfo();
        setAppVersion(`Version ${info.version} (Build ${info.build})`);
      } catch {
        // Web fallback
        setAppVersion("Web Version");
      }
    };

    loadVersion();
  }, []);

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
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
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

    // Set up native push listeners on mount (no-op on web)
    setupNativePushListeners();

    // Check notification status - combines OS permission + backend status
    const checkNotificationStatus = async () => {
      // First check backend status (DB source of truth for enabled state)
      const backendEnabled = await getNotificationStatus();

      // On native platform, also verify OS permission is still granted
      if (isNativePlatform()) {
        const osPermission = await checkNativePermissionStatus();
        // Only show as enabled if BOTH backend says enabled AND OS permission is granted
        setNotificationsEnabled(backendEnabled && osPermission === "granted");
      } else {
        // On web, check browser permission too
        const browserGranted =
          "Notification" in window && Notification.permission === "granted";
        setNotificationsEnabled(backendEnabled && browserGranted);
      }
    };
    checkNotificationStatus();

    // Listen for native push registration events to update UI
    const handleNativePushRegistered = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("📱 Native push registered event:", customEvent.detail);
      if (customEvent.detail?.success) {
        // Re-check status from backend after successful registration
        const enabled = await getNotificationStatus();
        setNotificationsEnabled(enabled);
        setNotificationsLoading(false);
      }
    };

    window.addEventListener("nativePushRegistered", handleNativePushRegistered);

    return () => {
      window.removeEventListener(
        "nativePushRegistered",
        handleNativePushRegistered
      );
    };
  }, []);

  // Carousel Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [earnedBadges]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

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
        setNotificationsLoading(false);
      } else {
        // Enable: request permission based on platform
        if (isNativePlatform()) {
          // Native (Android/iOS): use Capacitor push notifications
          console.log("📱 Requesting native push permission...");
          const success = await requestNativePushPermission();

          if (!success) {
            // Permission denied or error
            setNotificationsLoading(false);
            alert(
              "Unable to enable notifications. Please check your device settings."
            );
            return;
          }

          // On native, the token registration happens async in the listener
          // The UI will update when we receive the 'nativePushRegistered' event
          // Keep loading state active until event is received (or timeout)
          setTimeout(async () => {
            // Fallback: check status after 5 seconds if event wasn't received
            const enabled = await getNotificationStatus();
            if (isNativePlatform()) {
              const osPermission = await checkNativePermissionStatus();
              setNotificationsEnabled(enabled && osPermission === "granted");
            } else {
              setNotificationsEnabled(enabled);
            }
            setNotificationsLoading(false);
          }, 5000);
        } else {
          // Web: use Firebase web SDK
          const success = await requestNotificationPermission();
          // Re-fetch status from DB regardless to ensure UI matches DB state
          const enabled = await getNotificationStatus();
          const browserGranted =
            "Notification" in window && Notification.permission === "granted";
          setNotificationsEnabled(enabled && browserGranted);
          setNotificationsLoading(false);

          if (!success && !enabled) {
            alert(
              "Unable to enable notifications. Please check your browser settings."
            );
          }
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      // Re-fetch to ensure UI matches DB state even on error
      const enabled = await getNotificationStatus();
      setNotificationsEnabled(enabled);
      setNotificationsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const words = name
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (words.length === 0) return "";
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return words.map((w) => w[0].toUpperCase()).join("");
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F3F3F3" }}>
      {/* White Header Section */}
      <Header title="Profile" />

      {/* Profile Card */}
      <div className="max-w-md mx-auto px-4 mt-2">
        <div className="bg-white rounded-xl shadow-md p-4 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-white flex items-center justify-center text-white text-sm font-bold border border-white/30 shadow-sm flex-shrink-0">
              {getInitials(userName)}
            </div>
            <h2
              className="text-lg font-['Poppins'] font-semibold text-gray-600 dark:text-gray-200 tracking-tight"
              data-testid="text-username"
            >
              {userName}
            </h2>
          </div>

          {/* Karmic Affirmation Section */}
          {!isLoadingProfile && wellnessProfile?.karmicAffirmation && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <p className="text-md text-primary font-semibold">
                    Karmic Affirmation
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 italic">
                    "{wellnessProfile.karmicAffirmation}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Earned Badges Section */}
          {!isLoadingBadges && earnedBadges.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-muted-foreground">Earned Badges</p>
              <div className="relative group -mx-4">
                <button
                  onClick={() => scroll("left")}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white shadow-md border hover:bg-gray-50 transition-all duration-200 ${
                    canScrollLeft
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-2 pointer-events-none"
                  }`}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                <div
                  ref={scrollRef}
                  onScroll={checkScroll}
                  className="flex items-center justify-start gap-2 overflow-x-auto scroll-smooth py-2 px-10 [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.badgeKey}
                      className="flex-shrink-0 w-[calc((100%-16px)/3)] flex justify-center snap-center"
                    >
                      <BadgeIcon
                        badgeKey={badge.badgeKey}
                        size="2xl"
                        earned
                        showTooltip
                        className="!w-full !h-auto aspect-square"
                      />
                    </div>
                  ))}
                  <div className="w-1 flex-shrink-0" />
                </div>

                <button
                  onClick={() => scroll("right")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white shadow-md border hover:bg-gray-50 transition-all duration-200 ${
                    canScrollRight
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-2 pointer-events-none"
                  }`}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Cards Container */}
      <div className="max-w-md mx-auto px-4 py-3 space-y-3">
        {/* Consistency Calendar */}
        <div className="relative">
          <ConsistencyCalendar />
        </div>

        {/* My Prescription Card */}
        <div
          className="bg-white rounded-xl shadow-md overflow-hidden"
          data-testid="card-prescription"
        >
          <button
            onClick={() => setPrescriptionExpanded(!prescriptionExpanded)}
            className="w-full text-left p-5 hover-elevate active-elevate-2"
            data-testid="button-prescription"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-md font-semibold text-primary-text mb-2">
                  My Prescription
                </h3>
                <p className="text-gray-700 text-sm">
                  View your personalized daily practices
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <Heart className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-end mt-3">
              <ChevronDown
                className={`w-5 h-5 text-[#703DFA] transition-transform ${
                  prescriptionExpanded ? "rotate-180" : ""
                }`}
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
          className="bg-white rounded-xl shadow-md overflow-hidden"
          data-testid="card-settings"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-md font-semibold text-primary-text mb-2">
                  Settings
                </h3>
                <p className="text-gray-700 text-sm">
                  Manage your account and preferences
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setLocation("/account-settings")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-account"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
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
                  <Award className="w-5 h-5 text-primary" />
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
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      Enable Notifications
                    </p>
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
                  <Phone className="w-5 h-5 text-primary" />
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

              <div className="w-full flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Circle className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">App Version</p>
                    <p className="text-xs text-muted-foreground">
                      {appVersion || "Loading..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
