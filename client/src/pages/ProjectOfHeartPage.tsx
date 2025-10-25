import { useState, useEffect } from "react";
import { Heart, Target, Sparkles, Upload, Calendar, Star, Award, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Vision {
  title: string;
  description: string;
  imageUrl?: string;
  createdDate: string;
}

interface WeekReflection {
  actions: string;
  learnings: string;
  wins: string;
  nextStep: string;
}

interface CycleData {
  weeks: {
    [weekKey: string]: WeekReflection;
  };
  completed: boolean;
}

interface POHData {
  vision: Vision | null;
  cycles: {
    [cycleKey: string]: CycleData;
  };
  stars: number;
  selfEvaluation: {
    completed: boolean;
    responses: {
      [questionKey: string]: string;
    };
  } | null;
}

const SELF_EVALUATION_QUESTIONS = [
  "What was my Project of Heart?",
  "What tangible results was I looking for?",
  "What were my challenges?",
  "What actionable steps did I take?",
  "What results did I get?",
  "What are my learnings?",
  "What are my wins?",
  "What have I achieved?"
];

export default function ProjectOfHeartPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("vision");
  const [pohData, setPohData] = useState<POHData>({
    vision: null,
    cycles: {},
    stars: 0,
    selfEvaluation: null
  });

  // Vision state
  const [visionForm, setVisionForm] = useState({ title: "", description: "" });
  const [showVisionDialog, setShowVisionDialog] = useState(false);

  // Journey Planner state
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [weekForm, setWeekForm] = useState<WeekReflection>({
    actions: "",
    learnings: "",
    wins: "",
    nextStep: ""
  });

  // Self Evaluation state
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [evalForm, setEvalForm] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const saved = localStorage.getItem("@app:poh_data");
    if (saved) {
      try {
        setPohData(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading POH data:", error);
      }
    }
  }, []);

  const savePOHData = (newData: POHData) => {
    setPohData(newData);
    localStorage.setItem("@app:poh_data", JSON.stringify(newData));
  };

  const handleSetVision = () => {
    if (!visionForm.title.trim() || !visionForm.description.trim()) {
      toast({
        title: "Please complete all fields",
        description: "Both title and description are required",
        variant: "destructive"
      });
      return;
    }

    const vision: Vision = {
      title: visionForm.title,
      description: visionForm.description,
      createdDate: new Date().toISOString().split('T')[0]
    };

    const newStars = pohData.vision ? pohData.stars : pohData.stars + 1;
    
    savePOHData({
      ...pohData,
      vision,
      stars: newStars
    });

    if (!pohData.vision) {
      toast({
        title: "Vision Set! ⭐",
        description: "Your heart's vision is the seed of transformation.",
        className: "bg-gradient-to-r from-[#FAD0C4] via-[#FFD1BA] to-[#A8E6CF]"
      });
    } else {
      toast({
        title: "Vision Updated",
        description: "Your vision has been updated successfully."
      });
    }

    setShowVisionDialog(false);
  };

  const handleSaveWeekReflection = () => {
    if (!weekForm.actions.trim() || !weekForm.learnings.trim() || !weekForm.wins.trim()) {
      toast({
        title: "Please complete all required fields",
        description: "Actions, learnings, and wins are required",
        variant: "destructive"
      });
      return;
    }

    const cycleKey = `cycle${selectedCycle}`;
    const weekKey = `week${selectedWeek}`;
    
    const updatedCycles = {
      ...pohData.cycles,
      [cycleKey]: {
        weeks: {
          ...(pohData.cycles[cycleKey]?.weeks || {}),
          [weekKey]: weekForm
        },
        completed: false
      }
    };

    // Check if all 4 weeks are completed for this cycle
    const allWeeksCompleted = [1, 2, 3, 4].every(w => 
      updatedCycles[cycleKey]?.weeks[`week${w}`]
    );

    let newStars = pohData.stars;
    if (allWeeksCompleted && !pohData.cycles[cycleKey]?.completed) {
      updatedCycles[cycleKey].completed = true;
      newStars += 2; // Award 2 stars for completing a cycle
      
      toast({
        title: "Cycle Completed! 🌟🌟",
        description: "Each week, your heart expands through awareness and action.",
        className: "bg-gradient-to-r from-[#FAD0C4] via-[#FFD1BA] to-[#A8E6CF]"
      });
    } else {
      toast({
        title: "Reflection Saved 💚",
        description: "Your weekly reflection has been saved."
      });
    }

    savePOHData({
      ...pohData,
      cycles: updatedCycles,
      stars: newStars
    });

    setWeekForm({ actions: "", learnings: "", wins: "", nextStep: "" });
  };

  const handleSaveSelfEvaluation = () => {
    const allAnswered = SELF_EVALUATION_QUESTIONS.every(q => evalForm[q]?.trim());
    
    if (!allAnswered) {
      toast({
        title: "Please answer all questions",
        description: "All fields are required for the self-evaluation",
        variant: "destructive"
      });
      return;
    }

    savePOHData({
      ...pohData,
      selfEvaluation: {
        completed: true,
        responses: evalForm
      },
      stars: pohData.selfEvaluation?.completed ? pohData.stars : pohData.stars + 1
    });

    toast({
      title: "Reflection Complete 🌟",
      description: "You've earned a Golden Star for your introspection!",
      className: "bg-gradient-to-r from-[#FAD0C4] via-[#FFD1BA] to-[#A8E6CF]"
    });

    setShowEvalDialog(false);
  };

  // Load week reflection when selection changes
  useEffect(() => {
    const cycleKey = `cycle${selectedCycle}`;
    const weekKey = `week${selectedWeek}`;
    const saved = pohData.cycles[cycleKey]?.weeks[weekKey];
    if (saved) {
      setWeekForm(saved);
    } else {
      setWeekForm({ actions: "", learnings: "", wins: "", nextStep: "" });
    }
  }, [selectedCycle, selectedWeek, pohData.cycles]);

  const progressPercentage = (pohData.stars / 9) * 100;

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(to bottom right, #FDECEF, #F8E5E5, #E3F8E0)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header with Heart Chakra */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#3D3D3D", fontFamily: "Playfair Display, serif" }}>
                Project of Heart
              </h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Your heart's purpose, guided by love and discipline
              </p>
            </div>
            
            {/* Heart Chakra Symbol */}
            <div className="relative group">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                style={{ background: "radial-gradient(circle, #A8E6CF 0%, transparent 70%)" }}
              >
                <Heart 
                  className="w-10 h-10" 
                  style={{ color: "#A8E6CF" }} 
                  fill="currentColor"
                  data-testid="heart-chakra"
                />
              </div>
              <div className="absolute hidden group-hover:block top-full right-0 mt-2 w-56 p-3 rounded-lg shadow-lg text-xs" style={{ backgroundColor: "#FFFFFF", color: "#3D3D3D" }}>
                <p className="font-semibold mb-1">Heart Chakra – Anahata 💚</p>
                <p className="text-xs opacity-80">Center of Love, Balance, and Purpose. Your Project of Heart aligns with the bridge between physical and spiritual growth.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Star Progress */}
        <Card className="mb-6 p-6 shadow-md shadow-rose-200" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: "#6B7280" }}>Your Growth</p>
              <p className="text-2xl font-bold" style={{ color: "#3D3D3D" }} data-testid="text-stars-count">
                {pohData.stars} Stars ✨
              </p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                Keep glowing, Champion!
              </p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="#F9C5BD"
                  strokeWidth="6"
                  fill="none"
                  opacity="0.2"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="#FDE68A"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(progressPercentage, 100) / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Star className="w-8 h-8" style={{ color: "#FDE68A" }} fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Star Milestones */}
          <div className="space-y-2 text-xs" style={{ color: "#6B7280" }}>
            <div className="flex items-center gap-2">
              {pohData.vision ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
              <span>Set POH → ⭐</span>
            </div>
            <div className="flex items-center gap-2">
              {pohData.cycles.cycle1?.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
              <span>Complete Cycle 1 → ⭐⭐</span>
            </div>
            <div className="flex items-center gap-2">
              {pohData.cycles.cycle2?.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
              <span>Complete Cycle 2 → ⭐⭐</span>
            </div>
            <div className="flex items-center gap-2">
              {pohData.cycles.cycle3?.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
              <span>Complete Cycle 3 → ⭐⭐</span>
            </div>
            <div className="flex items-center gap-2">
              {pohData.selfEvaluation?.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
              <span>Self-Evaluation → 🏅 Golden Star</span>
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="vision" data-testid="tab-vision">Vision</TabsTrigger>
            <TabsTrigger value="journey" data-testid="tab-journey">Journey</TabsTrigger>
            <TabsTrigger value="reflect" data-testid="tab-reflect">Reflect</TabsTrigger>
          </TabsList>

          {/* Vision Board Tab */}
          <TabsContent value="vision">
            <Card className="p-6 shadow-md shadow-rose-200" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem" }}>
              {!pohData.vision ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F9C5BD, #A8E6CF)" }}>
                    <Heart className="w-10 h-10 text-white" fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "#3D3D3D", fontFamily: "Playfair Display, serif" }}>
                    Define Your Heart's Purpose
                  </h3>
                  <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                    A serene, heart-centered space to define your Project of Heart
                  </p>
                  <Button
                    onClick={() => setShowVisionDialog(true)}
                    className="font-semibold"
                    style={{ background: "linear-gradient(to right, #FAD0C4, #FFD1BA, #A8E6CF)", color: "#3D3D3D" }}
                    data-testid="button-set-vision"
                  >
                    Set Your Vision
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-6 h-6" style={{ color: "#F9C5BD" }} fill="currentColor" />
                      <h3 className="text-xl font-semibold" style={{ color: "#3D3D3D", fontFamily: "Playfair Display, serif" }}>
                        Your Vision
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVisionForm({ title: pohData.vision!.title, description: pohData.vision!.description });
                        setShowVisionDialog(true);
                      }}
                      data-testid="button-edit-vision"
                    >
                      Edit
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: "#FDECEF" }}>
                    <p className="font-semibold mb-2" style={{ color: "#3D3D3D" }} data-testid="text-vision-title">{pohData.vision.title}</p>
                    <p className="text-sm" style={{ color: "#6B7280" }} data-testid="text-vision-description">{pohData.vision.description}</p>
                  </div>

                  <div className="p-4 rounded-lg text-center italic" style={{ backgroundColor: "#F5F5F5", color: "#6B7280" }}>
                    <p className="text-sm">
                      "Your heart's vision is the seed of transformation."
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Journey Planner Tab */}
          <TabsContent value="journey">
            <Card className="p-6 shadow-md shadow-rose-200" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem" }}>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2" style={{ color: "#3D3D3D", fontFamily: "Playfair Display, serif" }}>
                  Cycles of Growth
                </h3>
                <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
                  Each week, your heart expands through awareness and action.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div>
                    <Label className="text-xs" style={{ color: "#6B7280" }}>Cycle</Label>
                    <Select value={String(selectedCycle)} onValueChange={(v) => setSelectedCycle(parseInt(v))}>
                      <SelectTrigger data-testid="select-cycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Cycle 1</SelectItem>
                        <SelectItem value="2">Cycle 2</SelectItem>
                        <SelectItem value="3">Cycle 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs" style={{ color: "#6B7280" }}>Week</Label>
                    <Select value={String(selectedWeek)} onValueChange={(v) => setSelectedWeek(parseInt(v))}>
                      <SelectTrigger data-testid="select-week">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Week 1</SelectItem>
                        <SelectItem value="2">Week 2</SelectItem>
                        <SelectItem value="3">Week 3</SelectItem>
                        <SelectItem value="4">Week 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="actions" className="text-xs" style={{ color: "#6B7280" }}>Actions Taken *</Label>
                    <Textarea
                      id="actions"
                      value={weekForm.actions}
                      onChange={(e) => setWeekForm({ ...weekForm, actions: e.target.value })}
                      placeholder="What actions did you take this week?"
                      className="mt-1"
                      rows={3}
                      data-testid="input-actions"
                    />
                  </div>

                  <div>
                    <Label htmlFor="learnings" className="text-xs" style={{ color: "#6B7280" }}>Learnings *</Label>
                    <Textarea
                      id="learnings"
                      value={weekForm.learnings}
                      onChange={(e) => setWeekForm({ ...weekForm, learnings: e.target.value })}
                      placeholder="What did you learn?"
                      className="mt-1"
                      rows={3}
                      data-testid="input-learnings"
                    />
                  </div>

                  <div>
                    <Label htmlFor="wins" className="text-xs" style={{ color: "#6B7280" }}>Wins *</Label>
                    <Textarea
                      id="wins"
                      value={weekForm.wins}
                      onChange={(e) => setWeekForm({ ...weekForm, wins: e.target.value })}
                      placeholder="What were your wins?"
                      className="mt-1"
                      rows={3}
                      data-testid="input-wins"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nextStep" className="text-xs" style={{ color: "#6B7280" }}>Next Step (Optional)</Label>
                    <Textarea
                      id="nextStep"
                      value={weekForm.nextStep}
                      onChange={(e) => setWeekForm({ ...weekForm, nextStep: e.target.value })}
                      placeholder="What's your next step?"
                      className="mt-1"
                      rows={2}
                      data-testid="input-next-step"
                    />
                  </div>

                  <Button
                    onClick={handleSaveWeekReflection}
                    className="w-full font-semibold"
                    style={{ background: "linear-gradient(to right, #FAD0C4, #FFD1BA, #A8E6CF)", color: "#3D3D3D" }}
                    data-testid="button-save-week"
                  >
                    Save Reflection
                  </Button>
                </div>

                <div className="mt-6 p-3 rounded-lg text-center" style={{ backgroundColor: "#F0F9FF" }}>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    💚 Reflect with your heart every Sunday
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Self Evaluation Tab */}
          <TabsContent value="reflect">
            <Card className="p-6 shadow-md shadow-rose-200" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem" }}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FDE68A, #F9C5BD)" }}>
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "#3D3D3D", fontFamily: "Playfair Display, serif" }}>
                  Self-Evaluation
                </h3>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                  Optional deep reflection on your journey
                </p>

                {pohData.selfEvaluation?.completed ? (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0FDF4" }}>
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="font-semibold mb-1" style={{ color: "#3D3D3D" }}>Reflection Complete!</p>
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      You've earned a Golden Star 🏅
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setEvalForm(pohData.selfEvaluation?.responses || {});
                      setShowEvalDialog(true);
                    }}
                    className="font-semibold"
                    style={{ background: "linear-gradient(to right, #FAD0C4, #FFD1BA, #A8E6CF)", color: "#3D3D3D" }}
                    data-testid="button-start-evaluation"
                  >
                    Begin Self-Evaluation
                  </Button>
                )}

                <div className="mt-6 p-4 rounded-lg italic text-center" style={{ backgroundColor: "#F5F5F5", color: "#6B7280" }}>
                  <p className="text-xs leading-relaxed">
                    "When we start, we are one person; months later, we are someone new. Reflection opens new doors and visions."
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Background Affirmations */}
        <div className="fixed bottom-32 left-0 right-0 pointer-events-none">
          <div className="max-w-md mx-auto px-4">
            <p className="text-center text-xs opacity-20 animate-pulse" style={{ color: "#3D3D3D" }}>
              You are becoming your vision • Act from your heart • Love is your superpower
            </p>
          </div>
        </div>
      </div>

      {/* Vision Dialog */}
      <Dialog open={showVisionDialog} onOpenChange={setShowVisionDialog}>
        <DialogContent style={{ backgroundColor: "#FFFDF8" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Playfair Display, serif" }}>
              {pohData.vision ? "Edit Your Vision" : "Set Your Vision"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vision-title">What is your Project of Heart? *</Label>
              <Input
                id="vision-title"
                value={visionForm.title}
                onChange={(e) => setVisionForm({ ...visionForm, title: e.target.value })}
                placeholder="e.g., Launch my wellness coaching business"
                className="mt-2"
                data-testid="input-vision-title"
              />
            </div>
            <div>
              <Label htmlFor="vision-description">Why does this matter to you? *</Label>
              <Textarea
                id="vision-description"
                value={visionForm.description}
                onChange={(e) => setVisionForm({ ...visionForm, description: e.target.value })}
                placeholder="Describe your deeper purpose..."
                className="mt-2"
                rows={4}
                data-testid="input-vision-description"
              />
            </div>
            <Button
              onClick={handleSetVision}
              className="w-full font-semibold"
              style={{ background: "linear-gradient(to right, #FAD0C4, #FFD1BA, #A8E6CF)", color: "#3D3D3D" }}
              data-testid="button-save-vision"
            >
              {pohData.vision ? "Update Vision" : "Set Vision & Earn ⭐"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Self Evaluation Dialog */}
      <Dialog open={showEvalDialog} onOpenChange={setShowEvalDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "#FFFDF8" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Playfair Display, serif" }}>
              Self-Evaluation 🪞
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {SELF_EVALUATION_QUESTIONS.map((question, index) => (
              <div key={index}>
                <Label className="text-sm font-medium" style={{ color: "#3D3D3D" }}>
                  {index + 1}. {question}
                </Label>
                <Textarea
                  value={evalForm[question] || ""}
                  onChange={(e) => setEvalForm({ ...evalForm, [question]: e.target.value })}
                  placeholder="Your reflection..."
                  className="mt-2"
                  rows={3}
                  data-testid={`input-eval-${index}`}
                />
              </div>
            ))}
            <Button
              onClick={handleSaveSelfEvaluation}
              className="w-full font-semibold"
              style={{ background: "linear-gradient(to right, #FAD0C4, #FFD1BA, #A8E6CF)", color: "#3D3D3D" }}
              data-testid="button-save-evaluation"
            >
              Complete Reflection & Earn 🏅
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
