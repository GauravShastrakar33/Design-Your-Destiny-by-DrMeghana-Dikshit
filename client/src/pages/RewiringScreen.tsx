import { useState } from "react";
import { ArrowLeft, Brain, Zap, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RewiringBelief } from "@shared/schema";

export default function RewiringScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingBelief, setEditingBelief] = useState<RewiringBelief | null>(null);
  const [formData, setFormData] = useState({ limiting: "", uplifting: "" });

  const { data: beliefs = [], isLoading } = useQuery<RewiringBelief[]>({
    queryKey: ["/api/v1/rewiring-beliefs"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { limitingBelief: string; upliftingBelief: string }) => {
      const res = await apiRequest("POST", "/api/v1/rewiring-beliefs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/rewiring-beliefs"] });
      setShowModal(false);
      setFormData({ limiting: "", uplifting: "" });
      toast({
        title: "Beautiful progress, Champion!",
        description: "Your belief is saved.",
        className: "bg-[#FCE2B7] text-[#2E2C28] border-[#F4B860]",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save belief. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { limitingBelief: string; upliftingBelief: string } }) => {
      const res = await apiRequest("PUT", `/api/v1/rewiring-beliefs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/rewiring-beliefs"] });
      setShowModal(false);
      setEditingBelief(null);
      setFormData({ limiting: "", uplifting: "" });
      toast({
        title: "Beautiful progress, Champion!",
        description: "Your belief is updated.",
        className: "bg-[#FCE2B7] text-[#2E2C28] border-[#F4B860]",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update belief. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/v1/rewiring-beliefs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/rewiring-beliefs"] });
      toast({
        title: "Belief removed",
        description: "Your belief has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete belief. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenAddModal = () => {
    setEditingBelief(null);
    setFormData({ limiting: "", uplifting: "" });
    setShowModal(true);
  };

  const handleOpenEditModal = (belief: RewiringBelief) => {
    setEditingBelief(belief);
    setFormData({ limiting: belief.limitingBelief, uplifting: belief.upliftingBelief });
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

    if (editingBelief) {
      updateMutation.mutate({
        id: editingBelief.id,
        data: {
          limitingBelief: formData.limiting.trim(),
          upliftingBelief: formData.uplifting.trim(),
        },
      });
    } else {
      if (beliefs.length >= 5) {
        toast({
          title: "Maximum beliefs reached",
          description: "You can have up to 5 belief pairs.",
          variant: "destructive",
        });
        return;
      }
      createMutation.mutate({
        limitingBelief: formData.limiting.trim(),
        upliftingBelief: formData.uplifting.trim(),
      });
    }
  };

  const handleDeleteBelief = (belief: RewiringBelief) => {
    deleteMutation.mutate(belief.id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#F4B860" }} />
            </div>
          ) : beliefs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm mb-2" style={{ color: "#726C63" }}>
                No beliefs yet
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Tap the + button below to add your first belief pair
              </p>
            </div>
          ) : (
            beliefs.map((belief) => (
              <Card
                key={belief.id}
                className="p-5 relative"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EDE6DA",
                  borderRadius: "1rem",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
                data-testid={`belief-card-${belief.id}`}
              >
                {/* Limiting Belief Section */}
                <div className="mb-4">
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: "#EF4444" }}
                  >
                    Limiting Belief
                  </h3>
                  <p
                    className="text-xl font-medium leading-relaxed"
                    style={{ color: "#2E2C28", lineHeight: "1.6" }}
                    data-testid={`belief-limiting-text-${belief.id}`}
                  >
                    {belief.limitingBelief}
                  </p>
                </div>

                {/* Rewired Belief Section */}
                <div className="mb-4">
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: "#10B981" }}
                  >
                    Rewired Belief
                  </h3>
                  <p
                    className="text-xl font-medium leading-relaxed"
                    style={{ color: "#2E2C28", lineHeight: "1.6" }}
                    data-testid={`belief-uplifting-text-${belief.id}`}
                  >
                    {belief.upliftingBelief}
                  </p>
                </div>

                {/* Action Row: Edit and Delete on same line */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: "#F0F0F0" }}>
                  <Button
                    onClick={() => handleOpenEditModal(belief)}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={deleteMutation.isPending}
                    data-testid={`button-edit-${belief.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteBelief(belief)}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${belief.id}`}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}

          {/* Floating Add Button */}
          {!isLoading && beliefs.length < 5 && (
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
          {!isLoading && beliefs.length >= 5 && (
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
            <DialogTitle
              className="text-xl font-semibold"
              style={{ color: "#2E2C28", fontFamily: "Poppins, sans-serif" }}
            >
              {editingBelief ? "Edit Belief Pair" : "Add New Belief Pair"}
            </DialogTitle>
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
              disabled={isPending}
              style={{
                background: "linear-gradient(90deg, #FFD580, #F8A14D)",
                color: "#2E2C28",
                fontFamily: "Poppins, sans-serif",
              }}
              data-testid="button-save-modal"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
