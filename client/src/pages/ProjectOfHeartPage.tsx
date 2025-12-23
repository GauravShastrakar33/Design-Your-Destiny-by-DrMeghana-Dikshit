import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import HeartChakraIcon from "@/components/icons/HeartChakraIcon";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Image as ImageIcon, 
  Plus, 
  History, 
  Sparkles,
  Star,
  Edit3,
  Check,
  X
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
    why: "I want freedom from dependence, fear of exposure, and restarting my life again."
  },
  visionImages: [],
  milestones: [
    { text: "I can start building without guidance", completed: false },
    { text: "I can modify existing code confidently", completed: false },
    { text: "I trust my technical decisions", completed: false },
    { text: "I can explain my work calmly", completed: false },
    { text: "My skills compound instead of resetting", completed: false }
  ],
  actions: [
    "Work on one real feature (45 min)",
    "Read & understand existing code (30 min)",
    "Ship something small"
  ],
  todayRating: null,
  todayAcknowledged: false,
  todayAcknowledgement: "",
  nextPOH: "Build and run a real business",
  somedayPOH: "Build long-term wealth & freedom through assets"
};

export default function ProjectOfHeartPage() {
  const [, setLocation] = useLocation();
  const [pohData, setPOHData] = useState<POHData>(defaultPOHData);
  const [sliderValue, setSliderValue] = useState<number>(5);
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [editActionText, setEditActionText] = useState("");
  const [showAcknowledgeInput, setShowAcknowledgeInput] = useState(false);
  const [acknowledgementText, setAcknowledgementText] = useState("");

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
        todayAcknowledgement: acknowledgementText.trim()
      });
      setShowAcknowledgeInput(false);
    } else {
      setShowAcknowledgeInput(true);
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
            <h1 className="text-xs font-semibold tracking-widest text-gray-400">
              PROJECT OF HEART
            </h1>
          </div>
          <button
            onClick={() => setLocation("/project-of-heart/history")}
            className="p-2 rounded-lg hover:bg-gray-100"
            data-testid="button-history"
          >
            <History className="w-5 h-5 text-gray-500" />
          </button>
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
            className="p-4 border-0"
            style={{ backgroundColor: "rgba(95, 183, 125, 0.08)" }}
            data-testid="card-heart-chakra"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "radial-gradient(circle, rgba(95, 183, 125, 0.3) 0%, transparent 70%)",
                }}
              >
                <HeartChakraIcon className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "#5FB77D" }}>
                  Heart Chakra — Anahata
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Center of Love, Balance, and Purpose. Your Project of Heart aligns with the bridge between who you were and who you're rising to be.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* SECTION 1: Active Project of Heart (Hero) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-5 border-0 shadow-sm" data-testid="card-active-poh">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: "#E5AC19" }} />
              <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                Active Project of Heart
              </span>
            </div>
            <h2 
              className="text-xl font-bold leading-tight mb-4"
              style={{ color: "#2D2D2D" }}
              data-testid="text-active-poh-title"
            >
              {pohData.activePOH.title}
            </h2>
            <div 
              className="border-l-2 pl-3 py-1"
              style={{ borderColor: "#E5AC19" }}
            >
              <p className="text-xs text-gray-400 mb-1">Why this matters to my heart:</p>
              <p className="text-sm text-gray-600 italic" data-testid="text-active-poh-why">
                {pohData.activePOH.why}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* SECTION 2: Vision Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="p-4 border-0 shadow-sm" data-testid="card-vision-board">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                Vision
              </span>
              <span className="text-xs text-gray-400">Optional</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "rgba(112, 61, 250, 0.05)" }}
                  data-testid={`button-vision-image-${index}`}
                >
                  {pohData.visionImages[index] ? (
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
          </Card>
        </motion.div>

        {/* SECTION 3: Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="p-4 border-0 shadow-sm" data-testid="card-milestones">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4" style={{ color: "#5FB77D" }} />
              <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                Milestones — Freedoms I'm Earning
              </span>
            </div>
            <div className="space-y-3">
              {pohData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 group"
                  data-testid={`milestone-${index}`}
                >
                  <Checkbox
                    checked={milestone.completed}
                    onCheckedChange={() => toggleMilestone(index)}
                    className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#5FB77D] data-[state=checked]:border-[#5FB77D]"
                    data-testid={`checkbox-milestone-${index}`}
                  />
                  <span
                    className={`text-sm leading-relaxed transition-colors ${
                      milestone.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }`}
                  >
                    {milestone.text}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* SECTION 4: Top 3 Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="p-4 border-0 shadow-sm" data-testid="card-actions">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#703DFA" }}
              >
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                Top 3 Actions for My POH
              </span>
            </div>
            <div className="space-y-3">
              {pohData.actions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 group"
                  data-testid={`action-${index}`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#703DFA" }}
                  />
                  {editingAction === index ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editActionText}
                        onChange={(e) => setEditActionText(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                        autoFocus
                        data-testid={`input-action-${index}`}
                      />
                      <button
                        onClick={saveAction}
                        className="p-1 hover:bg-gray-100 rounded"
                        data-testid={`button-save-action-${index}`}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => setEditingAction(null)}
                        className="p-1 hover:bg-gray-100 rounded"
                        data-testid={`button-cancel-action-${index}`}
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
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                        data-testid={`button-edit-action-${index}`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* SECTION 5: Rate Yourself Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card 
            className="p-5 border-0 shadow-sm"
            style={{ 
              background: pohData.todayAcknowledged 
                ? "linear-gradient(135deg, rgba(229, 172, 25, 0.08) 0%, rgba(95, 183, 125, 0.08) 100%)"
                : "white"
            }}
            data-testid="card-self-rating"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Rate Yourself Today
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Do you want to acknowledge taking action on your POH today?
            </p>

            {pohData.todayAcknowledged ? (
              <div className="text-center py-4">
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                  style={{ backgroundColor: "rgba(229, 172, 25, 0.15)" }}
                >
                  <Star className="w-4 h-4" style={{ color: "#E5AC19" }} fill="#E5AC19" />
                  <span className="text-sm font-medium" style={{ color: "#B8860B" }}>
                    You rated yourself {pohData.todayRating}/10 today
                  </span>
                </div>
                {pohData.todayAcknowledgement && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    "{pohData.todayAcknowledgement}"
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="px-2 mb-6">
                  <Slider
                    value={[sliderValue]}
                    onValueChange={handleSliderChange}
                    max={10}
                    step={1}
                    className="w-full"
                    data-testid="slider-rating"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400">0</span>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: "#703DFA" }}
                      data-testid="text-rating-value"
                    >
                      {sliderValue}
                    </span>
                    <span className="text-xs text-gray-400">10</span>
                  </div>
                </div>

                {showAcknowledgeInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-4"
                  >
                    <textarea
                      value={acknowledgementText}
                      onChange={(e) => setAcknowledgementText(e.target.value)}
                      placeholder="I want to acknowledge myself for..."
                      className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      rows={2}
                      data-testid="input-acknowledgement"
                    />
                  </motion.div>
                )}

                <Button
                  onClick={handleAcknowledge}
                  className="w-full gap-2"
                  style={{ 
                    backgroundColor: "#E5AC19",
                    color: "white"
                  }}
                  data-testid="button-acknowledge"
                >
                  <Star className="w-4 h-4" />
                  {showAcknowledgeInput ? "Save Acknowledgement" : "I want to acknowledge myself for this"}
                </Button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  There is no right score. This is for self-awareness, not judgement.
                </p>
              </>
            )}
          </Card>
        </motion.div>

        {/* SECTION 6: Next Project of Heart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card 
            className="p-4 border-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
            data-testid="card-next-poh"
          >
            <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
              Next Project of Heart
            </span>
            <h3 className="text-base font-medium text-gray-500 mt-2" data-testid="text-next-poh">
              {pohData.nextPOH}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              This comes after I complete my current Project of Heart.
            </p>
          </Card>
        </motion.div>

        {/* SECTION 7: Someday Project of Heart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div 
            className="px-4 py-3 rounded-lg"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
            data-testid="card-someday-poh"
          >
            <span className="text-xs font-medium tracking-wide text-gray-300 uppercase">
              Someday
            </span>
            <p className="text-sm text-gray-400 mt-1" data-testid="text-someday-poh">
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
