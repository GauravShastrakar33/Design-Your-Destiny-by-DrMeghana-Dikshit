import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { UserWellnessProfile } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function AccountSettingsPage() {
  const [, setLocation] = useLocation();
  const { user, clearPasswordChangeRequirement, requiresPasswordChange } = useAuth();
  const userToken = localStorage.getItem("@app:user_token");

  const [userName, setUserName] = useState("");
  const [originalUserName, setOriginalUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

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

  useEffect(() => {
    const savedUserName = localStorage.getItem("@app:userName") || "UserName";
    setUserName(savedUserName);
    setOriginalUserName(savedUserName);
  }, []);

  // Auto-open password form if user needs to change password
  useEffect(() => {
    if (requiresPasswordChange) {
      setShowPasswordForm(true);
    }
  }, [requiresPasswordChange]);

  const handleSaveName = async () => {
    if (!userName.trim()) return;
    setIsSavingName(true);
    try {
      const response = await apiRequest("PUT", "/api/v1/me/name", {
        name: userName.trim(),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to update name:", data.error);
        return;
      }

      const data = await response.json();
      localStorage.setItem("@app:userName", data.name);
      setOriginalUserName(data.name);
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelNameEdit = () => {
    setUserName(originalUserName);
    setIsEditingName(false);
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
      setShowPasswordForm(false);
      
      // Clear forced password change requirement if it was set
      clearPasswordChangeRequirement();
    } catch (error) {
      setPasswordError("Failed to change password. Please try again.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F3F3F3" }}>
      <Header
        title="Account"
        hasBackButton={true}
        onBack={() => setLocation("/profile")}
      />

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Forced Password Change Warning */}
        {requiresPasswordChange && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 text-lg">⚠</span>
            </div>
            <div>
              <p className="font-medium text-amber-800">Password Change Required</p>
              <p className="text-sm text-amber-700 mt-1">
                Your password has been reset by an administrator. Please change your password to continue using the app.
              </p>
            </div>
          </div>
        )}
        
        {/* Username Section */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <Label className="text-sm font-medium text-gray-700">Username</Label>
          <div className="mt-2">
            {isEditingName ? (
              <div className="space-y-3">
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  data-testid="input-username"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName || !userName.trim()}
                    className="flex-1"
                    data-testid="button-save-username"
                  >
                    {isSavingName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelNameEdit}
                    data-testid="button-cancel-username"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p
                  className="text-foreground font-medium"
                  data-testid="text-username"
                >
                  {userName}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                  data-testid="button-edit-username"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <div className="mt-2">
            <p className="text-foreground font-medium" data-testid="text-email">
              {user?.email || "Not available"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact support to change email
            </p>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <Label className="text-sm font-medium text-gray-700">
            Change Password
          </Label>
          <div className="mt-2">
            {!showPasswordForm ? (
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(true)}
                className="w-full"
                data-testid="button-change-password"
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-500">
                    Password changed successfully!
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword}
                    className="flex-1"
                    data-testid="button-save-password"
                  >
                    {isSavingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Password"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                    }}
                    data-testid="button-cancel-password"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Karmic Affirmation Section */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#703DFA]" />
            <Label className="text-sm font-medium text-gray-700">
              Karmic Affirmation
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Assigned by Dr.M</p>
          {isLoadingProfile ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : wellnessProfile?.karmicAffirmation ? (
            <p
              className="text-foreground font-['Playfair_Display'] text-base leading-normal tracking-wide"
              data-testid="text-affirmation"
            >
              {wellnessProfile.karmicAffirmation}
            </p>
          ) : (
            <p
              className="text-muted-foreground italic text-sm"
              data-testid="text-affirmation-empty"
            >
              Your personalized affirmation will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
