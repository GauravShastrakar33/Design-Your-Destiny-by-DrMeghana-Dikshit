import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UserWellnessProfile } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function AccountSettingsPage() {
  const [, setLocation] = useLocation();
  const { user, clearPasswordChangeRequirement, requiresPasswordChange } =
    useAuth();
  const userToken = localStorage.getItem("@app:user_token");
  const [userName, setUserName] = useState("");

  // Password Form States
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { data: wellnessProfile } = useQuery<
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

  useEffect(() => {
    const savedUserName = localStorage.getItem("@app:userName");
    setUserName(savedUserName || "User");
  }, []);

  // Auto-open password form if user needs to change password
  useEffect(() => {
    if (requiresPasswordChange) {
      setShowPasswordForm(true);
    }
  }, [requiresPasswordChange]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await apiRequest("POST", "/api/v1/me/change-password", {
        currentPassword,
        newPassword,
      });

      if (!response.ok) {
        const data = await response.json();
        setPasswordError(data.error || "Failed to change password");
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Keep it open for a moment to show success, then close
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(false);
      }, 2000);

      // Clear forced password change requirement if it was set
      clearPasswordChangeRequirement();
    } catch (error) {
      setPasswordError("Failed to change password. Please try again.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F9FAFB]">
      <Header
        title="Account Detail"
        hasBackButton={true}
        onBack={() => setLocation("/profile")}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Identity Card */}
          <Card className="border-0 shadow-md rounded-3xl overflow-hidden bg-white">
            <div className="p-4">
              <div className="flex items-center text-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand/20 blur-md rounded-full" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-white shadow-inner flex items-center justify-center border border-indigo-50">
                    <span className="text-4xl font-black text-brand tracking-tighter">
                      {getInitials(userName)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-brand/10">
                    <Zap className="w-5 h-5 text-brand fill-brand" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {userName}
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                  Personal Information
                </h3>

                <div className="grid gap-3">
                  {/* Name Display */}
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100/50">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 leading-none mb-1">
                        Full Name
                      </p>
                      <p className="text-gray-900 font-bold tracking-tight">
                        {userName}
                      </p>
                    </div>
                  </div>

                  {/* Email Display */}
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 leading-none mb-1">
                        Email Address
                      </p>
                      <p className="text-gray-900 font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
                        {user?.email || "Not available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 leading-relaxed mx-auto">
                  To update your personal information, please reach out to our
                  support team.
                </p>
              </div>
            </div>
          </Card>

          {/* Password Card */}
          <Card className="border-0 shadow-md rounded-3xl overflow-hidden bg-white">
            <div className="p-6 sm:p-8">
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm transition-colors group-hover:bg-amber-100">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-none">
                        Security Settings
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Change Password
                    </h3>
                  </div>

                  {requiresPasswordChange && (
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                      <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-amber-500" />
                        Action Required
                      </p>
                      <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                        An administrator has reset your password. Please choose
                        a new, secure password.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 ml-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="rounded-lg border-gray-100 h-12 pl-4 pr-12 focus:ring-brand"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 ml-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="rounded-lg border-gray-100 h-12 pl-4 pr-12 focus:ring-brand"
                            placeholder="Min 6 chars"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 ml-2">
                          Confirm New
                        </label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="rounded-lg border-gray-100 h-12 pl-4 pr-12 focus:ring-brand"
                            placeholder="Match new"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {passwordError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                      >
                        {passwordError}
                      </motion.div>
                    )}
                    {passwordSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Password changed successfully!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSavingPassword || passwordSuccess}
                      className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-200/50"
                    >
                      {isSavingPassword ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordError("");
                      }}
                      className="h-12 px-6 rounded-xl border-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Slogan Footer */}
          <div className="flex flex-col items-center gap-2 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                Design Your Destiny
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
