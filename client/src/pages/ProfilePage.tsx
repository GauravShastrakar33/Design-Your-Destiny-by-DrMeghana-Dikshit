import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Quote,
  Award,
  Zap,
  Info,
} from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationStatus,
  unregisterDeviceTokens,
} from "@/lib/notifications";
import {
  isNativePlatform,
  checkNativePermissionStatus,
  setPushEnabled,
  setupNativePushListeners,
} from "@/lib/nativePush";
import { Card, CardContent } from "@/components/ui/card";
import type { UserWellnessProfile } from "@shared/schema";
import ConsistencyCalendar from "@/components/ConsistencyCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/BadgeIcon";
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
  const [userName, setUserName] = useState("User");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const info = await App.getInfo();
        setAppVersion(`Version ${info.version} (Build ${info.build})`);
      } catch {
        setAppVersion("Web v1.0.0");
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
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!response.ok) return { karmicAffirmation: null, prescription: null };
      return response.json();
    },
    enabled: !!userToken,
  });

  const prescriptionFromApi =
    (wellnessProfile?.prescription as PrescriptionData) || {};
  const hasPrescription =
    (prescriptionFromApi?.morning?.length ?? 0) > 0 ||
    (prescriptionFromApi?.afternoon?.length ?? 0) > 0 ||
    (prescriptionFromApi?.evening?.length ?? 0) > 0;

  const { badges, isLoading: isLoadingBadges } = useBadges();
  const earnedBadges = badges.slice(0, 5);

  useEffect(() => {
    const savedUserName = localStorage.getItem("@app:userName");
    setUserName(savedUserName || "User");
    setupNativePushListeners();

    const checkStatus = async () => {
      const backendEnabled = await getNotificationStatus();
      if (isNativePlatform()) {
        const osPermission = await checkNativePermissionStatus();
        setNotificationsEnabled(backendEnabled && osPermission === "granted");
      } else {
        const browserGranted =
          "Notification" in window && Notification.permission === "granted";
        setNotificationsEnabled(backendEnabled && browserGranted);
      }
    };
    checkStatus();
  }, []);

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F9FAFB]">
      <Header title="Profile" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-md rounded-3xl overflow-hidden bg-white">
            <div className="p-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand/20 blur-md rounded-full" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-white shadow-inner flex items-center justify-center border border-indigo-50">
                    <span className="text-3xl font-black text-brand tracking-tighter">
                      {getInitials(userName)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-brand/10">
                    <Zap className="w-5 h-5 text-brand fill-brand" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {userName}
                  </h2>
                </div>
              </div>

              {/* Karmic Affirmation */}
              <AnimatePresence>
                {!isLoadingProfile && wellnessProfile?.karmicAffirmation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-5 border-gray-50"
                  >
                    <div className="relative pt-6 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 italic group">
                      <Quote className="absolute -top-3 left-4 w-7 h-7 text-brand/30 rotate-180" />
                      <div className="pl-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Karmic Affirmation
                        </p>
                        <p className="text-gray-700 leading-relaxed text-xs">
                          "{wellnessProfile.karmicAffirmation}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Earned Badges Carousel */}
            {!isLoadingBadges && earnedBadges.length > 0 && (
              <div className="px-8 pb-4 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Milestone Badges ({badges.length})
                  </p>
                  <button
                    onClick={() => setLocation("/badges")}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.badgeKey}
                      className="flex-shrink-0 w-20 flex flex-col items-center gap-2"
                    >
                      <BadgeIcon
                        badgeKey={badge.badgeKey}
                        size="xl"
                        earned
                        className="p-2 rounded-full shadow-md hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                  {badges.length > 5 && (
                    <div
                      onClick={() => setLocation("/badges")}
                      className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 font-bold cursor-pointer hover:border-brand/30 hover:text-brand/30 transition-all"
                    >
                      +{badges.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Consistency Calendar - Integrated into main flow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <ConsistencyCalendar />
        </motion.div>

        {/* My Prescription Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-md rounded-3xl overflow-hidden bg-white">
            <button
              onClick={() => setPrescriptionExpanded(!prescriptionExpanded)}
              className="w-full text-left p-6 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-500 shadow-sm group-hover:shadow-md transition-all">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-none">
                    Daily Prescription
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Your personalized practices
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                  prescriptionExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {prescriptionExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-8 space-y-4"
                >
                  {isLoadingProfile ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    </div>
                  ) : !hasPrescription ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-50 rounded-xl">
                      <p className="text-gray-400 italic text-sm">
                        Your personalized practices will appear here soon.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(prescriptionFromApi?.morning?.length ?? 0) > 0 && (
                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 flex items-start gap-4">
                          <Sunrise className="w-6 h-6 text-amber-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
                              Morning
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              {prescriptionFromApi?.morning?.join(" • ")}
                            </p>
                          </div>
                        </div>
                      )}
                      {(prescriptionFromApi?.afternoon?.length ?? 0) > 0 && (
                        <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100/50 flex items-start gap-4">
                          <Sun className="w-6 h-6 text-orange-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
                              Afternoon
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              {prescriptionFromApi?.afternoon?.join(" • ")}
                            </p>
                          </div>
                        </div>
                      )}
                      {(prescriptionFromApi?.evening?.length ?? 0) > 0 && (
                        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50 flex items-start gap-4">
                          <Moon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                              Evening
                            </p>
                            <p className="text-gray-700 text-sm font-medium">
                              {prescriptionFromApi?.evening?.join(" • ")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Global Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 px-2">
            <SettingsIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Settings & Preferences
            </h3>
          </div>

          <Card className="border-0 shadow-md rounded-3xl bg-white overflow-hidden divide-y divide-gray-50">
            {/* Account */}
            <button
              onClick={() => setLocation("/account-settings")}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 leading-none">
                    Account Detail
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Personal information & identity
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </button>

            {/* Badges */}
            <button
              onClick={() => setLocation("/badges")}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100 shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 leading-none">
                    Milestone Badges
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Your journey & achievements
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </button>

            {/* Support */}
            <a
              href="tel:+919920115400"
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 leading-none">
                    Get Support
                  </p>
                  <p className="text-xs text-brand font-bold mt-1 tracking-tight">
                    +91 99201 15400
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </a>

            {/* Logout */}
            <button
              onClick={async () => {
                try {
                  await unregisterDeviceTokens();
                } catch (e) {}
                logout();
                setLocation("/login");
              }}
              className="w-full flex items-center justify-between p-6 hover:bg-red-50/30 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-red-600 leading-none">Logout</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-red-300 transition-colors" />
            </button>

            {/* App Version */}
            <div className="w-full flex items-center justify-between p-6 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center border border-gray-100 shadow-sm">
                  <Info className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 leading-none">
                    App Version
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {appVersion || "Production Build v1.0.0"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Slogan Footer */}
          <div className="flex flex-col items-center gap-2 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Design Your Destiny
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
