import { useState, useEffect } from "react";
import { ArrowLeft, Brain, Zap, Plus, Pencil, Trash2, X } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeliefPair {
  limiting: string;
  uplifting: string;
}

export default function RewiringScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [beliefs, setBeliefs] = useState<BeliefPair[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ limiting: "", uplifting: "" });
  const [toggleStates, setToggleStates] = useState<boolean[]>([]);

  // Load saved beliefs on mount
  useEffect(() => {
    const saved = localStorage.getItem("@app:rewiring_beliefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          // Remove 'hidden' property if it exists from old format
          const cleaned = parsed.map((b: any) => ({
            limiting: b.limiting,
            uplifting: b.uplifting,
          }));
          setBeliefs(cleaned);
          setToggleStates(new Array(cleaned.length).fill(false));
        }
      } catch (error) {
        console.error("Error loading beliefs:", error);
      }
    }
  }, []);

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setFormData({ limiting: "", uplifting: "" });
    setShowModal(true);
  };

  const handleOpenEditModal = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...beliefs[index] });
    setShowModal(true);
  };

  const handleSaveModal = () => {
    if (formData.limiting.trim() === "" || formData.uplifting.trim() === "") {
      toast({
        title: "Please complete both fields",
        description: "Both limiting and uplifting beliefs are required.",
        variant: "destructive",
      });
      return;
    }

    let updatedBeliefs: BeliefPair[];

    if (editingIndex !== null) {
      // Edit existing belief
      updatedBeliefs = [...beliefs];
      updatedBeliefs[editingIndex] = formData;
      setBeliefs(updatedBeliefs);
    } else {
      // Add new belief
      if (beliefs.length >= 5) {
        toast({
          title: "Maximum beliefs reached",
          description: "You can have up to 5 belief pairs.",
          variant: "destructive",
        });
        return;
      }
      updatedBeliefs = [...beliefs, formData];
      setBeliefs(updatedBeliefs);
      setToggleStates([...toggleStates, false]);
    }

    // Save immediately with the computed array
    localStorage.setItem("@app:rewiring_beliefs", JSON.stringify(updatedBeliefs));
    localStorage.setItem("@app:rewiring_last_update", Date.now().toString());

    setShowModal(false);
    setFormData({ limiting: "", uplifting: "" });

    toast({
      title: "Beautiful progress, Champion!",
      description: editingIndex !== null ? "Your belief is updated." : "Your belief is saved.",
      className: "bg-[#FCE2B7] text-[#2E2C28] border-[#F4B860]",
    });
  };

  const handleDeleteBelief = (index: number) => {
    const updatedBeliefs = beliefs.filter((_, i) => i !== index);
    const updatedToggles = toggleStates.filter((_, i) => i !== index);
    
    // Update state
    setBeliefs(updatedBeliefs);
    setToggleStates(updatedToggles);
    
    // Save immediately with the computed array
    localStorage.setItem("@app:rewiring_beliefs", JSON.stringify(updatedBeliefs));
    localStorage.setItem("@app:rewiring_last_update", Date.now().toString());

    toast({
      title: "Belief removed",
      description: "Your belief has been deleted.",
    });
  };

  const handleToggleBelief = (index: number) => {
    const updated = [...toggleStates];
    updated[index] = !updated[index];
    setToggleStates(updated);
  };

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
            className="px-6 py-8"
            style={{
              background: "linear-gradient(90deg, #FFF7E2, #FFEFD2)",
            }}
          >
            <h1
              className="text-2xl font-semibold mb-3 text-center"
              style={{ color: "#2E2C28", fontFamily: "Poppins, sans-serif" }}
            >
              Let's rewire that mindset,{" "}
              <span className="relative inline-block">
                <span style={{ textDecoration: "underline", textDecorationColor: "#F4B860" }}>
                  Champion!
                </span>
              </span>
            </h1>
            
            {/* Subtitle with icons */}
            <div className="flex items-center justify-center gap-2">
              <p
                className="text-base font-medium"
                style={{ color: "#726C63", fontFamily: "Inter, sans-serif" }}
              >
                Left tap fear, right tap faith
              </p>
              <div className="flex items-center gap-1.5 ml-2">
                <Brain className="w-4 h-4" style={{ color: "#F4B860" }} />
                <Zap className="w-4 h-4" style={{ color: "#F4B860" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Belief Cards */}
        <div className="px-4 py-6 space-y-4">
          {beliefs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm mb-2" style={{ color: "#726C63" }}>
                No beliefs yet
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Tap the + button below to add your first belief pair
              </p>
            </div>
          ) : (
            beliefs.map((belief, index) => (
              <Card
                key={index}
                className="p-6 relative"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EDE6DA",
                  borderRadius: "1rem",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
                data-testid={`belief-card-${index}`}
              >
                {/* Belief Type Label */}
                <div className="text-center mb-4">
                  <p
                    className="text-xs uppercase font-semibold tracking-wide mb-3"
                    style={{ color: toggleStates[index] ? "#10B981" : "#EF4444" }}
                  >
                    {toggleStates[index] ? "Uplifting Belief" : "Limiting Belief"}
                  </p>
                  
                  {/* Belief Text */}
                  <p
                    className="text-lg font-medium leading-relaxed"
                    style={{ color: "#2E2C28" }}
                    data-testid={`belief-text-${index}`}
                  >
                    {toggleStates[index] ? belief.uplifting : belief.limiting}
                  </p>
                </div>

                {/* Toggle Button */}
                <div className="flex justify-center mb-6">
                  <Button
                    onClick={() => handleToggleBelief(index)}
                    size="sm"
                    style={{
                      backgroundColor: "#F4B860",
                      color: "#2E2C28",
                    }}
                    data-testid={`button-toggle-${index}`}
                  >
                    {toggleStates[index] ? "Show Limiting Belief" : "Show Uplifting Belief"}
                  </Button>
                </div>

                {/* Action Buttons (bottom-right) */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(index)}
                    className="p-2 rounded-lg hover-elevate active-elevate-2"
                    style={{ backgroundColor: "#F9F9F9" }}
                    data-testid={`button-edit-${index}`}
                  >
                    <Pencil className="w-4 h-4" style={{ color: "#726C63" }} />
                  </button>
                  <button
                    onClick={() => handleDeleteBelief(index)}
                    className="p-2 rounded-lg hover-elevate active-elevate-2"
                    style={{ backgroundColor: "#F9F9F9" }}
                    data-testid={`button-delete-${index}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </button>
                </div>
              </Card>
            ))
          )}

          {/* Floating Add Button */}
          {beliefs.length < 5 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleOpenAddModal}
                className="rounded-full p-4 hover-elevate active-elevate-2"
                style={{
                  backgroundColor: "#F4B860",
                  boxShadow: "0 4px 12px rgba(244, 184, 96, 0.3)",
                }}
                data-testid="button-add-belief"
              >
                <Plus className="w-6 h-6" style={{ color: "#2E2C28" }} />
              </button>
            </div>
          )}

          {/* Max beliefs message */}
          {beliefs.length >= 5 && (
            <p className="text-center text-sm italic pt-2" style={{ color: "#726C63" }}>
              Max 5 beliefs reached
            </p>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="max-w-md"
          style={{
            backgroundColor: "#FFFDF8",
            borderColor: "#EDE6DA",
          }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle
                className="text-xl font-semibold"
                style={{ color: "#2E2C28", fontFamily: "Poppins, sans-serif" }}
              >
                {editingIndex !== null ? "Edit Belief Pair" : "Add New Belief Pair"}
              </DialogTitle>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover-elevate active-elevate-2"
                data-testid="button-close-modal"
              >
                <X className="w-5 h-5" style={{ color: "#726C63" }} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Limiting Belief Input */}
            <div className="space-y-2">
              <Label
                htmlFor="modal-limiting"
                className="text-xs uppercase font-medium"
                style={{ color: "#726C63" }}
              >
                Limiting Belief
              </Label>
              <Input
                id="modal-limiting"
                value={formData.limiting}
                onChange={(e) => setFormData({ ...formData, limiting: e.target.value })}
                placeholder="e.g., I never have enough money"
                className="border"
                style={{
                  borderColor: "#EDE6DA",
                  backgroundColor: "#FFFFFF",
                }}
                data-testid="input-modal-limiting"
              />
            </div>

            {/* Uplifting Belief Input */}
            <div className="space-y-2">
              <Label
                htmlFor="modal-uplifting"
                className="text-xs uppercase font-medium"
                style={{ color: "#726C63" }}
              >
                Uplifting Belief
              </Label>
              <Input
                id="modal-uplifting"
                value={formData.uplifting}
                onChange={(e) => setFormData({ ...formData, uplifting: e.target.value })}
                placeholder="e.g., Abundance flows to me effortlessly"
                className="border"
                style={{
                  borderColor: "#EDE6DA",
                  backgroundColor: "#FFFFFF",
                }}
                data-testid="input-modal-uplifting"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveModal}
              className="w-full font-semibold"
              style={{
                background: "linear-gradient(90deg, #FFD580, #F8A14D)",
                color: "#2E2C28",
                fontFamily: "Poppins, sans-serif",
              }}
              data-testid="button-save-modal"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
