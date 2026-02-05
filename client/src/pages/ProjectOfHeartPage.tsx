import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";
import heartChakraPng from "@assets/generated_images/heart_chakra_anahata_symbol.png";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ChevronLeft,
  Image as ImageIcon,
  Plus,
  History,
  Edit3,
  Check,
  X,
  Sparkles,
  Heart,
  ChevronRight,
  Wind,
  Bell,
  Compass,
  Trophy,
  Award,
  Target,
  Star,
  Goal,
  Focus,
  Activity,
  Briefcase,
  Users,
  Banknote,
  Quote,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useToast } from "@/hooks/use-toast";

type POHStatus = "active" | "next" | "horizon";
type Category = "career" | "health" | "relationships" | "wealth" | "other";

interface Milestone {
  id: string;
  text: string;
  achieved: boolean;
  achieved_at: string | null;
  order_index: number;
}

interface Action {
  id: string;
  text: string;
  order: number;
}

interface POHItem {
  id: string;
  title: string;
  why: string;
  category: Category;
  started_at?: string;
  vision_images?: string[];
  milestones?: Milestone[];
  actions?: Action[];
  today_rating?: number | null;
}

interface POHState {
  active: POHItem | null;
  next: POHItem | null;
  horizon: POHItem | null;
}

const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    style: { backgroundColor: string; color: string; border: string };
    icon: React.ReactNode;
    theme: {
      whyBg: string;
      whyBorder: string;
      whyText: string;
      whyIcon: string;
      milestoneBg: string;
      milestoneBorder: string;
    };
  }
> = {
  career: {
    label: "Career",
    style: {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      color: "#1d4ed8",
      border: "1px solid rgba(59, 130, 246, 0.2)",
    },
    icon: <Briefcase className="w-3 h-3" />,
    theme: {
      whyBg: "bg-gradient-to-br from-blue-50/50 to-indigo-50/30",
      whyBorder: "border-blue-100/50",
      whyText: "text-blue-700",
      whyIcon: "💼",
      milestoneBg: "bg-gradient-to-r from-blue-50 to-indigo-50/50",
      milestoneBorder: "border-blue-200/50",
    },
  },
  health: {
    label: "Health",
    style: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      color: "#15803d",
      border: "1px solid rgba(34, 197, 94, 0.2)",
    },
    icon: <Activity className="w-3 h-3" />,
    theme: {
      whyBg: "bg-gradient-to-br from-green-50/50 to-green-50/30",
      whyBorder: "border-green-100/50",
      whyText: "text-green-700",
      whyIcon: "💚",
      milestoneBg: "bg-gradient-to-r from-green-50 to-green-50/50",
      milestoneBorder: "border-green-200/50",
    },
  },
  relationships: {
    label: "Relationships",
    style: {
      backgroundColor: "rgba(244, 63, 94, 0.1)",
      color: "#be123c",
      border: "1px solid rgba(244, 63, 94, 0.2)",
    },
    icon: <Users className="w-3 h-3" />,
    theme: {
      whyBg: "bg-gradient-to-br from-rose-50/50 to-pink-50/30",
      whyBorder: "border-rose-100/50",
      whyText: "text-rose-700",
      whyIcon: "❤️",
      milestoneBg: "bg-gradient-to-r from-rose-50 to-pink-50/50",
      milestoneBorder: "border-rose-200/50",
    },
  },
  wealth: {
    label: "Wealth",
    style: {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      color: "#b45309",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    icon: <Banknote className="w-3 h-3" />,
    theme: {
      whyBg: "bg-gradient-to-br from-amber-50 to-orange-50",
      whyBorder: "border-amber-200",
      whyText: "text-amber-800",
      whyIcon: "💰",
      milestoneBg: "bg-gradient-to-r from-amber-50 to-orange-50/50",
      milestoneBorder: "border-amber-200",
    },
  },
  other: {
    label: "Other",
    style: {
      backgroundColor: "rgba(100, 116, 139, 0.1)",
      color: "#334155",
      border: "1px solid rgba(100, 116, 139, 0.2)",
    },
    icon: <Sparkles className="w-3 h-3" />,
    theme: {
      whyBg: "bg-slate-50",
      whyBorder: "border-slate-100",
      whyText: "text-slate-600",
      whyIcon: "✨",
      milestoneBg: "bg-slate-50/80",
      milestoneBorder: "border-slate-200/50",
    },
  },
};

export default function ProjectOfHeartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pohState, setPOHState] = useState<POHState>({
    active: null,
    next: null,
    horizon: null,
  });

  const allMilestonesCompleted = useMemo(() => {
    if (!pohState.active?.milestones || pohState.active.milestones.length === 0)
      return false;
    return pohState.active.milestones.every((m) => m.achieved);
  }, [pohState.active?.milestones]);

  // Safari detection for PNG fallback (Safari blurs SVG in animated containers)
  const isSafari = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes("safari") &&
      !ua.includes("chrome") &&
      !ua.includes("chromium")
    );
  }, []);

  // Render Heart Chakra - PNG for Safari, SVG for others
  const renderHeartChakra = (className: string) => {
    if (isSafari) {
      return (
        <img
          src={heartChakraPng}
          alt="Heart Chakra"
          className={className}
          style={{ objectFit: "contain" }}
        />
      );
    }
    return <HeartChakraIcon className={className} />;
  };

  // Creation flow state
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [creationStep, setCreationStep] = useState<
    "category" | "title" | "why"
  >("category");
  const [newPOH, setNewPOH] = useState({
    category: "" as Category | "",
    customCategory: "",
    title: "",
    why: "",
  });
  const [creatingPOH, setCreatingPOH] = useState(false);

  // Milestone states
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestones, setNewMilestones] = useState<string[]>([""]);
  const [creatingMilestones, setCreatingMilestones] = useState(false);
  const [achievingMilestoneId, setAchievingMilestoneId] = useState<
    string | null
  >(null);
  const [showAchieveConfirm, setShowAchieveConfirm] = useState(false);
  const [milestoneToAchieve, setMilestoneToAchieve] =
    useState<Milestone | null>(null);
  const [justAchievedId, setJustAchievedId] = useState<string | null>(null);

  // Complete/Close modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeMode, setCompleteMode] = useState<"complete" | "close">(
    "complete"
  );
  const [reflection, setReflection] = useState("");
  const [completing, setCompleting] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  // Actions state
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [editActionText, setEditActionText] = useState("");

  // Achievement Modal state
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [savingActions, setSavingActions] = useState(false);

  // Rating state
  const [sliderValue, setSliderValue] = useState(5);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);

  // Vision upload state
  const [uploadingVisionIndex, setUploadingVisionIndex] = useState<
    number | null
  >(null);
  const visionInputRef = useRef<HTMLInputElement>(null);
  const pendingVisionIndex = useRef<number | null>(null);
  const visionScrollRef = useRef<HTMLDivElement>(null);

  const scrollVision = (direction: "left" | "right") => {
    if (visionScrollRef.current) {
      const scrollAmount = 200;
      visionScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Create Next/Horizon modal
  const [showCreateNextModal, setShowCreateNextModal] = useState(false);
  const [showCreateHorizonModal, setShowCreateHorizonModal] = useState(false);
  const [nextPOHTitle, setNextPOHTitle] = useState("");
  const [nextPOHCategory, setNextPOHCategory] = useState<Category | "">("");
  const [nextPOHCustomCategory, setNextPOHCustomCategory] = useState("");
  const [creatingNext, setCreatingNext] = useState(false);

  // Re-align modal
  const [showRealignModal, setShowRealignModal] = useState(false);
  const [realignTarget, setRealignTarget] = useState<
    "active" | "next" | "horizon" | null
  >(null);
  const [realignTitle, setRealignTitle] = useState("");
  const [realignWhy, setRealignWhy] = useState("");
  const [realignCategory, setRealignCategory] = useState<Category | "">("");
  const [realignCustomCategory, setRealignCustomCategory] = useState("");
  const [savingRealign, setSavingRealign] = useState(false);

  // Milestone editing in realign
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null
  );
  const [editMilestoneText, setEditMilestoneText] = useState("");
  const [savingMilestone, setSavingMilestone] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("@app:user_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchPOHData = async () => {
    try {
      const response = await fetch("/api/poh/current", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setPOHState({
          active: data.active || null,
          next: data.next || null,
          horizon: data.horizon || null,
        });
        if (
          data.active?.today_rating !== null &&
          data.active?.today_rating !== undefined
        ) {
          setSliderValue(data.active.today_rating);
        }
      }
    } catch (err) {
      console.error("Error fetching POH:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOHData();
  }, []);

  // Creation flow handlers
  const handleCreatePOH = async () => {
    if (!newPOH.title.trim() || !newPOH.why.trim()) return;

    setCreatingPOH(true);
    try {
      const category =
        newPOH.category === "other"
          ? newPOH.customCategory.toLowerCase()
          : newPOH.category;
      const response = await fetch("/api/poh", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newPOH.title.trim(),
          why: newPOH.why.trim(),
          category,
        }),
      });

      if (response.ok) {
        setShowCreationFlow(false);
        setNewPOH({ category: "", customCategory: "", title: "", why: "" });
        setCreationStep("category");
        await fetchPOHData();
      } else {
        const data = await response.json();
        console.error("Create POH failed:", data.error);
      }
    } catch (err) {
      console.error("Create POH error:", err);
    } finally {
      setCreatingPOH(false);
    }
  };

  // Milestone handlers
  const handleCreateMilestones = async () => {
    if (!pohState.active) return;
    const validMilestones = newMilestones.filter((m) => m.trim());
    if (validMilestones.length === 0) return;

    setCreatingMilestones(true);
    try {
      for (const text of validMilestones) {
        await fetch(`/api/poh/${pohState.active.id}/milestones`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ text: text.trim() }),
        });
      }
      setShowMilestoneModal(false);
      setNewMilestones([""]);
      await fetchPOHData();
    } catch (err) {
      console.error("Create milestones error:", err);
    } finally {
      setCreatingMilestones(false);
    }
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    if (milestone.achieved) return;
    setMilestoneToAchieve(milestone);
    setShowAchieveConfirm(true);
  };

  const handleAchieveMilestone = async () => {
    if (!milestoneToAchieve) return;

    setAchievingMilestoneId(milestoneToAchieve.id);
    setShowAchieveConfirm(false);

    try {
      const response = await fetch(
        `/api/poh/milestone/${milestoneToAchieve.id}/achieve`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        setJustAchievedId(milestoneToAchieve.id);
        setTimeout(() => setJustAchievedId(null), 1500);
        await fetchPOHData();
      }
    } catch (err) {
      console.error("Achieve milestone error:", err);
    } finally {
      setAchievingMilestoneId(null);
      setMilestoneToAchieve(null);
    }
  };

  // Complete/Close handlers
  const handleComplete = async () => {
    if (!pohState.active || reflection.trim().length < 20) return;

    setCompleting(true);
    try {
      const endpoint =
        completeMode === "complete"
          ? `/api/poh/${pohState.active.id}/complete`
          : `/api/poh/${pohState.active.id}/close`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ closing_reflection: reflection.trim() }),
      });

      if (response.ok) {
        setShowCompleteModal(false);
        setShowCompletionAnimation(true);
        setReflection("");
        setTimeout(async () => {
          setShowCompletionAnimation(false);
          await fetchPOHData();
        }, 4000);
      }
    } catch (err) {
      console.error("Complete/close error:", err);
    } finally {
      setCompleting(false);
    }
  };

  // Actions handlers
  const saveAction = async () => {
    if (editingAction === null || !editActionText.trim() || !pohState.active)
      return;

    const currentActions = pohState.active.actions || [];

    // Build a 3-slot array to handle all cases
    const baseArray: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (i === editingAction) {
        baseArray[i] = editActionText.trim();
      } else if (currentActions[i]) {
        baseArray[i] = currentActions[i].text;
      } else {
        baseArray[i] = "";
      }
    }

    // Filter to only non-empty actions
    const newActions = baseArray.filter((a) => a.trim());

    if (newActions.length === 0) return;

    setSavingActions(true);
    try {
      const response = await fetch(`/api/poh/${pohState.active.id}/actions`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ actions: newActions }),
      });

      if (response.ok) {
        await fetchPOHData();
      }
    } catch (err) {
      console.error("Save action error:", err);
    } finally {
      setSavingActions(false);
      setEditingAction(null);
      setEditActionText("");
    }
  };

  // Rating handlers
  const saveRating = async (value: number) => {
    if (!pohState.active) return;

    setSavingRating(true);
    setRatingError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch("/api/poh/rate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          poh_id: pohState.active.id,
          local_date: today,
          rating: value,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setRatingError(data.error || "Failed to save rating");
      } else {
        setSliderValue(value);
        setShowAchievementModal(true);
      }
    } catch (err) {
      console.error("Save rating error:", err);
      setRatingError("Failed to save rating");
    } finally {
      setSavingRating(false);
    }
  };

  const pickVisionImageNative = async (index: number) => {
    if (!pohState.active) return;

    setUploadingVisionIndex(index);

    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Uri,
        quality: 80,
      });

      if (!photo.webPath) return;

      const imageResponse = await fetch(photo.webPath);
      const blob = await imageResponse.blob();

      const formData = new FormData();
      formData.append("image", blob, "vision.jpg");
      formData.append("index", String(index));

      const token = localStorage.getItem("@app:user_token");

      const uploadResponse = await fetch(
        `/api/poh/${pohState.active.id}/vision`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        await fetchPOHData();
      }
    } catch (error) {
      console.error("Native vision upload failed:", error);
    } finally {
      setUploadingVisionIndex(null);
    }
  };

  const handleVisionSlotClick = (index: number) => {
    if (uploadingVisionIndex !== null || !pohState.active) return;

    // ✅ Native Android / iOS → use Capacitor gallery
    if (Capacitor.isNativePlatform()) {
      pickVisionImageNative(index);
      return;
    }

    // 🌐 Web fallback
    pendingVisionIndex.current = index;
    visionInputRef.current?.click();
  };

  const handleVisionFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || pendingVisionIndex.current === null || !pohState.active)
      return;

    const index = pendingVisionIndex.current;
    pendingVisionIndex.current = null;
    if (e.target) e.target.value = "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploadingVisionIndex(index);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("index", String(index));

      const token = localStorage.getItem("@app:user_token");
      const response = await fetch(`/api/poh/${pohState.active.id}/vision`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        await fetchPOHData();
      }
    } catch (err) {
      console.error("Vision upload error:", err);
    } finally {
      setUploadingVisionIndex(null);
    }
  };

  // Create Next/Horizon handlers
  const handleCreateNext = async (type: "next" | "horizon") => {
    const title = nextPOHTitle.trim();
    const category =
      nextPOHCategory === "other"
        ? nextPOHCustomCategory.toLowerCase()
        : nextPOHCategory;
    if (!title || !category) return;

    setCreatingNext(true);
    try {
      // Backend requires why field - use placeholder for Next/Horizon since spec doesn't include why in modal
      const defaultWhy =
        type === "next"
          ? "Direction after current project"
          : "Long-term guiding star";

      const response = await fetch("/api/poh", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, why: defaultWhy, category }),
      });

      if (response.ok) {
        setShowCreateNextModal(false);
        setShowCreateHorizonModal(false);
        setNextPOHTitle("");
        setNextPOHCategory("");
        setNextPOHCustomCategory("");
        await fetchPOHData();
      }
    } catch (err) {
      console.error("Create next/horizon error:", err);
    } finally {
      setCreatingNext(false);
    }
  };

  // Re-align handlers
  const openRealignFor = (target: "active" | "next" | "horizon") => {
    const poh =
      target === "active"
        ? pohState.active
        : target === "next"
        ? pohState.next
        : pohState.horizon;
    if (!poh) return;

    setRealignTarget(target);
    setRealignTitle(poh.title);
    setRealignWhy(poh.why || "");
    setRealignCategory(poh.category as Category);
    setRealignCustomCategory("");
    setShowRealignModal(true);
  };

  const saveRealign = async () => {
    if (!realignTarget) return;
    const poh =
      realignTarget === "active"
        ? pohState.active
        : realignTarget === "next"
        ? pohState.next
        : pohState.horizon;
    if (!poh) return;

    setSavingRealign(true);
    try {
      const category =
        realignCategory === "other"
          ? realignCustomCategory.toLowerCase()
          : realignCategory;
      const body: Record<string, string> = {
        title: realignTitle.trim(),
        category,
      };
      if (realignTarget === "active") {
        body.why = realignWhy.trim();
      }

      const response = await fetch(`/api/poh/${poh.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowRealignModal(false);
        await fetchPOHData();
      }
    } catch (err) {
      console.error("Save realign error:", err);
    } finally {
      setSavingRealign(false);
    }
  };

  const saveMilestoneEdit = async () => {
    if (!editingMilestoneId || !editMilestoneText.trim()) return;

    setSavingMilestone(true);
    try {
      const response = await fetch(`/api/poh/milestone/${editingMilestoneId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: editMilestoneText.trim() }),
      });

      if (response.ok) {
        setEditingMilestoneId(null);
        setEditMilestoneText("");
        await fetchPOHData();
      }
    } catch (err) {
      console.error("Save milestone edit error:", err);
    } finally {
      setSavingMilestone(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Completion animation overlay
  if (showCompletionAnimation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#F9FAFB]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(112,61,250,0.12)] border border-indigo-50 text-center relative overflow-hidden">
            {/* Aesthetic Background Element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand/5 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-8">
              {/* Icon Section */}
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-brand/20 blur-xl rounded-full"
                  />
                  <div className="relative w-24 h-24 rounded-3xl bg-white shadow-lg border border-indigo-50 flex items-center justify-center">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {renderHeartChakra("w-20 h-20")}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Text Section */}
              <div className="space-y-3">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold tracking-tight"
                  style={{
                    color: completeMode === "complete" ? "#5FB77D" : "#E5AC19",
                  }}
                >
                  {completeMode === "complete"
                    ? "Phase Completed!"
                    : "Phase Closed"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-500 font-medium leading-relaxed"
                >
                  A chapter closes.
                  <br />
                  Your journey continues.
                </motion.p>
              </div>

              {/* Reflection Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 italic"
              >
                <Quote className="w-5 h-5 text-brand/20 mb-2 mx-auto rotate-180" />
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  "Every ending is a beginning in disguise. What you've learned
                  lives on within you."
                </p>
              </motion.div>

              {/* Progress Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="pt-4"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-brand"
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                    Advancing your path
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // START SCREEN: No active POH
  if (!pohState.active && !showCreationFlow) {
    return (
      <div
        className="min-h-screen pb-24"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        {/* Header */}
        <Header title="Project of Heart" />

        <div className="max-w-md mx-auto px-4 py-8 space-y-6">
          {/* Explanation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="p-6 border-0" style={{ backgroundColor: "white" }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                What is a Project of Heart?
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                A Project of Heart is not a task list or a goal. It's a
                declaration of who you are becoming in this phase of your life.
                It reflects your deepest intention — something that matters to
                your heart, not just your mind.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                You can have one active Project at a time, with a Next and a
                North Star guiding your longer journey.
              </p>
            </Card>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button
              onClick={() => setShowCreationFlow(true)}
              className="w-full h-12 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              data-testid="button-create-poh"
            >
              <Plus className="w-5 h-5" />
              Create My Project of Heart
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // CREATION FLOW
  if (showCreationFlow && !pohState.active) {
    return (
      <div
        className="min-h-screen pb-24"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        {/* Header */}
        <Header
          title="Create Project"
          hasBackButton={true}
          onBack={() => {
            setShowCreationFlow(false);
            setCreationStep("category");
          }}
        />

        <div className="max-w-md mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {creationStep === "category" && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  What area of life does this serve?
                </h2>
                <div className="space-y-3">
                  {(
                    [
                      "career",
                      "health",
                      "relationships",
                      "wealth",
                      "other",
                    ] as Category[]
                  ).map((cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        setNewPOH((p) => ({ ...p, category: cat }))
                      }
                      className={`w-full p-4 rounded-lg text-left border transition-all ${
                        newPOH.category === cat
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      data-testid={`button-category-${cat}`}
                    >
                      <span className="font-medium capitalize">{cat}</span>
                    </button>
                  ))}
                </div>
                {newPOH.category === "other" && (
                  <Input
                    placeholder="Enter your category"
                    value={newPOH.customCategory}
                    onChange={(e) =>
                      setNewPOH((p) => ({
                        ...p,
                        customCategory: e.target.value,
                      }))
                    }
                    className="mt-4"
                    data-testid="input-custom-category"
                  />
                )}
                <Button
                  onClick={() => setCreationStep("title")}
                  disabled={
                    !newPOH.category ||
                    (newPOH.category === "other" &&
                      !newPOH.customCategory.trim())
                  }
                  className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                  data-testid="button-next-step"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {creationStep === "title" && (
              <motion.div
                key="title"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-gray-500 mb-2">
                  For this phase of my life, this one thing matters most:
                </p>
                <Textarea
                  placeholder="Enter your Project of Heart title..."
                  value={newPOH.title}
                  onChange={(e) =>
                    setNewPOH((p) => ({
                      ...p,
                      title: e.target.value.slice(0, 120),
                    }))
                  }
                  className="min-h-[100px] text-lg"
                  data-testid="input-poh-title"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {newPOH.title.length}/120
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCreationStep("category")}
                    className="flex-1 h-11 border-indigo-100 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50/50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCreationStep("why")}
                    disabled={!newPOH.title.trim()}
                    className="flex-1 h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                    data-testid="button-next-step"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {creationStep === "why" && (
              <motion.div
                key="why"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
                  Why this matters to my heart:
                </p>
                <Textarea
                  placeholder="What makes this meaningful to you?"
                  value={newPOH.why}
                  onChange={(e) =>
                    setNewPOH((p) => ({
                      ...p,
                      why: e.target.value.slice(0, 500),
                    }))
                  }
                  className="min-h-[150px]"
                  data-testid="input-poh-why"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {newPOH.why.length}/500
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCreationStep("title")}
                    className="flex-1 h-11 border-indigo-100 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50/50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreatePOH}
                    disabled={!newPOH.why.trim() || creatingPOH}
                    className="flex-1 h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                    data-testid="button-create-poh-submit"
                  >
                    {creatingPOH ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // MAIN POH SCREEN
  return (
    <div
      className="min-h-screen pb-24 bg-gray-50/50"
      style={{ backgroundColor: "#F8F9FA" }}
    >
      {/* Header - Shared Component */}
      <Header title="Project of Heart" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ACTIVE POH CARD */}
        {pohState.active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div
              className={`relative overflow-hidden group transition-all duration-500 ${
                pohState.active.category === "wealth"
                  ? "ring-1 ring-amber-100 shadow-amber-50/50 shadow-lg"
                  : ""
              }`}
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                padding: "24px",
                boxShadow:
                  pohState.active.category === "wealth"
                    ? "0 10px 40px rgba(180, 83, 9, 0.08), 0 0 0 1px rgba(180, 83, 9, 0.05)"
                    : "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
              }}
            >
              {/* Header Row - Category Left, Status Right */}
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5"
                  style={
                    (
                      CATEGORY_CONFIG[pohState.active.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).style
                  }
                >
                  {
                    (
                      CATEGORY_CONFIG[pohState.active.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).icon
                  }
                  {
                    (
                      CATEGORY_CONFIG[pohState.active.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).label
                  }
                </span>
                <span
                  className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5"
                  style={{
                    backgroundColor: "rgba(95,183,125,0.15)",
                    color: "#5FB77D",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              </div>

              {/* Title */}
              <h2
                className="text-xl font-bold leading-relaxed mb-4"
                data-testid="text-active-poh-title"
              >
                {pohState.active.title}
              </h2>

              {/* Why */}
              {pohState.active.why && (
                <div
                  className={`mb-6 p-4 rounded-xl border transition-all duration-300 ${
                    (
                      CATEGORY_CONFIG[pohState.active.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).theme.whyBg
                  } ${
                    (
                      CATEGORY_CONFIG[pohState.active.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).theme.whyBorder
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1.5 ${
                      (
                        CATEGORY_CONFIG[pohState.active.category as Category] ||
                        CATEGORY_CONFIG.other
                      ).theme.whyText
                    }`}
                  >
                    <span>
                      {
                        (
                          CATEGORY_CONFIG[
                            pohState.active.category as Category
                          ] || CATEGORY_CONFIG.other
                        ).theme.whyIcon
                      }
                    </span>
                    Why this matters to my heart
                  </p>
                  <p
                    className="italic font-medium"
                    style={{
                      fontSize: "14px",
                      lineHeight: "22px",
                      color:
                        pohState.active.category === "wealth"
                          ? "#92400E"
                          : "#374151",
                    }}
                  >
                    {pohState.active.why}
                  </p>
                </div>
              )}

              {/* Vision Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-semibold text-[#4C4F9D] uppercase tracking-wide">
                    🎨 Vision Board
                  </span>
                </div>

                <div className="relative group/carousel">
                  <style>
                    {`
                      .vision-carousel-scroll::-webkit-scrollbar {
                        display: none;
                      }
                      .vision-carousel-scroll {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                      }
                    `}
                  </style>
                  <div
                    ref={visionScrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 vision-carousel-scroll snap-x relative z-10 scroll-smooth"
                  >
                    {[0, 1, 2].map((index) => {
                      const hasImage = pohState.active?.vision_images?.[index];
                      const isUploading = uploadingVisionIndex === index;

                      return (
                        <motion.div
                          key={index}
                          className="relative flex-shrink-0 w-40 sm:w-44 aspect-square snap-start group/image"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className={`w-full h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                              hasImage
                                ? "shadow-md hover:shadow-lg border border-black/5"
                                : "border-2 border-dashed hover:border-brand hover:bg-brand/5"
                            }`}
                            onClick={() => handleVisionSlotClick(index)}
                            data-testid={`button-vision-image-${index}`}
                            style={{
                              backgroundColor: hasImage
                                ? "transparent"
                                : "#FAFAFA",
                              borderColor: hasImage
                                ? "transparent"
                                : "rgba(112, 61, 250, 0.2)",
                            }}
                          >
                            {isUploading ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
                                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                              </div>
                            ) : hasImage ? (
                              <>
                                <img
                                  src={pohState.active!.vision_images![index]}
                                  alt={`Vision ${index + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                  <ImageIcon className="w-5 h-5 text-white mb-1" />
                                  <span className="text-white text-[10px] font-medium">
                                    Change
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                                <div className="w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center group-hover/image:bg-brand/10 transition-colors">
                                  <Plus
                                    className="w-5 h-5 text-brand/40 group-hover/image:text-brand"
                                    strokeWidth={2.5}
                                  />
                                </div>
                                <p className="text-[11px] font-semibold text-gray-500 group-hover/image:text-brand transition-colors">
                                  Add Vision
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Carousel Controls */}
                  <button
                    onClick={() => scrollVision("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity -ml-4 border border-gray-100 hover:bg-white"
                    aria-label="Previous vision"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollVision("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity -mr-4 border border-gray-100 hover:bg-white"
                    aria-label="Next vision"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center italic">
                  Add images that represent your vision and inspire you daily
                </p>

                <input
                  ref={visionInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleVisionFileChange}
                />
              </div>

              {/* Milestones Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-[#4C4F9D] uppercase tracking-wide">
                    🎯 Milestones
                  </p>
                  {pohState.active.milestones &&
                    pohState.active.milestones.length > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {
                          pohState.active.milestones.filter((m) => m.achieved)
                            .length
                        }
                        /{pohState.active.milestones.length} completed
                      </span>
                    )}
                </div>

                {!pohState.active.milestones ||
                pohState.active.milestones.length === 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowMilestoneModal(true)}
                    className="w-full bg-brand text-white hover:bg-brand/90 h-11 text-sm sm:text-sm font-semibold rounded-lg shadow-sm transition-all duration-300"
                    data-testid="button-create-milestones"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Milestones
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {pohState?.active?.milestones?.map((milestone) => (
                      <motion.div
                        key={milestone.id}
                        className={`group relative flex items-start gap-3 p-2 rounded-xl transition-all duration-300 ${
                          milestone.achieved
                            ? `${
                                (
                                  CATEGORY_CONFIG[
                                    pohState?.active?.category as Category
                                  ] || CATEGORY_CONFIG.other
                                ).theme.milestoneBg
                              } border ${
                                (
                                  CATEGORY_CONFIG[
                                    pohState?.active?.category as Category
                                  ] || CATEGORY_CONFIG.other
                                ).theme.milestoneBorder
                              }`
                            : "bg-gray-50/50 hover:bg-gray-100/80 cursor-pointer border border-transparent"
                        }`}
                        onClick={() => handleMilestoneClick(milestone)}
                        data-testid={`milestone-${milestone.id}`}
                        animate={
                          justAchievedId === milestone.id
                            ? {
                                scale: [1, 1.03, 1],
                                boxShadow: [
                                  "0 0 0 0 rgba(34, 197, 94, 0)",
                                  "0 0 0 8px rgba(34, 197, 94, 0.2)",
                                  "0 0 0 0 rgba(34, 197, 94, 0)",
                                ],
                              }
                            : {}
                        }
                        transition={{ duration: 0.8 }}
                        whileHover={!milestone.achieved ? { scale: 1.01 } : {}}
                        style={{
                          boxShadow: milestone.achieved
                            ? "0 2px 8px rgba(34, 197, 94, 0.1)"
                            : "none",
                        }}
                      >
                        {/* Animated Checkmark Container */}
                        <div className="relative flex-shrink-0 w-6 h-6 mt-0.5">
                          {achievingMilestoneId === milestone.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-brand" />
                          ) : milestone.achieved ? (
                            <motion.div
                              initial={
                                justAchievedId === milestone.id
                                  ? { scale: 0, rotate: -180 }
                                  : { scale: 1, rotate: 0 }
                              }
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                duration: 0.6,
                              }}
                              className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md"
                            >
                              <motion.div
                                initial={
                                  justAchievedId === milestone.id
                                    ? { pathLength: 0, opacity: 0 }
                                    : { pathLength: 1, opacity: 1 }
                                }
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                              >
                                <Check
                                  className="w-3 h-3 text-white"
                                  strokeWidth={3}
                                />
                              </motion.div>
                            </motion.div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-brand group-hover:bg-brand/5 transition-all duration-200" />
                          )}
                        </div>

                        {/* Milestone Text */}
                        <span
                          className={`text-sm sm:text-base leading-relaxed flex-1 min-w-0 break-words transition-colors duration-300 ${
                            milestone.achieved
                              ? "text-gray-600 font-medium"
                              : "text-gray-700 group-hover:text-gray-900"
                          }`}
                        >
                          {milestone.text}
                        </span>

                        {/* Celebration Sparkles for Just Achieved */}
                        {justAchievedId === milestone.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0.5, 1.5, 2],
                            }}
                            transition={{ duration: 0.8 }}
                            className="absolute -top-1 -right-1"
                          >
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                    {pohState.active.milestones.length < 5 && (
                      <button
                        onClick={() => setShowMilestoneModal(true)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-brand transition-colors mt-2"
                        data-testid="button-add-milestone"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add milestone
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Stats */}
              {pohState.active.milestones &&
                pohState.active.milestones.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-600 tracking-wide">
                        Progress
                      </span>
                      <span className="text-sm font-semibold text-brand">
                        {
                          pohState.active.milestones.filter((m) => m.achieved)
                            .length
                        }
                        /{pohState.active.milestones.length} Milestones
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand via-purple-500 to-brand rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            (pohState.active.milestones.filter(
                              (m) => m.achieved
                            ).length /
                              pohState.active.milestones.length) *
                            100
                          }%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      </motion.div>
                    </div>

                    <p className="text-xs text-gray-600 italic">
                      {pohState.active.milestones.filter((m) => m.achieved)
                        .length === 0
                        ? "Start achieving your milestones!"
                        : pohState.active.milestones.filter((m) => m.achieved)
                            .length === pohState.active.milestones.length
                        ? "🎉 All milestones completed! Ready to close?"
                        : `Keep going! ${
                            pohState.active.milestones.length -
                            pohState.active.milestones.filter((m) => m.achieved)
                              .length
                          } more to go!`}
                    </p>
                  </div>
                )}

              {/* Card Actions Area */}
              <div className="mt-6 flex flex-col gap-3">
                {pohState.active.milestones &&
                  pohState.active.milestones.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCompleteMode("complete");
                        setShowCompleteModal(true);
                      }}
                      className="w-full h-11 border-indigo-100 bg-indigo-50/30 hover:bg-brand/5 hover:border-brand/30 hover:text-brand text-indigo-700 font-semibold rounded-lg transition-all shadow-md disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                      data-testid="button-complete-poh"
                    >
                      <Trophy className="w-4 h-4 text-indigo-400 group-hover:text-brand transition-all" />
                      Complete / Close Project
                    </Button>
                  )}

                <Button
                  onClick={() => openRealignFor("active")}
                  className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                  data-testid="button-realign-active"
                >
                  <Wind className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Re-align Perspective
                  <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TOP ACTION CARD */}
        {pohState.active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div
              className="rounded-2xl px-5 sm:px-6 py-4 sm:py-5"
              style={{
                backgroundColor: "white",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
              }}
              data-testid="card-top-action"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-brand flex items-center justify-center shadow-md">
                  <Sparkles
                    className="w-4.5 h-4.5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <p className="text-xs sm:text-xs font-semibold text-primary uppercase tracking-wide">
                    My Top Action Today
                  </p>
                  <p className="text-xs text-gray-400">
                    Goal on what matters most
                  </p>
                </div>
              </div>

              <div className="mb-0" data-testid="action-container">
                {(() => {
                  const existingAction = pohState.active?.actions?.[0];
                  return editingAction === 0 ? (
                    <div className="space-y-3">
                      <textarea
                        value={editActionText}
                        onChange={(e) => setEditActionText(e.target.value)}
                        placeholder="What's your most important action today?"
                        className="w-full min-h-[80px] py-2 px-3 text-sm text-gray-700 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-0 focus:border-brand resize-none transition-all shadow-sm"
                        style={{
                          lineHeight: "1.5",
                        }}
                        autoFocus
                        data-testid="input-top-action"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAction(null);
                            setEditActionText("");
                          }}
                          className="flex-1 h-10 border-indigo-100 font-semibold rounded-xl"
                          disabled={savingActions}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveAction}
                          disabled={savingActions || !editActionText.trim()}
                          className="flex-1 h-10 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl shadow-md"
                        >
                          {savingActions ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : existingAction ? (
                    <div className="space-y-2">
                      <div
                        className="w-full min-h-[60px] p-3 text-sm text-gray-700 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl"
                        style={{
                          lineHeight: "1.5",
                        }}
                        data-testid="display-top-action"
                      >
                        <p className="whitespace-pre-wrap">
                          {existingAction.text}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingAction(0);
                          setEditActionText(existingAction.text);
                        }}
                        className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-lg transition-all shadow-md disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                      >
                        <Edit3 className="w-4 h-4 text-indigo-300 group-hover:text-brand transition-colors" />
                        Update Today's Action
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingAction(0);
                        setEditActionText("");
                      }}
                      className="w-full min-h-[60px] p-4 text-xs sm:text-sm text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand hover:bg-purple-50/50 transition-all flex items-center justify-center"
                      data-testid="add-top-action"
                    >
                      <span>Add your top action...</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* DAILY ALIGNMENT CARD */}
        {pohState.active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div
              className="rounded-2xl px-5 sm:px-6 py-4 sm:py-5"
              style={{
                backgroundColor: "white",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
              }}
              data-testid="card-daily-alignment"
            >
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
                  <Heart
                    className="w-4 h-4 text-white fill-white"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-xs sm:text-xs font-semibold text-[#10B981] uppercase tracking-wide">
                    Daily Alignment
                  </p>
                  <p className="text-xs text-gray-400">
                    How aligned were you today?
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  {[
                    { range: [0, 2], emoji: "😞", label: "Low" },
                    { range: [3, 4], emoji: "😐", label: "Fair" },
                    { range: [5, 6], emoji: "🙂", label: "Good" },
                    { range: [7, 8], emoji: "😊", label: "Great" },
                    { range: [9, 10], emoji: "🌟", label: "Best" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex flex-col items-center"
                      animate={{
                        scale:
                          sliderValue >= item.range[0] &&
                          sliderValue <= item.range[1]
                            ? 1.15
                            : 1,
                        opacity:
                          sliderValue >= item.range[0] &&
                          sliderValue <= item.range[1]
                            ? 1
                            : 0.4,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-xl mb-0.5">{item.emoji}</span>
                      <span className="text-xs font-medium text-gray-500">
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="relative px-2 py-1">
                  <Slider
                    value={[sliderValue]}
                    onValueChange={(v) => setSliderValue(v[0])}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full z-10 relative"
                    rangeClassName="bg-gradient-to-r from-brand via-purple-500 to-brand"
                    disabled={savingRating}
                  />
                </div>

                <div className="flex items-center justify-center gap-3 mt-1">
                  <div
                    className="text-sm font-bold w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100"
                    style={{
                      color:
                        sliderValue === 0
                          ? "#6B7280"
                          : sliderValue <= 3
                          ? "#DC2626"
                          : sliderValue <= 5
                          ? "#D97706"
                          : sliderValue <= 7
                          ? "#16A34A"
                          : sliderValue <= 9
                          ? "#7C3AED"
                          : "#5B21B6",
                    }}
                  >
                    {sliderValue}
                  </div>

                  <motion.p
                    className="text-xs font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={sliderValue}
                    style={{
                      color:
                        sliderValue === 0
                          ? "#9CA3AF"
                          : sliderValue <= 3
                          ? "#EF4444"
                          : sliderValue <= 5
                          ? "#F59E0B"
                          : sliderValue <= 7
                          ? "#22C55E"
                          : sliderValue <= 9
                          ? "#8B5CF6"
                          : "#703DFA",
                    }}
                  >
                    {sliderValue === 0
                      ? "Rate your alignment"
                      : sliderValue <= 2
                      ? "Room for improvement"
                      : sliderValue <= 4
                      ? "Making progress"
                      : sliderValue <= 6
                      ? "Good alignment today!"
                      : sliderValue <= 8
                      ? "Great work staying aligned!"
                      : sliderValue === 9
                      ? "Excellent alignment!"
                      : "Excellent alignment achieved! 🎉"}
                  </motion.p>
                </div>
              </div>

              {ratingError && (
                <p className="text-xs text-red-500 mt-1">{ratingError}</p>
              )}

              <div className="mt-4">
                {sliderValue === 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-brand font-medium text-center mb-2 animate-pulse"
                  >
                    Please move the slider to rate your alignment
                  </motion.p>
                )}
                <Button
                  onClick={() => setShowReflectionModal(true)}
                  disabled={savingRating || sliderValue === 0}
                  className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-lg transition-all shadow-md disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                  data-testid="button-save-reflection"
                >
                  {savingRating ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    "Save Reflection"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center italic">
                A moment of awareness shapes how you show up.
              </p>
            </div>
          </motion.div>
        )}

        {pohState.active && !pohState.next && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateNextModal(true)}
              className="w-fit px-6 h-10 border-indigo-100 bg-white hover:bg-brand/5 text-indigo-600 font-semibold rounded-xl transition-all"
              data-testid="button-create-next"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create NEXT POH
            </Button>
          </div>
        )}

        {/* NEXT POH CARD */}
        {pohState.next && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <div
              className="rounded-2xl px-5 py-5 backdrop-blur-sm border border-gray-100/50 bg-white shadow-sm"
              data-testid="card-next-poh"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={
                    (
                      CATEGORY_CONFIG[pohState.next.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).style
                  }
                >
                  {
                    (
                      CATEGORY_CONFIG[pohState.next.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).icon
                  }
                  {
                    (
                      CATEGORY_CONFIG[pohState.next.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).label
                  }
                </span>
                <span
                  className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  style={{
                    backgroundColor: "rgba(88, 101, 242, 0.15)",
                    color: "#5865F2",
                  }}
                >
                  <ChevronRight className="w-3 h-3" />
                  NEXT
                </span>
              </div>
              <p
                className="text-base sm:text-lg font-semibold text-gray-700 leading-relaxed mb-2"
                data-testid="text-next-poh"
              >
                {pohState.next.title}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 italic">
                This comes after I complete my current Project of Heart.
              </p>
            </div>
          </motion.div>
        )}

        {pohState.active && !pohState.horizon && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateHorizonModal(true)}
              className="w-fit px-6 h-10 border-indigo-100 bg-white hover:bg-brand/5 text-indigo-600 font-semibold rounded-xl transition-all"
              data-testid="button-create-horizon"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create North Star
            </Button>
          </div>
        )}

        {/* NORTH STAR (Horizon) CARD */}
        {pohState.horizon && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div
              className="rounded-2xl px-6 py-8 relative overflow-hidden group shadow-md border border-indigo-100"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 0%, #f3efff 40%, #d6cbfc 100%)", // Primary Hint Gradient
              }}
              data-testid="card-horizon-poh"
            >
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full tracking-wider backdrop-blur-md flex items-center gap-1.5"
                  style={
                    (
                      CATEGORY_CONFIG[pohState.horizon.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).style
                  }
                >
                  {
                    (
                      CATEGORY_CONFIG[pohState.horizon.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).icon
                  }
                  {
                    (
                      CATEGORY_CONFIG[pohState.horizon.category as Category] ||
                      CATEGORY_CONFIG.other
                    ).label
                  }
                </span>
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 tracking-wider backdrop-blur-md"
                  style={{
                    backgroundColor: "rgba(254, 243, 199, 0.8)", // Amber-100
                    color: "#B45309", // Amber-700
                    border: "1px solid rgba(251, 191, 36, 0.4)",
                  }}
                >
                  <Star className="w-3 h-3 fill-current" />
                  North Star
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-xs text-primary tracking-wide font-semibold italic mb-3 flex items-center gap-2">
                  <Focus className="w-4 h-4" /> Guiding every step forward.
                </p>
                <p
                  className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed tracking-tight"
                  data-testid="text-someday-poh"
                >
                  "{pohState.horizon.title}"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* History Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <button
            onClick={() => setLocation("/project-of-heart/history")}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="button-view-history"
          >
            <History className="w-4 h-4" />
            View past Projects
          </button>
        </motion.div>
      </div>

      {/* MODALS */}

      {/* Milestone Creation Modal */}
      <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Create Milestones</DialogTitle>
            <DialogDescription>
              {pohState.active?.milestones &&
              pohState.active.milestones.length > 0
                ? `You have ${
                    pohState.active.milestones.length
                  } milestones. You can add up to ${
                    5 - pohState.active.milestones.length
                  } more.`
                : "Add up to 5 milestones that reflect shifts in you."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {newMilestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm w-4">{i + 1}.</span>
                <Input
                  value={m}
                  onChange={(e) => {
                    const updated = [...newMilestones];
                    updated[i] = e.target.value;
                    setNewMilestones(updated);
                  }}
                  placeholder="Enter milestone..."
                  data-testid={`input-milestone-${i}`}
                />
                {newMilestones.length > 1 && (
                  <button
                    onClick={() =>
                      setNewMilestones(
                        newMilestones.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
            {newMilestones.length <
              5 - (pohState.active?.milestones?.length || 0) && (
              <button
                onClick={() => setNewMilestones([...newMilestones, ""])}
                className="text-sm font-semibold text-brand hover:text-brand/80 transition-colors py-1 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add another milestone
              </button>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowMilestoneModal(false)}
              className="flex-1 h-10 border-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMilestones}
              disabled={
                creatingMilestones || newMilestones.every((m) => !m.trim())
              }
              className="flex-1 h-10 bg-brand hover:bg-brand/90 text-white text-xs font-semibold rounded-xl shadow-md"
              data-testid="button-submit-milestones"
            >
              {creatingMilestones ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Achievement Confirmation Modal */}
      <Dialog open={showAchieveConfirm} onOpenChange={setShowAchieveConfirm}>
        <DialogContent className="w-[92vw] sm:max-w-sm p-6 rounded-3xl text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Mark Milestone</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">
            This milestone reflects a shift in you. Mark it when it feels true.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAchieveConfirm(false)}
              className="flex-1 h-11 border-indigo-100 bg-white hover:bg-gray-50 text-indigo-600 text-xs font-semibold rounded-xl transition-all"
            >
              Not yet
            </Button>
            <Button
              onClick={handleAchieveMilestone}
              className="flex-1 h-11 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all"
              data-testid="button-confirm-achieve"
            >
              It's ready to be marked
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete/Close Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {completeMode === "complete"
                ? "Complete Project"
                : "Close Project Early"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div
              className={`flex gap-3 mb-6 transition-all duration-300 ${
                allMilestonesCompleted ? "justify-center" : ""
              }`}
            >
              <Button
                variant={completeMode === "complete" ? "default" : "outline"}
                onClick={() => setCompleteMode("complete")}
                className={`h-11 text-sm sm:text-sm font-semibold rounded-xl shadow-md transition-all duration-300 ${
                  allMilestonesCompleted ? "w-full" : "flex-1"
                } ${
                  completeMode === "complete"
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                    : "border-indigo-100 bg-white hover:bg-brand/5 text-indigo-600"
                }`}
              >
                {allMilestonesCompleted ? "🎉 Complete" : "Complete"}
              </Button>
              {!allMilestonesCompleted && (
                <Button
                  variant={completeMode === "close" ? "default" : "outline"}
                  onClick={() => setCompleteMode("close")}
                  className={`flex-1 h-11 text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all duration-300 ${
                    completeMode === "close"
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                      : "border-indigo-100 bg-white hover:bg-brand/5 text-indigo-600"
                  }`}
                >
                  Close Early
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Share a reflection on your journey (min 20 characters):
            </p>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did this project teach you?"
              className="min-h-[100px]"
              data-testid="input-reflection"
            />
            <p className="text-xs text-gray-400 mt-1">
              {reflection.length}/20 minimum
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteModal(false);
                setReflection("");
              }}
              className="flex-1 h-11 border-indigo-100 bg-white hover:bg-gray-50 text-indigo-600 text-xs font-semibold rounded-xl transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={completing || reflection.trim().length < 20}
              className="flex-1 h-11 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
              style={{
                backgroundColor:
                  completeMode === "complete" ? "#703DFA" : "#E5AC19",
              }}
              data-testid="button-submit-complete"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : completeMode === "complete" ? (
                "Complete"
              ) : (
                "Close"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Next POH Modal */}
      <Dialog open={showCreateNextModal} onOpenChange={setShowCreateNextModal}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Create Next POH</DialogTitle>
            <DialogDescription>
              What direction feels right after this phase?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={nextPOHTitle}
              onChange={(e) => setNextPOHTitle(e.target.value.slice(0, 120))}
              placeholder="Enter title..."
              data-testid="input-next-title"
            />
            <Select
              value={nextPOHCategory}
              onValueChange={(v) => setNextPOHCategory(v as Category)}
            >
              <SelectTrigger data-testid="select-next-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "career",
                    "health",
                    "relationships",
                    "wealth",
                    "other",
                  ] as Category[]
                ).map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nextPOHCategory === "other" && (
              <Input
                value={nextPOHCustomCategory}
                onChange={(e) => setNextPOHCustomCategory(e.target.value)}
                placeholder="Enter custom category"
              />
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateNextModal(false)}
              className="flex-1 h-10 border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateNext("next")}
              disabled={
                creatingNext || !nextPOHTitle.trim() || !nextPOHCategory
              }
              className="flex-1 h-10 bg-brand hover:bg-brand/90 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md"
              data-testid="button-submit-next"
            >
              {creatingNext ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create North Star Modal */}
      <Dialog
        open={showCreateHorizonModal}
        onOpenChange={setShowCreateHorizonModal}
      >
        <DialogContent className="w-[95vw] sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Create North Star</DialogTitle>
            <DialogDescription>
              This guides you, even when you're not actively working on it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={nextPOHTitle}
              onChange={(e) => setNextPOHTitle(e.target.value.slice(0, 120))}
              placeholder="Enter title..."
              data-testid="input-horizon-title"
            />
            <Select
              value={nextPOHCategory}
              onValueChange={(v) => setNextPOHCategory(v as Category)}
            >
              <SelectTrigger data-testid="select-horizon-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "career",
                    "health",
                    "relationships",
                    "wealth",
                    "other",
                  ] as Category[]
                ).map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nextPOHCategory === "other" && (
              <Input
                value={nextPOHCustomCategory}
                onChange={(e) => setNextPOHCustomCategory(e.target.value)}
                placeholder="Enter custom category"
              />
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateHorizonModal(false)}
              className="flex-1 h-10 border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateNext("horizon")}
              disabled={
                creatingNext || !nextPOHTitle.trim() || !nextPOHCategory
              }
              className="flex-1 h-10 bg-brand hover:bg-brand/90 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md"
              data-testid="button-submit-horizon"
            >
              {creatingNext ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-align Modal - Redesigned & Responsive */}
      <Dialog open={showRealignModal} onOpenChange={setShowRealignModal}>
        <DialogContent className="w-[95%] sm:w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-2xl p-0 gap-0 bg-white">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                  <Wind className="w-4 h-4 text-brand" />
                </div>
                Re-align Direction
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 ml-10">
                Adjust your course to stay true to your vision.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Target selection */}
            <div className="flex p-1 bg-gray-100 rounded-lg">
              {pohState.active && (
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    realignTarget === "active"
                      ? "bg-white text-brand shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => openRealignFor("active")}
                >
                  Active Project
                </button>
              )}
              {pohState.next && (
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    realignTarget === "next"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => openRealignFor("next")}
                >
                  Next Project
                </button>
              )}
              {pohState.horizon && (
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    realignTarget === "horizon"
                      ? "bg-white text-yellow-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => openRealignFor("horizon")}
                >
                  North Star
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Title
                </label>
                <Input
                  value={realignTitle}
                  onChange={(e) =>
                    setRealignTitle(e.target.value.slice(0, 120))
                  }
                  data-testid="input-realign-title"
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              {realignTarget === "active" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Why this matters
                  </label>
                  <Textarea
                    value={realignWhy}
                    onChange={(e) =>
                      setRealignWhy(e.target.value.slice(0, 500))
                    }
                    className="min-h-[100px] bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                    placeholder="Reconnect with your purpose..."
                    data-testid="input-realign-why"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Category
                </label>
                <Select
                  value={realignCategory}
                  onValueChange={(v) => setRealignCategory(v as Category)}
                >
                  <SelectTrigger
                    data-testid="select-realign-category"
                    className="bg-gray-50 border-gray-200"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "career",
                        "health",
                        "relationships",
                        "wealth",
                        "other",
                      ] as Category[]
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {realignCategory === "other" && (
                  <Input
                    value={realignCustomCategory}
                    onChange={(e) => setRealignCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    className="mt-2 bg-gray-50 border-gray-200"
                  />
                )}
              </div>

              {/* Milestone editing for Active POH */}
              {realignTarget === "active" &&
                pohState.active?.milestones &&
                pohState.active.milestones.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-semibold text-gray-700 block border-b border-gray-100 pb-2">
                      Edit Milestones
                    </label>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {pohState.active.milestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start gap-3 group"
                        >
                          <div
                            className={`mt-2.5 w-2 h-2 rounded-full ${
                              m.achieved ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />

                          {editingMilestoneId === m.id ? (
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                value={editMilestoneText}
                                onChange={(e) =>
                                  setEditMilestoneText(e.target.value)
                                }
                                className="flex-1 text-sm min-h-[60px]"
                                autoFocus
                              />
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={saveMilestoneEdit}
                                  disabled={savingMilestone}
                                  className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                                >
                                  {savingMilestone ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingMilestoneId(null)}
                                  className="p-2 bg-gray-50 text-gray-500 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <span
                                className={`text-sm leading-relaxed ${
                                  m.achieved
                                    ? "text-gray-400 line-through"
                                    : "text-gray-700"
                                }`}
                              >
                                {m.text}
                              </span>
                              {!m.achieved && (
                                <button
                                  onClick={() => {
                                    setEditingMilestoneId(m.id);
                                    setEditMilestoneText(m.text);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-brand hover:bg-brand/10 rounded-md transition-all self-start"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="p-6 pt-2 flex gap-3 bg-gray-50/50 border-t border-gray-100 rounded-b-xl">
            <Button
              variant="outline"
              onClick={() => setShowRealignModal(false)}
              className="flex-1 h-11 border-indigo-100 bg-white hover:bg-gray-50 text-indigo-600 text-xs font-bold rounded-lg shadow-lg shadow-brand/20 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={saveRealign}
              disabled={savingRealign || !realignTitle.trim()}
              className="flex-1 h-11 bg-brand hover:bg-brand/90 text-white text-xs font-bold rounded-lg shadow-lg shadow-brand/20 transition-all"
              data-testid="button-save-realign"
            >
              {savingRealign ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Reflection Modal */}
      <Dialog open={showReflectionModal} onOpenChange={setShowReflectionModal}>
        <DialogContent className="w-[95%] sm:max-w-sm rounded-2xl bg-white p-6">
          <div className="text-center py-2">
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: "rgba(112, 61, 250, 0.1)" }}
            >
              <Heart
                className="w-8 h-8"
                style={{ color: "#703DFA" }}
                fill="currentColor"
              />
            </div>

            <DialogHeader className="mb-4 space-y-2">
              <DialogTitle className="text-center text-2xl font-bold text-gray-900">
                Save Reflection
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Your alignment today:{" "}
                <span
                  className="font-bold text-lg"
                  style={{ color: "#703DFA" }}
                >
                  {sliderValue}/10
                </span>
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm text-gray-500 mb-8 leading-relaxed italic px-4">
              "This moment of self-awareness is a step toward becoming who you
              wish to be."
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReflectionModal(false)}
                className="flex-1 h-11 border-indigo-100 text-indigo-600 font-semibold rounded-xl"
                data-testid="button-cancel-reflection"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setShowReflectionModal(false);
                  await saveRating(sliderValue);
                }}
                disabled={savingRating}
                className="flex-1 h-11 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl shadow-md"
                data-testid="button-confirm-reflection"
              >
                {savingRating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Save Reflection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievement Modal */}
      <Dialog
        open={showAchievementModal}
        onOpenChange={setShowAchievementModal}
      >
        <DialogContent className="w-[95%] sm:max-w-sm rounded-2xl bg-white p-6 border-0 shadow-2xl">
          <div className="text-center py-4">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-yellow-200 blur-xl opacity-50 rounded-full animate-pulse"></div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center relative z-10 shadow-lg"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            <DialogHeader className="mb-3">
              <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500">
                Reflection Saved!
              </DialogTitle>
            </DialogHeader>

            <p className="text-gray-600 mb-8 text-sm italic font-medium">
              "You're building momentum"
            </p>

            <Button
              variant="outline"
              onClick={() => setShowAchievementModal(false)}
              className="w-full h-12 bg-secondary text-white font-semibold rounded-lg transition-all active:scale-[0.98]"
            >
              Let's Keep Going
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
