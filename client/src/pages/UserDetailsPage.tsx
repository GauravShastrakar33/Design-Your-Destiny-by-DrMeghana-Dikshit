import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, User, Sparkles, Pill, Plus, X, Loader2, Sunrise, Sun, Moon, Save, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserWithPrograms, UserWellnessProfile, UserBadge } from "@shared/schema";
import { BADGE_REGISTRY, getBadgeSvgPath } from "@/lib/badgeRegistry";

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

  const { data: student, isLoading: isLoadingStudent } = useQuery<UserWithPrograms>({
    queryKey: ["/admin/v1/students", userId],
    queryFn: async () => {
      const response = await fetch(`/admin/v1/students/${userId}`, {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch student");
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: wellnessProfile, isLoading: isLoadingProfile } = useQuery<UserWellnessProfile | { karmicAffirmation: null; prescription: null }>({
    queryKey: ["/admin/v1/users", userId, "wellness-profile"],
    queryFn: async () => {
      const response = await fetch(`/admin/v1/users/${userId}/wellness-profile`, {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch wellness profile");
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: earnedBadgeKeys = [], isLoading: isLoadingBadges } = useQuery<string[]>({
    queryKey: ["/admin/v1/students", userId, "badges"],
    queryFn: async () => {
      const response = await fetch(`/admin/v1/students/${userId}/badges`, {
        headers: { "Authorization": `Bearer ${adminToken}` },
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
          "Authorization": `Bearer ${token}`,
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
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/students", userId, "badges"] });
      const badge = BADGE_REGISTRY.find(b => b.key === badgeKey);
      toast({ title: `${badge?.displayName || badgeKey} badge granted successfully` });
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
        cleanedPrescription.morning = prescription.morning.filter(item => item.trim() !== "");
      }
      if (prescription.afternoon && prescription.afternoon.length > 0) {
        cleanedPrescription.afternoon = prescription.afternoon.filter(item => item.trim() !== "");
      }
      if (prescription.evening && prescription.evening.length > 0) {
        cleanedPrescription.evening = prescription.evening.filter(item => item.trim() !== "");
      }

      if (cleanedPrescription.morning?.length === 0) delete cleanedPrescription.morning;
      if (cleanedPrescription.afternoon?.length === 0) delete cleanedPrescription.afternoon;
      if (cleanedPrescription.evening?.length === 0) delete cleanedPrescription.evening;

      await apiRequest("POST", `/admin/v1/users/${userId}/wellness-profile`, {
        karmicAffirmation: karmicAffirmation.trim() || null,
        prescription: Object.keys(cleanedPrescription).length > 0 ? cleanedPrescription : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/users", userId, "wellness-profile"] });
      setHasChanges(false);
      toast({ title: "Wellness profile saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save wellness profile", variant: "destructive" });
    },
  });

  const handleAddItem = (section: keyof PrescriptionData) => {
    setPrescription(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), ""],
    }));
    setHasChanges(true);
  };

  const handleUpdateItem = (section: keyof PrescriptionData, index: number, value: string) => {
    setPrescription(prev => ({
      ...prev,
      [section]: (prev[section] || []).map((item, i) => i === index ? value : item),
    }));
    setHasChanges(true);
  };

  const handleRemoveItem = (section: keyof PrescriptionData, index: number) => {
    setPrescription(prev => ({
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
  
  const adminBadges = BADGE_REGISTRY.filter(b => b.type === "admin");

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
        <Button variant="outline" onClick={() => setLocation("/admin/users/students")}>
          Back to Students
        </Button>
      </div>
    );
  }

  const sectionConfig = [
    { key: "morning" as const, label: "Morning", icon: Sunrise, color: "text-amber-500" },
    { key: "afternoon" as const, label: "Afternoon", icon: Sun, color: "text-orange-500" },
    { key: "evening" as const, label: "Evening", icon: Moon, color: "text-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/admin/users/students")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">User Details</h1>
                <p className="text-sm text-muted-foreground">{student.name}</p>
              </div>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className="gap-2"
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

        <div className="px-6 py-6 space-y-6">
          {/* Basic User Info (Read-Only) */}
          <Card className="p-6" data-testid="card-user-info">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <Badge variant="secondary" className="ml-2">Read-only</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Name</Label>
                <p className="text-foreground font-medium mt-1" data-testid="text-user-name">{student.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
                <p className="text-foreground font-medium mt-1" data-testid="text-user-email">{student.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Phone</Label>
                <p className="text-foreground font-medium mt-1" data-testid="text-user-phone">{student.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Program</Label>
                <div className="mt-1 flex flex-wrap gap-1" data-testid="text-user-program">
                  {student.programs.length > 0 ? (
                    student.programs.map((prog) => (
                      <Badge key={prog} variant="secondary">{prog}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={student.status === "active" ? "default" : "destructive"}
                    className={student.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                    data-testid="badge-user-status"
                  >
                    {student.status === "active" ? "Active" : "Blocked"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Karmic Affirmation (Editable) */}
          <Card className="p-6" data-testid="card-karmic-affirmation">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Karmic Affirmation</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Write a personalized karmic affirmation for this user. This will be displayed on their profile.
            </p>
            <Textarea
              placeholder="Enter the user's personalized karmic affirmation..."
              value={karmicAffirmation}
              onChange={(e) => handleKarmicChange(e.target.value)}
              className="min-h-[150px] resize-y"
              data-testid="textarea-karmic-affirmation"
            />
          </Card>

          {/* My Prescription (Editable, Structured) */}
          <Card className="p-6" data-testid="card-prescription">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold">My Prescription</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Assign personalized practices for different times of day. All sections are optional.
            </p>

            <div className="space-y-6">
              {sectionConfig.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="border rounded-lg p-4" data-testid={`section-${key}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <h3 className="font-medium">{label}</h3>
                      {(prescription[key]?.length || 0) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {prescription[key]?.length} item{(prescription[key]?.length || 0) !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddItem(key)}
                      className="gap-1"
                      data-testid={`button-add-${key}`}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>

                  {(prescription[key]?.length || 0) === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No practices added for {label.toLowerCase()}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {prescription[key]?.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={item}
                            onChange={(e) => handleUpdateItem(key, index, e.target.value)}
                            placeholder={`Enter ${label.toLowerCase()} practice...`}
                            className="flex-1"
                            data-testid={`input-${key}-${index}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(key, index)}
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
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
          </Card>

          {/* Admin Badges (Grantable) */}
          <Card className="p-6" data-testid="card-admin-badges">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Special Recognition Badges</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Grant special badges to recognize this user's achievements and contributions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminBadges.map((badge) => {
                const isGranted = earnedBadgeKeys.includes(badge.key);
                return (
                  <div 
                    key={badge.key} 
                    className={`border rounded-lg p-4 ${isGranted ? "bg-amber-50 border-amber-200" : "bg-gray-50"}`}
                    data-testid={`badge-card-${badge.key}`}
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={getBadgeSvgPath(badge.key)} 
                        alt={badge.displayName}
                        className={`w-12 h-12 ${!isGranted ? "opacity-40 grayscale" : ""}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{badge.displayName}</h3>
                          {isGranted && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                              Granted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{badge.meaning}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">{badge.howToEarn}</p>
                      </div>
                    </div>
                    {!isGranted && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full gap-2"
                        onClick={() => grantBadgeMutation.mutate(badge.key)}
                        disabled={grantBadgeMutation.isPending}
                        data-testid={`button-grant-${badge.key}`}
                      >
                        {grantBadgeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        Grant Badge
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Badges Display */}
            {earnedBadgeKeys.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-3">All Earned Badges ({earnedBadgeKeys.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {earnedBadgeKeys.map((badgeKey) => {
                    const badgeDef = BADGE_REGISTRY.find(b => b.key === badgeKey);
                    return (
                      <div 
                        key={badgeKey} 
                        className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5"
                        title={badgeDef?.meaning}
                        data-testid={`earned-badge-${badgeKey}`}
                      >
                        <img 
                          src={getBadgeSvgPath(badgeKey)} 
                          alt={badgeDef?.displayName || badgeKey}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">{badgeDef?.displayName || badgeKey}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
