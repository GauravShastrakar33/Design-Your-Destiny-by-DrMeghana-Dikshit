import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Zap,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
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
  const [editingBelief, setEditingBelief] = useState<RewiringBelief | null>(
    null
  );
  const [formData, setFormData] = useState({ limiting: "", uplifting: "" });

  const { data: beliefs = [], isLoading } = useQuery<RewiringBelief[]>({
    queryKey: ["/api/v1/rewiring-beliefs"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      limitingBelief: string;
      upliftingBelief: string;
    }) => {
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { limitingBelief: string; upliftingBelief: string };
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/v1/rewiring-beliefs/${id}`,
        data
      );
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
    setFormData({
      limiting: belief.limitingBelief,
      uplifting: belief.upliftingBelief,
    });
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        <Header
          title="Rewiring Beliefs"
          hasBackButton={true}
          onBack={() => setLocation("/money-mastery")}
        />

        {/* Motivational Card */}
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 font-['Poppins'] mb-2">
                Let's rewire that mindset,{" "}
                <span className="text-[#703DFA]">Champion!</span>
              </h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-gray-500">
                  Left tap fear, right tap faith
                </p>
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4 text-[#703DFA]" />
                  <Zap className="w-4 h-4 text-[#703DFA]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Belief Cards */}
        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#703DFA]" />
            </div>
          ) : beliefs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-1">No beliefs yet</p>
              <p className="text-sm text-gray-400">
                Tap the + button below to add your first belief pair
              </p>
            </div>
          ) : (
            beliefs.map((belief) => (
              <Card
                key={belief.id}
                className="bg-white rounded-2xl shadow-md p-5 border-0"
                data-testid={`belief-card-${belief.id}`}
              >
                {/* Limiting Belief Section */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                      Limiting Belief
                    </h3>
                  </div>
                  <p
                    className="text-base font-medium text-gray-800 leading-relaxed pl-4"
                    data-testid={`belief-limiting-text-${belief.id}`}
                  >
                    {belief.limitingBelief}
                  </p>
                </div>

                {/* Rewired Belief Section */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                      Rewired Belief
                    </h3>
                  </div>
                  <p
                    className="text-base font-medium text-gray-800 leading-relaxed pl-4"
                    data-testid={`belief-uplifting-text-${belief.id}`}
                  >
                    {belief.upliftingBelief}
                  </p>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    onClick={() => handleOpenEditModal(belief)}
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-gray-500 hover:text-[#703DFA]"
                    disabled={deleteMutation.isPending}
                    data-testid={`button-edit-${belief.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteBelief(belief)}
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-gray-500 hover:text-red-500"
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

          {/* Add Button */}
          {!isLoading && beliefs.length < 5 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleOpenAddModal}
                className="rounded-full p-4 hover-elevate active-elevate-2 bg-[#703DFA] shadow-lg"
                data-testid="button-add-belief"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          )}

          {/* Max beliefs message */}
          {!isLoading && beliefs.length >= 5 && (
            <p className="text-center text-sm text-gray-400 italic pt-2">
              Max 5 beliefs reached
            </p>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 font-['Poppins']">
              {editingBelief ? "Edit Belief Pair" : "Add New Belief Pair"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Limiting Belief Input */}
            <div className="space-y-2">
              <Label
                htmlFor="modal-limiting"
                className="text-xs uppercase font-bold text-gray-500 tracking-wider"
              >
                Limiting Belief
              </Label>
              <Input
                id="modal-limiting"
                value={formData.limiting}
                onChange={(e) =>
                  setFormData({ ...formData, limiting: e.target.value })
                }
                placeholder="e.g., I never have enough money"
                className="border-gray-200"
                data-testid="input-modal-limiting"
              />
            </div>

            {/* Uplifting Belief Input */}
            <div className="space-y-2">
              <Label
                htmlFor="modal-uplifting"
                className="text-xs uppercase font-bold text-gray-500 tracking-wider"
              >
                Rewired Belief
              </Label>
              <Input
                id="modal-uplifting"
                value={formData.uplifting}
                onChange={(e) =>
                  setFormData({ ...formData, uplifting: e.target.value })
                }
                placeholder="e.g., Abundance flows to me effortlessly"
                className="border-gray-200"
                data-testid="input-modal-uplifting"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveModal}
              className="w-full font-semibold bg-[#703DFA] hover:bg-[#5c2fd9] text-white"
              disabled={isPending}
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
