import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronLeft, Image as ImageIcon, Plus, History, Edit3, Check, X, Sparkles } from "lucide-react";
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

const CATEGORY_LABELS: Record<Category, string> = {
  career: "CAREER",
  health: "HEALTH",
  relationships: "RELATIONSHIPS",
  wealth: "WEALTH",
  other: "OTHER",
};

export default function ProjectOfHeartPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [pohState, setPOHState] = useState<POHState>({ active: null, next: null, horizon: null });
  
  // Creation flow state
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [creationStep, setCreationStep] = useState<"category" | "title" | "why">("category");
  const [newPOH, setNewPOH] = useState({ category: "" as Category | "", customCategory: "", title: "", why: "" });
  const [creatingPOH, setCreatingPOH] = useState(false);
  
  // Milestone states
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestones, setNewMilestones] = useState<string[]>([""]);
  const [creatingMilestones, setCreatingMilestones] = useState(false);
  const [achievingMilestoneId, setAchievingMilestoneId] = useState<string | null>(null);
  const [showAchieveConfirm, setShowAchieveConfirm] = useState(false);
  const [milestoneToAchieve, setMilestoneToAchieve] = useState<Milestone | null>(null);
  const [justAchievedId, setJustAchievedId] = useState<string | null>(null);
  
  // Complete/Close modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeMode, setCompleteMode] = useState<"complete" | "close">("complete");
  const [reflection, setReflection] = useState("");
  const [completing, setCompleting] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  
  // Actions state
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [editActionText, setEditActionText] = useState("");
  const [savingActions, setSavingActions] = useState(false);
  
  // Rating state
  const [sliderValue, setSliderValue] = useState(5);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  
  // Vision upload state
  const [uploadingVisionIndex, setUploadingVisionIndex] = useState<number | null>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);
  const pendingVisionIndex = useRef<number | null>(null);
  
  // Create Next/Horizon modal
  const [showCreateNextModal, setShowCreateNextModal] = useState(false);
  const [showCreateHorizonModal, setShowCreateHorizonModal] = useState(false);
  const [nextPOHTitle, setNextPOHTitle] = useState("");
  const [nextPOHCategory, setNextPOHCategory] = useState<Category | "">("");
  const [nextPOHCustomCategory, setNextPOHCustomCategory] = useState("");
  const [creatingNext, setCreatingNext] = useState(false);
  
  // Re-align modal
  const [showRealignModal, setShowRealignModal] = useState(false);
  const [realignTarget, setRealignTarget] = useState<"active" | "next" | "horizon" | null>(null);
  const [realignTitle, setRealignTitle] = useState("");
  const [realignWhy, setRealignWhy] = useState("");
  const [realignCategory, setRealignCategory] = useState<Category | "">("");
  const [realignCustomCategory, setRealignCustomCategory] = useState("");
  const [savingRealign, setSavingRealign] = useState(false);
  
  // Milestone editing in realign
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneText, setEditMilestoneText] = useState("");
  const [savingMilestone, setSavingMilestone] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("@app:user_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
        if (data.active?.today_rating !== null && data.active?.today_rating !== undefined) {
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
      const category = newPOH.category === "other" ? newPOH.customCategory.toLowerCase() : newPOH.category;
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
    const validMilestones = newMilestones.filter(m => m.trim());
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
      const response = await fetch(`/api/poh/milestone/${milestoneToAchieve.id}/achieve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        setJustAchievedId(milestoneToAchieve.id);
        setTimeout(() => setJustAchievedId(null), 800);
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
      const endpoint = completeMode === "complete" 
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
        }, 1500);
      }
    } catch (err) {
      console.error("Complete/close error:", err);
    } finally {
      setCompleting(false);
    }
  };

  // Actions handlers
  const saveAction = async () => {
    if (editingAction === null || !editActionText.trim() || !pohState.active) return;
    
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
    const newActions = baseArray.filter(a => a.trim());
    
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
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch("/api/poh/rate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          poh_id: pohState.active.id,
          local_date: today,
          rating: value 
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setRatingError(data.error || "Failed to save rating");
      } else {
        setSliderValue(value);
      }
    } catch (err) {
      console.error("Save rating error:", err);
      setRatingError("Failed to save rating");
    } finally {
      setSavingRating(false);
    }
  };

  // Vision upload handlers
  const handleVisionSlotClick = (index: number) => {
    if (uploadingVisionIndex !== null || !pohState.active) return;
    pendingVisionIndex.current = index;
    visionInputRef.current?.click();
  };

  const handleVisionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingVisionIndex.current === null || !pohState.active) return;

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
    const category = nextPOHCategory === "other" ? nextPOHCustomCategory.toLowerCase() : nextPOHCategory;
    if (!title || !category) return;
    
    setCreatingNext(true);
    try {
      // Backend requires why field - use placeholder for Next/Horizon since spec doesn't include why in modal
      const defaultWhy = type === "next" 
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
    const poh = target === "active" ? pohState.active : target === "next" ? pohState.next : pohState.horizon;
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
    const poh = realignTarget === "active" ? pohState.active : realignTarget === "next" ? pohState.next : pohState.horizon;
    if (!poh) return;
    
    setSavingRealign(true);
    try {
      const category = realignCategory === "other" ? realignCustomCategory.toLowerCase() : realignCategory;
      const body: Record<string, string> = { title: realignTitle.trim(), category };
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F9FA" }}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Completion animation overlay
  if (showCompletionAnimation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ backgroundColor: "#F8F9FA" }}>
        {/* Background glow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0.3 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute w-64 h-64 rounded-full"
          style={{ 
            background: completeMode === "complete" 
              ? "radial-gradient(circle, rgba(95, 183, 125, 0.4) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(229, 172, 25, 0.4) 0%, transparent 70%)"
          }}
        />
        
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="text-center relative z-10"
        >
          {/* Heart Chakra Icon with pulse */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.8, times: [0, 0.5, 1] }}
            className="mb-6"
          >
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
              style={{ 
                background: completeMode === "complete"
                  ? "linear-gradient(135deg, rgba(95, 183, 125, 0.2) 0%, rgba(95, 183, 125, 0.4) 100%)"
                  : "linear-gradient(135deg, rgba(229, 172, 25, 0.2) 0%, rgba(229, 172, 25, 0.4) 100%)"
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <HeartChakraIcon className="w-14 h-14" />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Sparkles animation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-4"
          >
            <Sparkles className="w-8 h-8 mx-auto" style={{ color: completeMode === "complete" ? "#5FB77D" : "#E5AC19" }} />
          </motion.div>
          
          {/* Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl font-bold mb-2"
            style={{ color: completeMode === "complete" ? "#5FB77D" : "#E5AC19" }}
          >
            {completeMode === "complete" ? "Project Completed!" : "Project Closed"}
          </motion.h2>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-500 mb-6"
          >
            A chapter closes. Your journey continues.
          </motion.p>
          
          {/* Encouraging message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="p-4 rounded-2xl mx-auto max-w-xs"
            style={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
          >
            <p className="text-sm text-gray-600 italic leading-relaxed">
              "Every ending is a beginning in disguise. What you've learned lives on within you."
            </p>
          </motion.div>
          
          {/* Loading indicator for transition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8"
          >
            <p className="text-xs text-gray-400">Preparing your next chapter...</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // START SCREEN: No active POH
  if (!pohState.active && !showCreationFlow) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "#F8F9FA" }}>
        {/* Header */}
        <div className="bg-white border-b py-4 px-4 sticky top-0 z-50">
          <div className="flex items-center max-w-md mx-auto">
            <button onClick={() => setLocation("/")} className="p-2 rounded-lg hover:bg-gray-100" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-gray-500 tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                PROJECT OF HEART
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-8 space-y-6">
          {/* Heart Chakra Context */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="p-5 border-0" style={{ backgroundColor: "white" }} data-testid="card-heart-chakra">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "radial-gradient(circle, rgba(95, 183, 125, 0.3) 0%, transparent 70%)" }}>
                  <HeartChakraIcon className="w-13 h-13" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: "#5FB77D" }}>Heart Chakra — Anahata</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Center of Love, Balance, and Purpose. Your Project of Heart aligns with the bridge between who you were and who you're rising to be.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Explanation Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="p-6 border-0" style={{ backgroundColor: "white" }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">What is a Project of Heart?</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                A Project of Heart is not a task list or a goal. It's a declaration of who you are becoming in this phase of your life. 
                It reflects your deepest intention — something that matters to your heart, not just your mind.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                You can have one active Project at a time, with a Next and a North Star guiding your longer journey.
              </p>
            </Card>
          </motion.div>

          {/* CTA Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Button
              onClick={() => setShowCreationFlow(true)}
              className="w-full py-6 text-base font-semibold"
              style={{ backgroundColor: "#703DFA" }}
              data-testid="button-create-poh"
            >
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
      <div className="min-h-screen pb-24" style={{ backgroundColor: "#F8F9FA" }}>
        {/* Header */}
        <div className="bg-white border-b py-4 px-4 sticky top-0 z-50">
          <div className="flex items-center max-w-md mx-auto">
            <button onClick={() => { setShowCreationFlow(false); setCreationStep("category"); }} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-gray-500 tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                CREATE PROJECT
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {creationStep === "category" && (
              <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">What area of life does this serve?</h2>
                <div className="space-y-3">
                  {(["career", "health", "relationships", "wealth", "other"] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewPOH(p => ({ ...p, category: cat }))}
                      className={`w-full p-4 rounded-lg text-left border transition-all ${newPOH.category === cat ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
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
                    onChange={(e) => setNewPOH(p => ({ ...p, customCategory: e.target.value }))}
                    className="mt-4"
                    data-testid="input-custom-category"
                  />
                )}
                <Button
                  onClick={() => setCreationStep("title")}
                  disabled={!newPOH.category || (newPOH.category === "other" && !newPOH.customCategory.trim())}
                  className="w-full mt-6"
                  style={{ backgroundColor: "#703DFA" }}
                  data-testid="button-next-step"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {creationStep === "title" && (
              <motion.div key="title" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-gray-500 mb-2">For this phase of my life, this one thing matters most:</p>
                <Textarea
                  placeholder="Enter your Project of Heart title..."
                  value={newPOH.title}
                  onChange={(e) => setNewPOH(p => ({ ...p, title: e.target.value.slice(0, 120) }))}
                  className="min-h-[100px] text-lg"
                  data-testid="input-poh-title"
                />
                <p className="text-xs text-gray-400 mt-2">{newPOH.title.length}/120</p>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setCreationStep("category")} className="flex-1">Back</Button>
                  <Button
                    onClick={() => setCreationStep("why")}
                    disabled={!newPOH.title.trim()}
                    className="flex-1"
                    style={{ backgroundColor: "#703DFA" }}
                    data-testid="button-next-step"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {creationStep === "why" && (
              <motion.div key="why" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-gray-500 mb-2">Why this matters to my heart:</p>
                <Textarea
                  placeholder="What makes this meaningful to you?"
                  value={newPOH.why}
                  onChange={(e) => setNewPOH(p => ({ ...p, why: e.target.value.slice(0, 500) }))}
                  className="min-h-[150px]"
                  data-testid="input-poh-why"
                />
                <p className="text-xs text-gray-400 mt-2">{newPOH.why.length}/500</p>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setCreationStep("title")} className="flex-1">Back</Button>
                  <Button
                    onClick={handleCreatePOH}
                    disabled={!newPOH.why.trim() || creatingPOH}
                    className="flex-1"
                    style={{ backgroundColor: "#703DFA" }}
                    data-testid="button-create-poh-submit"
                  >
                    {creatingPOH ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <div className="bg-white border-b py-4 px-4 sticky top-0 z-50">
        <div className="flex items-center max-w-md mx-auto">
          <button onClick={() => setLocation("/")} className="p-2 rounded-lg hover:bg-gray-100" data-testid="button-back">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-500 tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
              PROJECT OF HEART
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Heart Chakra Context */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="p-4 border-0" style={{ backgroundColor: "white" }} data-testid="card-heart-chakra">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "radial-gradient(circle, rgba(95, 183, 125, 0.3) 0%, transparent 70%)" }}>
                <HeartChakraIcon className="w-13 h-13" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold leading-tight" style={{ color: "#5FB77D" }}>Heart Chakra — Anahata</h3>
                <p className="text-xs text-gray-500 mt-1 leading-snug">
                  Center of Love, Balance, and Purpose.
                </p>
                <p className="text-xs text-gray-500 leading-snug">
                  Your Project of Heart aligns with the bridge between who you were and who you're rising to be.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ACTIVE POH CARD */}
        {pohState.active && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <div 
              className="relative overflow-hidden"
              style={{ 
                backgroundColor: "white", 
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
              }}
            >
              {/* Subtle left accent line */}
              <div 
                className="absolute left-0 top-4 bottom-4"
                style={{ 
                  width: "3px",
                  backgroundColor: "rgba(0,0,0,0.06)",
                  borderRadius: "0 2px 2px 0"
                }}
              />

              {/* Header Row - Category Left, Status Right */}
              <div className="flex items-center justify-between mb-4">
                <span 
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(112, 61, 250, 0.08)", color: "#703DFA" }}
                >
                  {CATEGORY_LABELS[pohState.active.category as Category] || pohState.active.category.toUpperCase()}
                </span>
                <span 
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(95,183,125,0.12)", color: "#5FB77D" }}
                >
                  ACTIVE
                </span>
              </div>

              {/* Title */}
              <h2 
                className="font-semibold leading-relaxed mb-5"
                style={{ 
                  fontSize: "18px",
                  lineHeight: "26px",
                  color: "#3D3D3D"
                }} 
                data-testid="text-active-poh-title"
              >
                {pohState.active.title}
              </h2>

              {/* Why */}
              {pohState.active.why && (
                <div className="mb-6">
                  <p 
                    style={{ 
                      fontSize: "13px", 
                      fontWeight: 600,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "#4d7c6f",
                      marginTop: "20px",
                      marginBottom: "10px"
                    }}
                  >
                    Why this matters to my heart
                  </p>
                  <p 
                    className="italic"
                    style={{ 
                      fontSize: "14px",
                      lineHeight: "22px",
                      color: "#6B7280"
                    }}
                  >
                    {pohState.active.why}
                  </p>
                </div>
              )}

              {/* Vision Section */}
              <div className="mb-8 px-2">
                <div>
                  <span 
                    style={{ 
                      fontSize: "13px", 
                      fontWeight: 600,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "#4C4F9D",
                      display: "block",
                      marginTop: "20px",
                      marginBottom: "10px"
                    }}
                  >
                    Visions
                  </span>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {[0, 1, 2].map((index) => {
                    const hasImage = pohState.active?.vision_images?.[index];
                    const isUploading = uploadingVisionIndex === index;
                    
                    return (
                      <div
                        key={index}
                        className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.02] flex items-center justify-center overflow-hidden"
                        onClick={() => handleVisionSlotClick(index)}
                        data-testid={`button-vision-image-${index}`}
                        style={{
                          width: "140px",
                          height: "140px",
                          borderRadius: "16px",
                          backgroundColor: hasImage ? "transparent" : "#F8F8F8",
                          border: hasImage ? "none" : "2px dashed rgba(0,0,0,0.12)",
                        }}
                      >
                        {isUploading ? (
                          <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
                        ) : hasImage ? (
                          <img 
                            src={pohState.active!.vision_images![index]} 
                            alt={`Vision ${index + 1}`} 
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "16px",
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Plus className="w-7 h-7 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400">Add vision</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <input ref={visionInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleVisionFileChange} />
              </div>

              {/* Milestones Section */}
              <div className="mb-6">
                <p 
                  style={{ 
                    fontSize: "13px", 
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    color: "#B89B5E",
                    marginTop: "20px",
                    marginBottom: "10px"
                  }}
                >
                  Milestones
                </p>
                
                {(!pohState.active.milestones || pohState.active.milestones.length === 0) ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowMilestoneModal(true)}
                    className="w-full"
                    data-testid="button-create-milestones"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Milestones
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {pohState.active.milestones.map((milestone) => (
                      <motion.div
                        key={milestone.id}
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => handleMilestoneClick(milestone)}
                        data-testid={`milestone-${milestone.id}`}
                        animate={justAchievedId === milestone.id ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        <motion.span
                          className="text-lg leading-none mt-0.5"
                          style={{ color: milestone.achieved ? "#5FB77D" : "#CFCFCF" }}
                          animate={justAchievedId === milestone.id ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                        >
                          {achievingMilestoneId === milestone.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : milestone.achieved ? "●" : "○"}
                        </motion.span>
                        <span className={`text-sm leading-relaxed ${milestone.achieved ? "text-gray-500" : "text-gray-700"}`}>
                          {milestone.text}
                        </span>
                      </motion.div>
                    ))}
                    {pohState.active.milestones.length < 5 && (
                      <button
                        onClick={() => setShowMilestoneModal(true)}
                        className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-600"
                        data-testid="button-add-milestone"
                      >
                        <Plus className="w-4 h-4" />
                        Add milestone
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Complete/Close Button */}
              <Button
                variant="outline"
                onClick={() => { setCompleteMode("complete"); setShowCompleteModal(true); }}
                className="w-full mt-4"
                data-testid="button-complete-poh"
              >
                Complete / Close Project
              </Button>

              {/* Re-align Link - bottom right */}
              <div className="flex justify-end mt-3">
                <button onClick={() => openRealignFor("active")} className="text-sm text-purple-500 hover:text-purple-600" data-testid="button-realign-active">
                  Re-align →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIONS + DAILY RATING CARD */}
        {pohState.active && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
            <div className="rounded-2xl px-5 py-6" style={{ backgroundColor: "white", boxShadow: "0 6px 28px rgba(0,0,0,0.06)" }} data-testid="card-actions-rating">
              {/* Actions Header */}
              <p 
                style={{ 
                  fontSize: "13px", 
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "#703DFA",
                  marginBottom: "12px"
                }}
              >
                My Top 3 Actions Today
              </p>

              {/* Action List - Always show 3 slots */}
              <div className="space-y-3 mb-8">
                {[0, 1, 2].map((index) => {
                  const existingAction = pohState.active?.actions?.[index];
                  return (
                    <div key={index} className="flex items-center gap-3 group" data-testid={`action-${index}`}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "rgba(112, 61, 250, 0.8)" }} />
                      {editingAction === index ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editActionText}
                            onChange={(e) => setEditActionText(e.target.value)}
                            placeholder="Enter action..."
                            className="flex-1 text-sm px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                            autoFocus
                            onBlur={saveAction}
                            onKeyDown={(e) => e.key === "Enter" && saveAction()}
                          />
                          {savingActions && <Loader2 className="w-4 h-4 animate-spin" />}
                        </div>
                      ) : existingAction ? (
                        <>
                          <span className="text-sm text-gray-700 flex-1">{existingAction.text}</span>
                          <button onClick={() => { setEditingAction(index); setEditActionText(existingAction.text); }} className="opacity-0 group-hover:opacity-100 p-1">
                            <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingAction(index); setEditActionText(""); }} className="text-sm text-gray-400 hover:text-gray-600">
                          + Add action
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 my-6" />

              {/* Daily Rating */}
              <h4 className="text-sm font-semibold text-gray-700 mb-4">How aligned were my actions with my intention today?</h4>
              <div className="py-2">
                <Slider
                  value={[sliderValue]}
                  onValueChange={(v) => setSliderValue(v[0])}
                  onValueCommit={(v) => saveRating(v[0])}
                  max={10}
                  step={1}
                  className="w-full"
                  disabled={savingRating}
                />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-xs text-gray-400">0</span>
                <span className="text-sm font-medium text-gray-500">{sliderValue} {savingRating && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}</span>
                <span className="text-xs text-gray-400">10</span>
              </div>
              {ratingError && <p className="text-xs text-red-500 mt-2">{ratingError}</p>}
              <p className="text-sm text-gray-500 mt-4">A moment of awareness, practiced daily, shapes how you show up.</p>
            </div>
          </motion.div>
        )}

        {/* Create NEXT POH Button */}
        {pohState.active && !pohState.next && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowCreateNextModal(true)} data-testid="button-create-next">
              <Plus className="w-4 h-4 mr-2" />
              Create NEXT POH
            </Button>
          </div>
        )}

        {/* NEXT POH CARD */}
        {pohState.next && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
            <div className="rounded-2xl px-4 py-4" style={{ backgroundColor: "rgba(255, 255, 255, 0.92)" }} data-testid="card-next-poh">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(112, 61, 250, 0.08)", color: "#703DFA" }}>
                  {CATEGORY_LABELS[pohState.next.category as Category] || pohState.next.category.toUpperCase()}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(88, 101, 242, 0.14)", color: "#5865F2" }}>NEXT</span>
              </div>
              <p className="text-base font-medium text-gray-600 leading-relaxed" data-testid="text-next-poh">{pohState.next.title}</p>
              <p className="text-xs text-gray-400 mt-2">This comes after I complete my current Project of Heart.</p>
            </div>
          </motion.div>
        )}

        {/* Create NORTH STAR Button */}
        {pohState.active && !pohState.horizon && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowCreateHorizonModal(true)} data-testid="button-create-horizon">
              <Plus className="w-4 h-4 mr-2" />
              Create NORTH STAR
            </Button>
          </div>
        )}

        {/* NORTH STAR (Horizon) CARD */}
        {pohState.horizon && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <div className="rounded-2xl px-4 py-4" style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }} data-testid="card-horizon-poh">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(112, 61, 250, 0.08)", color: "#703DFA" }}>
                  {CATEGORY_LABELS[pohState.horizon.category as Category] || pohState.horizon.category.toUpperCase()}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245, 235, 200, 0.6)", color: "#8A7F5A" }}>NORTH STAR</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed" data-testid="text-someday-poh">{pohState.horizon.title}</p>
            </div>
          </motion.div>
        )}


        {/* History Link */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Milestones</DialogTitle>
            <DialogDescription>Add up to 5 milestones that reflect shifts in you.</DialogDescription>
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
                  <button onClick={() => setNewMilestones(newMilestones.filter((_, idx) => idx !== i))}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
            {newMilestones.length < 5 && (
              <button onClick={() => setNewMilestones([...newMilestones, ""])} className="text-sm text-purple-500 hover:text-purple-600">
                + Add another
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowMilestoneModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreateMilestones} disabled={creatingMilestones || !newMilestones.some(m => m.trim())} className="flex-1" style={{ backgroundColor: "#703DFA" }}>
              {creatingMilestones ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Milestones"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Achievement Confirmation Modal */}
      <Dialog open={showAchieveConfirm} onOpenChange={setShowAchieveConfirm}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Mark Milestone</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">This milestone reflects a shift in you. Mark it when it feels true.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAchieveConfirm(false)} className="flex-1">Not yet</Button>
            <Button onClick={handleAchieveMilestone} className="flex-1" style={{ backgroundColor: "#5FB77D" }} data-testid="button-confirm-achieve">
              It's ready to be marked
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete/Close Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{completeMode === "complete" ? "Complete Project" : "Close Project Early"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2 mb-4">
              <Button variant={completeMode === "complete" ? "default" : "outline"} onClick={() => setCompleteMode("complete")} className="flex-1" style={completeMode === "complete" ? { backgroundColor: "#5FB77D" } : {}}>
                Complete
              </Button>
              <Button variant={completeMode === "close" ? "default" : "outline"} onClick={() => setCompleteMode("close")} className="flex-1" style={completeMode === "close" ? { backgroundColor: "#E5AC19" } : {}}>
                Close Early
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-2">Share a reflection on your journey (min 20 characters):</p>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did this project teach you?"
              className="min-h-[100px]"
              data-testid="input-reflection"
            />
            <p className="text-xs text-gray-400 mt-1">{reflection.length}/20 minimum</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowCompleteModal(false); setReflection(""); }} className="flex-1">Cancel</Button>
            <Button onClick={handleComplete} disabled={completing || reflection.trim().length < 20} className="flex-1" style={{ backgroundColor: completeMode === "complete" ? "#5FB77D" : "#E5AC19" }} data-testid="button-submit-complete">
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : completeMode === "complete" ? "Complete" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Next POH Modal */}
      <Dialog open={showCreateNextModal} onOpenChange={setShowCreateNextModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Next POH</DialogTitle>
            <DialogDescription>What direction feels right after this phase?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={nextPOHTitle}
              onChange={(e) => setNextPOHTitle(e.target.value.slice(0, 120))}
              placeholder="Enter title..."
              data-testid="input-next-title"
            />
            <Select value={nextPOHCategory} onValueChange={(v) => setNextPOHCategory(v as Category)}>
              <SelectTrigger data-testid="select-next-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(["career", "health", "relationships", "wealth", "other"] as Category[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nextPOHCategory === "other" && (
              <Input value={nextPOHCustomCategory} onChange={(e) => setNextPOHCustomCategory(e.target.value)} placeholder="Enter custom category" />
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateNextModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => handleCreateNext("next")} disabled={creatingNext || !nextPOHTitle.trim() || !nextPOHCategory} className="flex-1" style={{ backgroundColor: "#703DFA" }} data-testid="button-submit-next">
              {creatingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create North Star Modal */}
      <Dialog open={showCreateHorizonModal} onOpenChange={setShowCreateHorizonModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create North Star</DialogTitle>
            <DialogDescription>This guides you, even when you're not actively working on it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={nextPOHTitle}
              onChange={(e) => setNextPOHTitle(e.target.value.slice(0, 120))}
              placeholder="Enter title..."
              data-testid="input-horizon-title"
            />
            <Select value={nextPOHCategory} onValueChange={(v) => setNextPOHCategory(v as Category)}>
              <SelectTrigger data-testid="select-horizon-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(["career", "health", "relationships", "wealth", "other"] as Category[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nextPOHCategory === "other" && (
              <Input value={nextPOHCustomCategory} onChange={(e) => setNextPOHCustomCategory(e.target.value)} placeholder="Enter custom category" />
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateHorizonModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => handleCreateNext("horizon")} disabled={creatingNext || !nextPOHTitle.trim() || !nextPOHCategory} className="flex-1" style={{ backgroundColor: "#703DFA" }} data-testid="button-submit-horizon">
              {creatingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-align Modal */}
      <Dialog open={showRealignModal} onOpenChange={setShowRealignModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Re-align your direction</DialogTitle>
            <DialogDescription>Something feels misaligned?</DialogDescription>
          </DialogHeader>
          
          {/* Target selection */}
          <div className="flex gap-2 py-2">
            {pohState.active && (
              <Button size="sm" variant={realignTarget === "active" ? "default" : "outline"} onClick={() => openRealignFor("active")} style={realignTarget === "active" ? { backgroundColor: "#5FB77D" } : {}}>
                Active
              </Button>
            )}
            {pohState.next && (
              <Button size="sm" variant={realignTarget === "next" ? "default" : "outline"} onClick={() => openRealignFor("next")} style={realignTarget === "next" ? { backgroundColor: "#5865F2" } : {}}>
                Next
              </Button>
            )}
            {pohState.horizon && (
              <Button size="sm" variant={realignTarget === "horizon" ? "default" : "outline"} onClick={() => openRealignFor("horizon")} style={realignTarget === "horizon" ? { backgroundColor: "#8A7F5A" } : {}}>
                North Star
              </Button>
            )}
          </div>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Title</label>
              <Input value={realignTitle} onChange={(e) => setRealignTitle(e.target.value.slice(0, 120))} data-testid="input-realign-title" />
            </div>
            
            {realignTarget === "active" && (
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Why this matters</label>
                <Textarea value={realignWhy} onChange={(e) => setRealignWhy(e.target.value.slice(0, 500))} className="min-h-[80px]" data-testid="input-realign-why" />
              </div>
            )}
            
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Category</label>
              <Select value={realignCategory} onValueChange={(v) => setRealignCategory(v as Category)}>
                <SelectTrigger data-testid="select-realign-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(["career", "health", "relationships", "wealth", "other"] as Category[]).map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {realignCategory === "other" && (
                <Input value={realignCustomCategory} onChange={(e) => setRealignCustomCategory(e.target.value)} placeholder="Enter custom category" className="mt-2" />
              )}
            </div>

            {/* Milestone editing for Active POH */}
            {realignTarget === "active" && pohState.active?.milestones && pohState.active.milestones.length > 0 && (
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Milestones</label>
                <div className="space-y-2">
                  {pohState.active.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: m.achieved ? "#5FB77D" : "#CFCFCF" }}>{m.achieved ? "●" : "○"}</span>
                      {editingMilestoneId === m.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input value={editMilestoneText} onChange={(e) => setEditMilestoneText(e.target.value)} className="flex-1" />
                          <button onClick={saveMilestoneEdit} disabled={savingMilestone}>
                            {savingMilestone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                          </button>
                          <button onClick={() => setEditingMilestoneId(null)}><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                      ) : (
                        <>
                          <span className={`text-sm flex-1 ${m.achieved ? "text-gray-400" : "text-gray-700"}`}>{m.text}</span>
                          {!m.achieved && (
                            <button onClick={() => { setEditingMilestoneId(m.id); setEditMilestoneText(m.text); }}>
                              <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowRealignModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={saveRealign} disabled={savingRealign || !realignTitle.trim()} className="flex-1" style={{ backgroundColor: "#703DFA" }} data-testid="button-save-realign">
              {savingRealign ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
