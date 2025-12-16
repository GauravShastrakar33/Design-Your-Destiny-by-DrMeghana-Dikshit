import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Edit, Sparkles, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALL_PRACTICES = [
  "Recognition",
  "EET",
  "Visualisation",
  "Karmic Affirmation",
  "Story Burning",
  "Gratitude Journal",
  "Appreciation Journal",
  "Dump Journal",
  "Mirror Work",
  "Ho'oponopono",
  "Infinity Loop",
  "Meditation",
  "Affirmations",
];

interface DailyLog {
  date: string;
  completed: string[];
}

export default function ProcessChecklistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // User's custom checklist
  const [userChecklist, setUserChecklist] = useState<string[]>([]);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // Today's completed practices
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Edit mode
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempSelectedPractices, setTempSelectedPractices] = useState<string[]>(
    [],
  );

  // Track which practices we've logged today (to avoid duplicate API calls)
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());

  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  // Activity logging mutation for AI Insights
  const logActivityMutation = useMutation({
    mutationFn: async (params: { lessonId: number; lessonName: string }) => {
      const res = await apiRequest("POST", "/api/v1/activity/log", {
        lessonId: params.lessonId,
        lessonName: params.lessonName,
        featureType: "CHECKLIST",
        activityDate: new Date().toISOString().split('T')[0],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0] === "/api/v1/activity/monthly-stats"
      });
    },
  });

  const logChecklistActivity = (practice: string) => {
    if (!isAuthenticated) return;
    if (loggedToday.has(practice)) return;
    
    // Use index in ALL_PRACTICES as stable ID (add 10000 to avoid collision with lesson IDs)
    const practiceIndex = ALL_PRACTICES.indexOf(practice);
    const lessonId = practiceIndex >= 0 ? 10000 + practiceIndex : 10000 + practice.length;
    
    setLoggedToday(prev => new Set(prev).add(practice));
    logActivityMutation.mutate({ lessonId, lessonName: practice });
  };

  useEffect(() => {
    // Load user's custom checklist
    const storedChecklist = localStorage.getItem("userChecklist");
    if (storedChecklist) {
      const checklist = JSON.parse(storedChecklist);
      setUserChecklist(checklist);
      setIsFirstTime(false);
    } else {
      setIsFirstTime(true);
    }

    // Load today's completed practices
    const today = new Date().toISOString().split("T")[0];
    const dailyLogs: DailyLog[] = JSON.parse(
      localStorage.getItem("dailyLogs") || "[]",
    );
    const todayLog = dailyLogs.find((log) => log.date === today);
    if (todayLog) {
      setCompletedToday(todayLog.completed);
      setSaved(true);
    }
  }, []);

  const handleCreateChecklist = () => {
    setTempSelectedPractices([]);
    setIsEditModalOpen(true);
  };

  const handleEditChecklist = () => {
    setTempSelectedPractices([...userChecklist]);
    setIsEditModalOpen(true);
  };

  const togglePracticeSelection = (practice: string) => {
    setTempSelectedPractices((prev) =>
      prev.includes(practice)
        ? prev.filter((p) => p !== practice)
        : [...prev, practice],
    );
  };

  const handleSaveChecklist = () => {
    if (tempSelectedPractices.length === 0) {
      toast({
        title: "Select at least one practice",
        description: "Choose practices that matter to you",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(
      "userChecklist",
      JSON.stringify(tempSelectedPractices),
    );
    setUserChecklist(tempSelectedPractices);

    // Filter completedToday to only include practices still in the updated checklist
    const filteredCompleted = completedToday.filter((practice) =>
      tempSelectedPractices.includes(practice),
    );
    setCompletedToday(filteredCompleted);

    // Update today's daily log to remove practices no longer in checklist
    const today = new Date().toISOString().split("T")[0];
    const dailyLogs: DailyLog[] = JSON.parse(
      localStorage.getItem("dailyLogs") || "[]",
    );
    const filteredLogs = dailyLogs.filter((log) => log.date !== today);

    if (filteredCompleted.length > 0) {
      filteredLogs.push({
        date: today,
        completed: filteredCompleted,
      });
    }

    localStorage.setItem("dailyLogs", JSON.stringify(filteredLogs));

    setIsFirstTime(false);
    setIsEditModalOpen(false);

    toast({
      title: "Checklist saved!",
      description: `${tempSelectedPractices.length} practices in your daily ritual`,
    });
  };

  const toggleTodayPractice = (practice: string) => {
    const isNowChecking = !completedToday.includes(practice);
    
    setCompletedToday((prev) =>
      prev.includes(practice)
        ? prev.filter((p) => p !== practice)
        : [...prev, practice],
    );
    setSaved(false);

    // Log activity when checking (not unchecking)
    if (isNowChecking) {
      logChecklistActivity(practice);
    }
  };

  const handleSaveToday = () => {
    const today = new Date().toISOString().split("T")[0];
    const dailyLogs: DailyLog[] = JSON.parse(
      localStorage.getItem("dailyLogs") || "[]",
    );

    // Remove existing entry for today
    const filteredLogs = dailyLogs.filter((log) => log.date !== today);

    // Add today's entry
    filteredLogs.push({
      date: today,
      completed: completedToday,
    });

    localStorage.setItem("dailyLogs", JSON.stringify(filteredLogs));
    setSaved(true);

    toast({
      title: "Well done, Champion",
      description: `You've completed ${completedToday.length} of ${userChecklist.length} practices today!`,
    });
  };

  // First-time setup screen
  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-background dark:to-gray-900 pb-20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Start Your Daily Practice Ritual
            </h1>
            <p className="text-xl text-foreground">Hello Champion,</p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ready to build your own Process Checklist — the practices that
              truly matter to you?
            </p>
          </div>

          <Card className="p-6 bg-white border border-gray-200 shadow-xl">
            <div className="space-y-4 text-left">
              <p className="font-semibold text-gray-900">
                This will help you:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Stay consistent</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">
                    Track your journey weekly & monthly
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">
                    See your growth clearly
                  </span>
                </li>
              </ul>
            </div>
          </Card>

          <Button
            onClick={handleCreateChecklist}
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg bg-brand hover:bg-brand/90 text-white"
            data-testid="button-create-checklist"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create My Process Checklist
          </Button>
        </div>

        {/* Practice Selection Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent
            className="max-w-md max-h-[80vh] overflow-y-auto"
            data-testid="dialog-select-practices"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Select Your Daily Practices
              </DialogTitle>
              <DialogDescription>
                Choose the practices you want to include in your daily checklist
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              {ALL_PRACTICES.map((practice) => (
                <div
                  key={practice}
                  className="flex items-center gap-3 p-4 rounded-xl hover-elevate active-elevate-2 transition-all"
                  data-testid={`select-practice-${practice.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Checkbox
                    id={`select-${practice}`}
                    checked={tempSelectedPractices.includes(practice)}
                    onCheckedChange={() => togglePracticeSelection(practice)}
                    className="w-5 h-5"
                  />
                  <label
                    htmlFor={`select-${practice}`}
                    className="flex-1 font-medium text-foreground cursor-pointer text-base"
                  >
                    {practice}
                  </label>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                data-testid="button-cancel-checklist"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChecklist}
                disabled={tempSelectedPractices.length === 0}
                data-testid="button-save-checklist"
              >
                <Check className="w-4 h-4 mr-2" />
                Save My Checklist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Regular daily checklist view
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex-1">
              <h1
                className="text-lg font-semibold text-gray-500"
                style={{ fontFamily: "Montserrat" }}
              >
                MY PRACTICE LOG
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedToday.length} of {userChecklist.length} completed
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditChecklist}
              className="gap-2"
              data-testid="button-edit-checklist"
            >
              <Edit className="w-4 h-4 text-[#703DFA]" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Today's Practices Header Card */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 border-0 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl font-bold mb-1">
                  Today's Practices
                </h2>
                <p className="text-white/90 text-sm">
                  Check off what you've completed
                </p>
              </div>
            </div>
          </Card>

          {/* Practice List */}
          <Card className="p-5 shadow-md rounded-xl bg-white border-[#703DFA]">
            <div className="space-y-2">
              {userChecklist.map((practice) => (
                <div
                  key={practice}
                  className="flex items-center gap-4 p-4 rounded-xl hover-elevate active-elevate-2 transition-all"
                  data-testid={`practice-${practice.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Checkbox
                    id={practice}
                    checked={completedToday.includes(practice)}
                    onCheckedChange={() => toggleTodayPractice(practice)}
                    className="w-5 h-5 rounded-md border-[#703DFA] data-[state=checked]:bg-[#703DFA] data-[state=checked]:border-[#703DFA]"
                  />
                  <label
                    htmlFor={practice}
                    className={`flex-1 font-medium cursor-pointer transition-all ${
                      completedToday.includes(practice)
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {practice}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSaveToday}
            className="w-full h-12 text-base font-semibold shadow-md border-0"
            style={{ backgroundColor: "#703DFA" }}
            disabled={completedToday.length === 0}
            data-testid="button-save-reflection"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Saved
              </>
            ) : (
              "Save Today's Reflection"
            )}
          </Button>
        </div>
      </div>

      {/* Edit Checklist Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="max-w-md max-h-[80vh] overflow-y-auto"
          data-testid="dialog-edit-practices"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Edit Your Daily Practices
            </DialogTitle>
            <DialogDescription>
              Add or remove practices from your daily checklist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {ALL_PRACTICES.map((practice) => (
              <div
                key={practice}
                className="flex items-center gap-3 p-4 rounded-xl hover-elevate active-elevate-2 transition-all"
                data-testid={`edit-practice-${practice.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Checkbox
                  id={`edit-${practice}`}
                  checked={tempSelectedPractices.includes(practice)}
                  onCheckedChange={() => togglePracticeSelection(practice)}
                  className="w-5 h-5"
                />
                <label
                  htmlFor={`edit-${practice}`}
                  className="flex-1 font-medium text-foreground cursor-pointer text-base"
                >
                  {practice}
                </label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChecklist}
              disabled={tempSelectedPractices.length === 0}
              data-testid="button-save-edit"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
