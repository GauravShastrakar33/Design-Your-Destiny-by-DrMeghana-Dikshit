import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  ChevronLeft,
  Image as ImageIcon,
  Plus,
  History,
  Sparkles,
  Star,
  Edit3,
  Check,
  X,
} from "lucide-react";

const POH_STORAGE_KEY = "@app:poh_ui_data";

interface POHData {
  activePOH: {
    title: string;
    why: string;
  };
  visionImages: string[];
  milestones: { text: string; completed: boolean }[];
  actions: string[];
  todayRating: number | null;
  todayAcknowledged: boolean;
  todayAcknowledgement: string;
  nextPOH: string;
  somedayPOH: string;
}

const defaultPOHData: POHData = {
  activePOH: {
    title: "Become technically strong & AI-fluent by building real products",
    why: "I want freedom from dependence, fear of exposure, and restarting my life again.",
  },
  visionImages: [],
  milestones: [
    { text: "I can start building without guidance", completed: false },
    { text: "I can modify existing code confidently", completed: false },
    { text: "I trust my technical decisions", completed: false },
    { text: "I can explain my work calmly", completed: false },
    { text: "My skills compound instead of resetting", completed: false },
  ],
  actions: [
    "Work on one real feature (45 min)",
    "Read & understand existing code (30 min)",
    "Ship something small",
  ],
  todayRating: null,
  todayAcknowledged: false,
  todayAcknowledgement: "",
  nextPOH: "Build and run a real business",
  somedayPOH: "Build long-term wealth & freedom through assets",
};

export default function ProjectOfHeartPage() {
  const [, setLocation] = useLocation();
  const [pohData, setPOHData] = useState<POHData>(defaultPOHData);
  const [sliderValue, setSliderValue] = useState<number>(5);
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [editActionText, setEditActionText] = useState("");
  const [showAcknowledgeInput, setShowAcknowledgeInput] = useState(false);
  const [acknowledgementText, setAcknowledgementText] = useState("");
  const [uploadingVisionIndex, setUploadingVisionIndex] = useState<number | null>(null);
  const [activePOHId, setActivePOHId] = useState<string | null>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);
  const pendingVisionIndex = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(POH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPOHData({ ...defaultPOHData, ...parsed });
        if (parsed.todayRating !== null) {
          setSliderValue(parsed.todayRating);
        }
      } catch (e) {
        console.error("Failed to parse POH data", e);
      }
    }

    const fetchActivePOH = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        
        const response = await fetch("/api/poh/current", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.active) {
            setActivePOHId(data.active.id);
            if (data.active.vision_images) {
              setPOHData((prev) => ({ 
                ...prev, 
                visionImages: data.active.vision_images || [] 
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching active POH:", err);
      }
    };

    fetchActivePOH();
  }, []);

  const savePOHData = (newData: POHData) => {
    setPOHData(newData);
    localStorage.setItem(POH_STORAGE_KEY, JSON.stringify(newData));
  };

  const toggleMilestone = (index: number) => {
    const newMilestones = [...pohData.milestones];
    newMilestones[index].completed = !newMilestones[index].completed;
    savePOHData({ ...pohData, milestones: newMilestones });
  };

  const startEditAction = (index: number) => {
    setEditingAction(index);
    setEditActionText(pohData.actions[index]);
  };

  const saveAction = () => {
    if (editingAction !== null && editActionText.trim()) {
      const newActions = [...pohData.actions];
      newActions[editingAction] = editActionText.trim();
      savePOHData({ ...pohData, actions: newActions });
    }
    setEditingAction(null);
    setEditActionText("");
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
  };

  const handleAcknowledge = () => {
    if (showAcknowledgeInput) {
      savePOHData({
        ...pohData,
        todayRating: sliderValue,
        todayAcknowledged: true,
        todayAcknowledgement: acknowledgementText.trim(),
      });
      setShowAcknowledgeInput(false);
    } else {
      setShowAcknowledgeInput(true);
    }
  };

  const handleVisionSlotClick = (index: number) => {
    if (uploadingVisionIndex !== null) return;
    pendingVisionIndex.current = index;
    visionInputRef.current?.click();
  };

  const handleVisionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingVisionIndex.current === null) return;

    const index = pendingVisionIndex.current;
    pendingVisionIndex.current = null;
    
    if (e.target) e.target.value = "";

    if (!activePOHId) {
      console.error("No active POH ID");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid image type");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error("Image too large (max 5MB)");
      return;
    }

    setUploadingVisionIndex(index);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("index", String(index));

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/poh/${activePOHId}/vision`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Upload failed:", data.error);
        return;
      }

      const data = await response.json();
      const newVisionImages = data.vision_images || [];
      setPOHData((prev) => ({ ...prev, visionImages: newVisionImages }));
      savePOHData({ ...pohData, visionImages: newVisionImages });
    } catch (err) {
      console.error("Vision upload error:", err);
    } finally {
      setUploadingVisionIndex(null);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <div className="bg-white border-b py-4 px-4 sticky top-0 z-50">
        <div className="flex items-center max-w-md mx-auto">
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-lg hover:bg-gray-100"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <h1
              className="text-xl font-bold text-gray-500 tracking-wider"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              PROJECT OF HEART
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* SECTION 0: Heart Chakra Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className="p-5 border-0"
            style={{ backgroundColor: "white" }}
            data-testid="card-heart-chakra"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "radial-gradient(circle, rgba(95, 183, 125, 0.3) 0%, transparent 70%)",
                }}
              >
                <HeartChakraIcon className="w-13 h-13" />
                {/* if w-13 is not supported, use inline style below */}
                {/* <HeartChakraIcon style={{ width: 52, height: 52 }} /> */}
              </div>

              {/* Text */}
              <div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: "#5FB77D" }}
                >
                  Heart Chakra — Anahata
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Center of Love, Balance, and Purpose. Your Project of Heart
                  aligns with the bridge between who you were and who you're
                  rising to be.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* IDENTITY CARD: Active Project of Heart + Vision + Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="px-0"
        >
          <div
            className="rounded-2xl px-5 py-6"
            style={{
              backgroundColor: "white",
              boxShadow: "0 6px 28px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium tracking-wide text-gray-400 uppercase">
                My Project of Heart
              </span>

              {/* ACTIVE badge */}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(95,183,125,0.15)",
                  color: "#5FB77D",
                }}
              >
                ACTIVE
              </span>
            </div>

            {/* Category */}
            <div className="mb-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(112, 61, 250, 0.08)",
                  color: "#703DFA",
                }}
              >
                CAREER
              </span>
            </div>

            {/* Title */}
            <h2
              className="text-xl font-bold leading-tight mb-4"
              style={{ color: "#2D2D2D" }}
              data-testid="text-active-poh-title"
            >
              {pohData.activePOH.title}
            </h2>

            {/* Why */}
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">
                Why this matters to my heart
              </p>
              <p className="text-sm text-gray-600 italic leading-relaxed">
                {pohData.activePOH.why}
              </p>
            </div>

            {/* Vision (optional, inline) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                  Visions
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden"
                    style={{ backgroundColor: "rgba(112, 61, 250, 0.05)" }}
                    onClick={() => handleVisionSlotClick(index)}
                    data-testid={`button-vision-image-${index}`}
                  >
                    {uploadingVisionIndex === index ? (
                      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                    ) : pohData.visionImages[index] ? (
                      <img
                        src={pohData.visionImages[index]}
                        alt={`Vision ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-5 h-5 text-gray-300" />
                        <Plus className="w-3 h-3 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={visionInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleVisionFileChange}
              />
            </div>

            {/* Milestones */}
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-400 uppercase mb-4">
                Milestones
              </p>

              <div className="space-y-4">
                {pohData.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() =>
                      !milestone.completed && markMilestoneAchieved(index)
                    }
                    data-testid={`milestone-${index}`}
                  >
                    <span
                      className="text-lg leading-none mt-0.5"
                      style={{
                        color: milestone.completed ? "#5FB77D" : "#CFCFCF",
                      }}
                    >
                      {milestone.completed ? "●" : "○"}
                    </span>

                    <span
                      className={`text-sm leading-relaxed ${
                        milestone.completed ? "text-gray-500" : "text-gray-700"
                      }`}
                    >
                      {milestone.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 4 + 5: Actions + Daily Reflection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div
            className="rounded-2xl px-5 py-6"
            style={{
              backgroundColor: "white",
              boxShadow: "0 6px 28px rgba(0,0,0,0.06)",
            }}
            data-testid="card-actions-rating"
          >
            {/* ACTIONS HEADER */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#703DFA" }}
              >
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <span className="text-lg font-medium tracking-wide text-gray-400 uppercase">
                Today’s Actions
              </span>
            </div>

            {/* ACTION LIST */}
            <div className="space-y-3 mb-8">
              {pohData.actions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 group"
                  data-testid={`action-${index}`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "rgba(112, 61, 250, 0.8)" }}
                  />

                  {editingAction === index ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editActionText}
                        onChange={(e) => setEditActionText(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                        autoFocus
                      />
                      <button onClick={saveAction} className="p-1">
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => setEditingAction(null)}
                        className="p-1"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-gray-700 flex-1">
                        {action}
                      </span>
                      <button
                        onClick={() => startEditAction(index)}
                        className="opacity-0 group-hover:opacity-100 p-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* DIVIDER */}
            <div className="h-px bg-gray-100 my-6" />

            {/* DAILY RATING */}
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              How aligned were my actions with my intention today?
            </h4>

            <Slider
              value={[sliderValue]}
              onValueChange={(v) => {
                setSliderValue(v[0]);
                savePOHData({
                  ...pohData,
                  todayRating: v[0],
                  todayAcknowledged: true,
                });
              }}
              max={10}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">0</span>
              <span className="text-sm font-medium text-gray-500">
                {sliderValue}
              </span>
              <span className="text-xs text-gray-400">10</span>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Awareness, practiced daily, changes how you show up.
            </p>
          </div>
        </motion.div>

        {/* SECTION 6: Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div
            className="rounded-2xl px-4 py-4"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.92)" }}
            data-testid="card-next-poh"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              {/* Category */}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(112, 61, 250, 0.08)",
                  color: "#703DFA",
                }}
              >
                CAREER
              </span>

              {/* NEXT badge */}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(88, 101, 242, 0.14)",
                  color: "#5865F2",
                }}
              >
                NEXT
              </span>
            </div>

            {/* POH text */}
            <p
              className="text-base font-medium text-gray-600 leading-relaxed"
              data-testid="text-next-poh"
            >
              {pohData.nextPOH}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              This comes after I complete my current Project of Heart.
            </p>
          </div>
        </motion.div>

        {/* SECTION 7: On the Horizon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div
            className="rounded-2xl px-4 py-4"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}
            data-testid="card-horizon-poh"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              {/* Category */}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(112, 61, 250, 0.08)",
                  color: "#703DFA",
                }}
              >
                WEALTH
              </span>

              {/* ON THE HORIZON badge */}
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(245, 235, 200, 0.6)",
                  color: "#8A7F5A",
                }}
              >
                ON THE HORIZON
              </span>
            </div>

            {/* POH text */}
            <p
              className="text-sm text-gray-400 leading-relaxed"
              data-testid="text-someday-poh"
            >
              {pohData.somedayPOH}
            </p>
          </div>
        </motion.div>

        {/* SECTION 8: History Link */}
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
            <span>View Past Projects</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
