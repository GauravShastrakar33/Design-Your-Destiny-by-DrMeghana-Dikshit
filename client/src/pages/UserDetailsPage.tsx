import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Sparkles,
  Pill,
  Plus,
  X,
  Loader2,
  Sunrise,
  Sun,
  Moon,
  Save,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  UserWithPrograms,
  UserWellnessProfile,
  UserBadge,
} from "@shared/schema";
import { BADGE_REGISTRY, getBadgeSvgPath } from "@/lib/badgeRegistry";
import { cn } from "@/lib/utils";

interface PrescriptionData {
  morning?: string[];
  afternoon?: string[];
  evening?: string[];
}

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [karmicAffirmation, setKarmicAffirmation] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionData>({});
  const [hasChanges, setHasChanges] = useState(false);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: student, isLoading: isLoadingStudent } =
    useQuery<UserWithPrograms>({
      queryKey: ["/admin/v1/students", userId],
      queryFn: async () => {
        const response = await fetch(`/admin/v1/students/${userId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch student");
        return response.json();
      },
      enabled: !!userId,
    });

  const { data: wellnessProfile, isLoading: isLoadingProfile } = useQuery<
    UserWellnessProfile | { karmicAffirmation: null; prescription: null }
  >({
    queryKey: ["/admin/v1/users", userId, "wellness-profile"],
    queryFn: async () => {
      const response = await fetch(
        `/admin/v1/users/${userId}/wellness-profile`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch wellness profile");
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: earnedBadgeKeys = [], isLoading: isLoadingBadges } = useQuery<
    string[]
  >({
    queryKey: ["/admin/v1/students", userId, "badges"],
    queryFn: async () => {
      const response = await fetch(`/admin/v1/students/${userId}/badges`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user badges");
      const data = await response.json();
      return (data.badges ?? []).map((b: UserBadge) => b.badgeKey);
    },
    enabled: !!userId,
  });

  const grantBadgeMutation = useMutation({
    mutationFn: async (badgeKey: string) => {
      const token = localStorage.getItem("@app:admin_token");
      if (!token) {
        throw new Error("Admin session expired. Please log in again.");
      }
      const response = await fetch(`/admin/v1/students/${userId}/badges`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ badgeKey }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Admin session expired. Please log in again.");
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to grant badge");
      }
      return response.json();
    },
    onSuccess: (_, badgeKey) => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/students", userId, "badges"],
      });
      const badge = BADGE_REGISTRY.find((b) => b.key === badgeKey);
      toast({
        title: `${badge?.displayName || badgeKey} badge granted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
      if (error.message.includes("session expired")) {
        setLocation("/admin/login");
      }
    },
  });

  useEffect(() => {
    if (wellnessProfile) {
      setKarmicAffirmation(wellnessProfile.karmicAffirmation || "");
      setPrescription((wellnessProfile.prescription as PrescriptionData) || {});
    }
  }, [wellnessProfile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanedPrescription: PrescriptionData = {};
      if (prescription.morning && prescription.morning.length > 0) {
        cleanedPrescription.morning = prescription.morning.filter(
          (item) => item.trim() !== ""
        );
      }
      if (prescription.afternoon && prescription.afternoon.length > 0) {
        cleanedPrescription.afternoon = prescription.afternoon.filter(
          (item) => item.trim() !== ""
        );
      }
      if (prescription.evening && prescription.evening.length > 0) {
        cleanedPrescription.evening = prescription.evening.filter(
          (item) => item.trim() !== ""
        );
      }

      if (cleanedPrescription.morning?.length === 0)
        delete cleanedPrescription.morning;
      if (cleanedPrescription.afternoon?.length === 0)
        delete cleanedPrescription.afternoon;
      if (cleanedPrescription.evening?.length === 0)
        delete cleanedPrescription.evening;

      await apiRequest("POST", `/admin/v1/users/${userId}/wellness-profile`, {
        karmicAffirmation: karmicAffirmation.trim() || null,
        prescription:
          Object.keys(cleanedPrescription).length > 0
            ? cleanedPrescription
            : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/users", userId, "wellness-profile"],
      });
      setHasChanges(false);
      toast({ title: "Wellness profile saved successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to save wellness profile",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = (section: keyof PrescriptionData) => {
    setPrescription((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), ""],
    }));
    setHasChanges(true);
  };

  const handleUpdateItem = (
    section: keyof PrescriptionData,
    index: number,
    value: string
  ) => {
    setPrescription((prev) => ({
      ...prev,
      [section]: (prev[section] || []).map((item, i) =>
        i === index ? value : item
      ),
    }));
    setHasChanges(true);
  };

  const handleRemoveItem = (section: keyof PrescriptionData, index: number) => {
    setPrescription((prev) => ({
      ...prev,
      [section]: (prev[section] || []).filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleKarmicChange = (value: string) => {
    setKarmicAffirmation(value);
    setHasChanges(true);
  };

  const isLoading = isLoadingStudent || isLoadingProfile || isLoadingBadges;

  const adminBadges = BADGE_REGISTRY.filter((b) => b.type === "admin");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Student not found</p>
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/users/students")}
        >
          Back to Students
        </Button>
      </div>
    );
  }

  const sectionConfig = [
    {
      key: "morning" as const,
      label: "Morning",
      icon: Sunrise,
      color: "text-amber-500",
    },
    {
      key: "afternoon" as const,
      label: "Afternoon",
      icon: Sun,
      color: "text-orange-500",
    },
    {
      key: "evening" as const,
      label: "Evening",
      icon: Moon,
      color: "text-indigo-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/users/students")}
            className="text-gray-500 hover:text-brand transition-colors bg-white shadow-sm border border-gray-100 h-9 px-3 rounded-lg"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <h1 className="text-xl font-bold text-gray-900 leading-none">
                User Details
              </h1>
            </div>
            <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
              <User className="w-3 h-3" />
              {student.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20 font-bold rounded-lg h-10 px-6 transition-all gap-2"
            data-testid="button-save"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Basic User Info (Read-Only) */}
        <Card
          className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative h-full"
          data-testid="card-user-info"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-md font-bold text-gray-900">
                  Basic Information
                </h2>
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-600 border-none font-bold text-xs tracking-wider px-2 py-0.5"
              >
                Read-only
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs font-semibold">
                  Name
                </Label>
                <p
                  className="text-gray-900 font-bold"
                  data-testid="text-user-name"
                >
                  {student.name}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs font-semibold">
                  Email
                </Label>
                <p
                  className="text-gray-900 font-bold break-all"
                  data-testid="text-user-email"
                >
                  {student.email}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs font-semibold">
                  Phone
                </Label>
                <p
                  className="text-gray-900 font-bold"
                  data-testid="text-user-phone"
                >
                  {student.phone || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs font-semibold">
                  Program
                </Label>
                <div
                  className="flex flex-wrap gap-1.5 mt-1"
                  data-testid="text-user-program"
                >
                  {student.programs.length > 0 ? (
                    student.programs.map((prog) => (
                      <Badge
                        key={prog}
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 font-bold border-none text-xs"
                      >
                        {prog}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 font-bold text-sm">-</span>
                  )}
                </div>
              </div>
              <div className="space-y-1 col-span-full">
                <Label className="text-gray-400 text-xs font-semibold">
                  Account Status
                </Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      student.status === "active" ? "default" : "destructive"
                    }
                    className={cn(
                      "font-bold text-xs tracking-wider px-2.5 py-0.5",
                      student.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                        : ""
                    )}
                    data-testid="badge-user-status"
                  >
                    {student.status === "active" ? "Active" : "Blocked"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Admin Badges (Grantable) */}
        <Card
          className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative h-full"
          data-testid="card-admin-badges"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-md font-bold text-gray-900">
                Special Recognition
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {adminBadges.map((badge) => {
                const isGranted = earnedBadgeKeys.includes(badge.key);
                return (
                  <div
                    key={badge.key}
                    className={cn(
                      "group p-4 rounded-xl border transition-all flex items-center gap-4",
                      isGranted
                        ? "bg-amber-50/30 border-amber-100"
                        : "bg-gray-50 border-gray-100"
                    )}
                    data-testid={`badge-card-${badge.key}`}
                  >
                    <div className="shrink-0 relative">
                      <img
                        src={getBadgeSvgPath(badge.key)}
                        alt={badge.displayName}
                        className={cn(
                          "w-14 h-14 transition-all",
                          !isGranted
                            ? "opacity-30 grayscale blur-[1px]"
                            : "drop-shadow-sm"
                        )}
                      />
                      {!isGranted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-gray-400 opacity-20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">
                          {badge.displayName}
                        </h3>
                        {isGranted && (
                          <Badge className="bg-green-100 text-green-700 border-none font-bold text-[9px] tracking-wider h-4 px-1.5">
                            Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 italic font-medium">
                        {badge.meaning}
                      </p>

                      {!isGranted && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-3 mt-2 text-xs font-bold bg-white hover:bg-brand hover:text-white transition-all shadow-sm rounded-lg border-none"
                          onClick={() => grantBadgeMutation.mutate(badge.key)}
                          disabled={grantBadgeMutation.isPending}
                        >
                          Grant Achievement
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Badges Display */}
            {earnedBadgeKeys.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-50">
                <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  All Earned Badges ({earnedBadgeKeys.length})
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {earnedBadgeKeys.map((badgeKey) => {
                    const badgeDef = BADGE_REGISTRY.find(
                      (b) => b.key === badgeKey
                    );
                    return (
                      <div
                        key={badgeKey}
                        className="flex items-center gap-2 bg-gray-50 transition-colors rounded-lg px-2.5 py-1.5 border border-gray-100 shadow-sm shrink-0"
                        title={badgeDef?.meaning}
                        data-testid={`earned-badge-${badgeKey}`}
                      >
                        <img
                          src={getBadgeSvgPath(badgeKey)}
                          alt={badgeDef?.displayName || badgeKey}
                          className="w-5 h-5 transition-all"
                        />
                        <span className="text-xs font-bold text-gray-700">
                          {badgeDef?.displayName || badgeKey}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Karmic Affirmation (Editable) */}
        <Card
          className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative h-full"
          data-testid="card-karmic-affirmation"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <h2 className="text-md font-bold text-gray-900">
                Karmic Affirmation
              </h2>
            </div>
            <p className="text-sm text-gray-400 font-medium ms-2 mb-4 leading-relaxed">
              Write a personalized karmic affirmation for this user. This will
              be displayed on their profile.
            </p>
            <Textarea
              placeholder="Enter the user's personalized karmic affirmation..."
              value={karmicAffirmation}
              onChange={(e) => handleKarmicChange(e.target.value)}
              className="min-h-[180px] bg-gray-50/50 border-gray-100 focus:bg-white rounded-lg resize-none transition-all placeholder:text-gray-300"
              data-testid="textarea-karmic-affirmation"
            />
          </div>
        </Card>

        {/* My Prescription (Editable, Structured) */}
        <Card
          className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative h-full"
          data-testid="card-prescription"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-teal-500" />
                </div>
                <h2 className="text-md font-bold text-gray-900">
                  Custom Prescription
                </h2>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-8">
              Assign personalized practices for different times of day.
            </p>

            <div className="space-y-8">
              {sectionConfig.map(({ key, label, icon: Icon, color }) => (
                <div
                  key={key}
                  className="relative pl-6 border-l border-gray-100 ml-3 space-y-4"
                  data-testid={`section-${key}`}
                >
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#f8f9fa] border-2 border-gray-100 flex items-center justify-center">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        color.replace("text-", "bg-")
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-gray-800 tracking-wider">
                        {label}
                      </h3>
                      {(prescription[key]?.length || 0) > 0 && (
                        <Badge className="bg-gray-100 text-gray-500 font-bold text-[9px] border-none">
                          {prescription[key]?.length}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddItem(key)}
                      className="h-7 text-brand hover:bg-brand/10 font-bold text-xs gap-1"
                      data-testid={`button-add-${key}`}
                    >
                      <Plus className="w-3 h-3" />
                      Add Practice
                    </Button>
                  </div>

                  {(prescription[key]?.length || 0) === 0 ? (
                    <p className="text-[11px] text-gray-400 italic font-medium ml-1">
                      No {label.toLowerCase()} sequences assigned...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {prescription[key]?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 group/item"
                        >
                          <Input
                            value={item}
                            onChange={(e) =>
                              handleUpdateItem(key, index, e.target.value)
                            }
                            placeholder={`Sequence name...`}
                            className="bg-gray-50/30 border-gray-100 focus:bg-white h-9 rounded-lg text-sm"
                            data-testid={`input-${key}-${index}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(key, index)}
                            className="h-9 w-9 text-gray-300 hover:text-red-500 bg-gray-50/50 hover:bg-red-50 transition-all opacity-0 group-hover/item:opacity-100"
                            data-testid={`button-remove-${key}-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
