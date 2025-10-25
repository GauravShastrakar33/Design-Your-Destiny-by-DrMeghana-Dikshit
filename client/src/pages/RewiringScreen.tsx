import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Eye, EyeOff, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface BeliefPair {
  limiting: string;
  uplifting: string;
  hidden: boolean;
}

export default function RewiringScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [beliefs, setBeliefs] = useState<BeliefPair[]>([
    { limiting: "", uplifting: "", hidden: false }
  ]);

  // Load saved beliefs on mount
  useEffect(() => {
    const saved = localStorage.getItem("@app:rewiring_beliefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setBeliefs(parsed);
        }
      } catch (error) {
        console.error("Error loading beliefs:", error);
      }
    }

    // Check if last update was more than 3 days ago
    const lastUpdate = localStorage.getItem("@app:rewiring_last_update");
    if (lastUpdate) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - parseInt(lastUpdate)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceUpdate >= 3) {
        // Show reminder - we'll display this in the UI
      }
    }
  }, []);

  const handleAddBelief = () => {
    if (beliefs.length < 5) {
      setBeliefs([...beliefs, { limiting: "", uplifting: "", hidden: false }]);
    }
  };

  const handleUpdateBelief = (index: number, field: "limiting" | "uplifting", value: string) => {
    const updated = [...beliefs];
    updated[index][field] = value;
    setBeliefs(updated);
  };

  const handleToggleHidden = (index: number) => {
    const updated = [...beliefs];
    updated[index].hidden = !updated[index].hidden;
    setBeliefs(updated);
  };

  const handleSave = () => {
    // Filter out empty belief pairs
    const filledBeliefs = beliefs.filter(
      (b) => b.limiting.trim() !== "" && b.uplifting.trim() !== ""
    );

    if (filledBeliefs.length === 0) {
      toast({
        title: "No beliefs to save",
        description: "Please enter at least one belief pair before saving.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem("@app:rewiring_beliefs", JSON.stringify(filledBeliefs));
    localStorage.setItem("@app:rewiring_last_update", Date.now().toString());

    // Show success toast
    toast({
      title: "Beautiful progress, Champion!",
      description: "Your beliefs are saved.",
      className: "bg-[#FCE2B7] text-[#2E2C28] border-[#F4B860]",
    });

    // Navigate back after a short delay
    setTimeout(() => {
      setLocation("/money-mastery");
    }, 1500);
  };

  const hasFilledBeliefs = beliefs.some(
    (b) => b.limiting.trim() !== "" || b.uplifting.trim() !== ""
  );

  // Check if reminder should be shown
  const lastUpdate = localStorage.getItem("@app:rewiring_last_update");
  const showReminder = lastUpdate
    ? Math.floor((Date.now() - parseInt(lastUpdate)) / (1000 * 60 * 60 * 24)) >= 3
    : false;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FFFDF8" }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: "#FFFDF8" }}>
          <div className="px-4 py-4 flex items-center gap-4 border-b" style={{ borderColor: "#EDE6DA" }}>
            <button
              onClick={() => setLocation("/money-mastery")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: "#2E2C28" }} />
            </button>
          </div>

          {/* Motivational Header */}
          <div
            className="px-6 py-8 text-center"
            style={{
              background: "linear-gradient(90deg, #FFF7E2, #FFEFD2)",
            }}
          >
            <h1
              className="text-2xl font-semibold mb-2"
              style={{ color: "#2E2C28", fontFamily: "Poppins, sans-serif" }}
            >
              Let's rewire that mindset,{" "}
              <span className="relative inline-block">
                <span style={{ textDecoration: "underline", textDecorationColor: "#F4B860" }}>
                  Champion!
                </span>
              </span>
            </h1>
            <p
              className="text-sm"
              style={{ color: "#726C63", fontFamily: "Inter, sans-serif" }}
            >
              Left tap fear, right tap faith.
            </p>
          </div>

          {/* Reminder if needed */}
          {showReminder && (
            <div className="px-6 py-3 text-center" style={{ backgroundColor: "#FFF5E5" }}>
              <p className="text-sm" style={{ color: "#726C63" }}>
                Your mind loves repetition — let's refresh your empowering beliefs today!
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-4">
          <p
            className="text-center text-sm mb-6"
            style={{ color: "#726C63" }}
          >
            Enter one limiting belief and its uplifting counterpart.
          </p>

          {/* Belief Pairs */}
          {beliefs.map((belief, index) => (
            <Card
              key={index}
              className="p-4 space-y-4"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "#EDE6DA",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
              data-testid={`belief-card-${index}`}
            >
              {/* Limiting Belief */}
              <div className="space-y-2">
                <Label
                  htmlFor={`limiting-${index}`}
                  className="text-xs uppercase font-medium"
                  style={{ color: "#726C63" }}
                >
                  Limiting Belief
                </Label>
                <Input
                  id={`limiting-${index}`}
                  value={belief.limiting}
                  onChange={(e) => handleUpdateBelief(index, "limiting", e.target.value)}
                  placeholder="e.g., I never have enough money"
                  className="border"
                  style={{
                    borderColor: "#EDE6DA",
                    backgroundColor: "#FFFFFF",
                  }}
                  data-testid={`input-limiting-${index}`}
                />
              </div>

              {/* Uplifting Belief */}
              <div className="space-y-2">
                <Label
                  htmlFor={`uplifting-${index}`}
                  className="text-xs uppercase font-medium"
                  style={{ color: "#726C63" }}
                >
                  Uplifting Belief
                </Label>
                <Input
                  id={`uplifting-${index}`}
                  value={belief.uplifting}
                  onChange={(e) => handleUpdateBelief(index, "uplifting", e.target.value)}
                  placeholder="e.g., Abundance flows to me effortlessly"
                  className="border"
                  style={{
                    borderColor: "#EDE6DA",
                    backgroundColor: "#FFFFFF",
                  }}
                  data-testid={`input-uplifting-${index}`}
                />
              </div>

              {/* Summary Box - Show when both are filled */}
              {belief.limiting.trim() !== "" && belief.uplifting.trim() !== "" && !belief.hidden && (
                <div
                  className="p-3 rounded-lg space-y-1"
                  style={{
                    backgroundColor: "#FFF5E5",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "#F4B860",
                  }}
                  data-testid={`summary-${index}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-xs" style={{ color: "#726C63" }}>
                        <span className="font-medium">Limiting →</span> {belief.limiting}
                      </p>
                      <p className="text-xs" style={{ color: "#726C63" }}>
                        <span className="font-medium">Uplifting →</span> {belief.uplifting}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          // Scroll to inputs
                          document.getElementById(`limiting-${index}`)?.focus();
                        }}
                        className="p-1 rounded hover-elevate active-elevate-2"
                        data-testid={`button-edit-${index}`}
                      >
                        <Edit2 className="w-4 h-4" style={{ color: "#726C63" }} />
                      </button>
                      <button
                        onClick={() => handleToggleHidden(index)}
                        className="p-1 rounded hover-elevate active-elevate-2"
                        data-testid={`button-toggle-${index}`}
                      >
                        <Eye className="w-4 h-4" style={{ color: "#726C63" }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden state indicator */}
              {belief.hidden && belief.limiting.trim() !== "" && belief.uplifting.trim() !== "" && (
                <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#F5F5F5" }}>
                  <p className="text-xs italic" style={{ color: "#726C63" }}>
                    Summary hidden
                  </p>
                  <button
                    onClick={() => handleToggleHidden(index)}
                    className="p-1 rounded hover-elevate active-elevate-2"
                    data-testid={`button-show-${index}`}
                  >
                    <EyeOff className="w-4 h-4" style={{ color: "#726C63" }} />
                  </button>
                </div>
              )}
            </Card>
          ))}

          {/* Add New Belief Button */}
          {beliefs.length < 5 && (
            <Button
              onClick={handleAddBelief}
              className="w-full font-medium"
              style={{
                backgroundColor: "#F4B860",
                color: "#2E2C28",
              }}
              data-testid="button-add-belief"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Belief
            </Button>
          )}

          {/* Max beliefs message */}
          {beliefs.length >= 5 && (
            <p className="text-center text-sm italic" style={{ color: "#726C63" }}>
              Max 5 beliefs allowed
            </p>
          )}

          {/* Save & Close Button */}
          <Button
            onClick={handleSave}
            className="w-full font-semibold"
            style={{
              background: "linear-gradient(90deg, #FFD580, #F8A14D)",
              color: "#2E2C28",
              fontFamily: "Poppins, sans-serif",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            data-testid="button-save"
          >
            Save & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
