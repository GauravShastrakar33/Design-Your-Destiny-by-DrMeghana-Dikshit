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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { RewiringBelief } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export default function RewiringScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingBelief, setEditingBelief] = useState<RewiringBelief | null>(
    null
  );
  const [formData, setFormData] = useState({ limiting: "", uplifting: "" });
  const [beliefToDelete, setBeliefToDelete] = useState<RewiringBelief | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        title: "Mindset Updated! 🧠",
        description: "Your new belief has been recorded.",
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
        title: "Progress Saved! ✨",
        description: "Your belief pair has been updated.",
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
        title: "Removed successfully",
        description: "The belief pair has been deleted.",
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
      setSaveError("Please fill in both fields to continue.");
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
        setSaveError("You've reached the maximum of 5 belief pairs.");
        return;
      }
      createMutation.mutate({
        limitingBelief: formData.limiting.trim(),
        upliftingBelief: formData.uplifting.trim(),
      });
    }
  };

  const handleDeleteBelief = (belief: RewiringBelief) => {
    setBeliefToDelete(belief);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (beliefToDelete) {
      deleteMutation.mutate(beliefToDelete.id);
      setIsDeleteDialogOpen(false);
      setBeliefToDelete(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header
        title="Rewiring Beliefs"
        hasBackButton={true}
        onBack={() => setLocation("/money-mastery")}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Motivational Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-transparent border-0 shadow-none overflow-hidden relative">
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1">
                <Brain className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                Mindset Rewiring
              </h2>
              <p className="text-gray-700 text-sm max-w-xs font-medium">
                Identify limiting thoughts and transform them into empowering
                truths.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Belief Cards List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : beliefs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-gray-200 p-5 text-center"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No Beliefs Yet
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                Ready to shift your perspective? Start by adding your first
                belief transformation.
              </p>
              <Button
                onClick={handleOpenAddModal}
                className="bg-brand text-white font-bold rounded-lg px-4"
              >
                Add Belief Pair
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {beliefs.map((belief, idx) => (
                <motion.div
                  key={belief.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-white rounded-2xl shadow-lg shadow-black/[0.03] border-0 overflow-hidden group">
                    <div className="p-4 space-y-6">
                      {/* Limiting Section */}
                      <div className="relative pl-6 border-l-2 border-red-100">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-red-400 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-red-400" />
                        </div>
                        <h3 className="text-xs font-black text-red-400 tracking-widest mb-2">
                          Limiting Belief
                        </h3>
                        <p className="text-base font-medium text-gray-500 leading-relaxed break-words whitespace-pre-wrap">
                          "{belief.limitingBelief}"
                        </p>
                      </div>

                      {/* Rewired Section */}
                      <div className="relative pl-6 border-l-2 border-emerald-100">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center">
                          <Zap className="w-2 h-2 text-emerald-500 fill-current" />
                        </div>
                        <h3 className="text-xs font-black text-emerald-500 tracking-widest mb-2">
                          Rewired Belief
                        </h3>
                        <p className="text-base font-medium text-gray-900 leading-relaxed break-words whitespace-pre-wrap">
                          "{belief.upliftingBelief}"
                        </p>
                      </div>
                    </div>

                    {/* Actions Row - Responsive stacking */}
                    <div className="p-4 sm:px-6 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-50">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleOpenEditModal(belief)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 sm:flex-none rounded-lg h-9 px-4 text-gray-600 hover:text-brand hover:bg-brand/5 font-bold text-xs border border-gray-200 sm:border-transparent transition-colors"
                          disabled={deleteMutation.isPending}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteBelief(belief)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 sm:flex-none rounded-lg h-9 px-4 text-gray-600 hover:text-red-500 hover:bg-red-50 font-bold text-xs border border-gray-200 sm:border-transparent transition-colors"
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Add New Button when list is not empty and not full */}
          {!isLoading && beliefs.length > 0 && beliefs.length < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-2"
            >
              <Button
                onClick={handleOpenAddModal}
                className="rounded-full bg-brand hover:bg-brand/90 text-white font-bold h-11 px-8 shadow-lg shadow-brand/20"
              >
                <Plus className="w-5 h-5 mr-1.5" />
                Add Belief Pair
              </Button>
            </motion.div>
          )}

          {/* Max beliefs message */}
          {!isLoading && beliefs.length >= 5 && (
            <p className="text-center text-xs font-bold text-gray-300 tracking-widest pt-4">
              All slots used (5/5)
            </p>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setSaveError(null);
        }}
      >
        <AnimatePresence>
          {showModal && (
            <DialogContent className="sm:max-w-md w-[92%] rounded-2xl p-6 border-0 shadow-2xl">
              <div className="relative mb-1">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {editingBelief ? "Edit Belief Pair" : "Add Belief Pair"}
                </DialogTitle>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  Transform your perspective for lasting abundance
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  {/* Limiting Belief Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 tracking-wide ml-1">
                      The Limiting Belief
                    </Label>
                    <Input
                      value={formData.limiting}
                      onChange={(e) => {
                        setFormData({ ...formData, limiting: e.target.value });
                        if (saveError) setSaveError(null);
                      }}
                      placeholder="e.g. I never have enough money"
                      className="rounded-lg text-sm bg-gray-50 border border-gray-300 text-gray-700 placeholder:text-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all shadow-inner outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-purple-400" />
                    <div className="w-8 h-8 rounded-full bg-brand/5 text-brand flex items-center justify-center shadow-inner shrink-0">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div className="flex-1 h-px bg-purple-400" />
                  </div>

                  {/* Uplifting Belief Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 tracking-wide ml-1">
                      The Rewired Belief
                    </Label>
                    <Input
                      value={formData.uplifting}
                      onChange={(e) => {
                        setFormData({ ...formData, uplifting: e.target.value });
                        if (saveError) setSaveError(null);
                      }}
                      placeholder="e.g. Abundance flows to me naturally"
                      className="rounded-lg text-sm bg-gray-50 border border-gray-300 text-gray-700 placeholder:text-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all shadow-inner outline-none"
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1 text-center">
                    {saveError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleSaveModal}
                    className="rounded-lg shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 border border-brand/20 font-bold"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    disabled={isPending}
                    className="rounded-lg text-gray-500 hover:bg-gray-50 border border-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md w-[92%] rounded-2xl p-6 border-0 shadow-2xl">
          <div className="space-y-4">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Remove Belief Pair?
              </DialogTitle>
              <p className="text-gray-500 font-medium text-sm mt-2">
                This will permanently delete this belief pair. You cannot undo
                this action.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-lg text-gray-500 hover:bg-gray-50 border border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 font-bold"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
