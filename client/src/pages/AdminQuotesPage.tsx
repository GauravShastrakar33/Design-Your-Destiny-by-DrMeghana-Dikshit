import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Quote,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Sparkles,
  Filter,
  Settings2,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DailyQuote } from "@shared/schema";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";

// Form Schema
const quoteSchema = yup.object().shape({
  quoteText: yup
    .string()
    .required("Quote text is required")
    .min(5, "Quote is too short"),
  author: yup.string().nullable().optional(),
  displayOrder: yup
    .number()
    .required("Display order is required")
    .positive("Order must be positive")
    .integer("Order must be an integer"),
});

type QuoteFormData = yup.InferType<typeof quoteSchema>;

export default function AdminQuotesPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<DailyQuote | null>(null);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: quotes = [], isLoading } = useQuery<DailyQuote[]>({
    queryKey: ["/api/admin/quotes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/quotes", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch quotes");
      return response.json();
    },
  });

  // react-hook-form for Create
  const createForm = useForm<QuoteFormData>({
    resolver: yupResolver(quoteSchema),
    defaultValues: { quoteText: "", author: "", displayOrder: 1 },
  });

  // react-hook-form for Edit
  const editForm = useForm<QuoteFormData>({
    resolver: yupResolver(quoteSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      await apiRequest("POST", "/api/admin/quotes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Success", description: "Quote created successfully" });
      setCreateDialogOpen(false);
      createForm.reset({
        quoteText: "",
        author: "",
        displayOrder: quotes.length + 1,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create quote",
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
      data: Partial<DailyQuote>;
    }) => {
      await apiRequest("PUT", `/api/admin/quotes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Success", description: "Quote updated successfully" });
      setEditDialogOpen(false);
      setSelectedQuote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update quote",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Success",
        description: "Quote deactivated successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to deactivate quote",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/quotes/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Success", description: "Quote status updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    const maxOrder =
      quotes.length > 0
        ? Math.max(...quotes.map((q) => q.displayOrder)) + 1
        : 1;
    createForm.reset({ quoteText: "", author: "", displayOrder: maxOrder });
    setCreateDialogOpen(true);
  };

  const handleEdit = (quote: DailyQuote) => {
    setSelectedQuote(quote);
    editForm.reset({
      quoteText: quote.quoteText,
      author: quote.author || "",
      displayOrder: quote.displayOrder,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (quote: DailyQuote) => {
    setSelectedQuote(quote);
    setDeleteDialogOpen(true);
  };

  const handleToggle = (quote: DailyQuote) => {
    toggleMutation.mutate({ id: quote.id, isActive: !quote.isActive });
  };

  const validateOrderUniqueness = (order: number, excludeId?: number) => {
    const exists = quotes.find(
      (q) => q.displayOrder === order && q.id !== excludeId
    );
    if (exists) {
      toast({
        title: "Validation Error",
        description: `Display Order ${order} is already used by another quote.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const onSubmitCreate = (data: QuoteFormData) => {
    if (!validateOrderUniqueness(data.displayOrder)) return;
    createMutation.mutate(data);
  };

  const onSubmitUpdate = (data: QuoteFormData) => {
    if (!selectedQuote) return;
    if (!validateOrderUniqueness(data.displayOrder, selectedQuote.id)) return;
    updateMutation.mutate({
      id: selectedQuote.id,
      data: {
        quoteText: data.quoteText.trim(),
        author: data.author?.trim() || null,
        displayOrder: data.displayOrder,
      },
    });
  };

  const confirmDelete = () => {
    if (selectedQuote) {
      deleteMutation.mutate(selectedQuote.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-xl font-bold text-gray-900 leading-none"
                data-testid="text-page-title"
              >
                Daily Quotes
              </h1>
            </div>
            <p className="text-sm font-semibold text-gray-600">
              Manage inspirational quotes displayed to users at the start of
              their day.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-brand hover:bg-brand/90 font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2 w-fit"
            data-testid="button-create-quote"
          >
            <Plus className="w-4 h-4" />
            Add New Quote
          </Button>
        </header>

        <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
          <div className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse"
                data-testid="table-quotes"
              >
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-24">
                      Order
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600">
                      Quote
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-48">
                      Author
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-32">
                      Shown
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-24 text-center">
                      Status
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-24 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <Quote className="w-10 h-10 mb-4 text-gray-600" />
                          <p className="text-sm font-bold text-gray-600">
                            No quotes available
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Click "Add New Quote" to create your first
                            inspirational message.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    quotes.map((quote) => (
                      <tr
                        key={quote.id}
                        className={cn(
                          "group transition-colors hover:bg-gray-50/50",
                          !quote.isActive && "opacity-60 grayscale-[0.5]"
                        )}
                        data-testid={`row-quote-${quote.id}`}
                      >
                        <td className="py-4 px-6">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span
                              className="text-xs font-black text-gray-900"
                              data-testid={`text-quote-order-${quote.id}`}
                            >
                              {quote.displayOrder.toString().padStart(2, "0")}
                            </span>
                          </div>
                        </td>
                        <td
                          className="py-4 px-6 text-sm font-medium text-gray-700 leading-relaxed italic"
                          data-testid={`text-quote-text-${quote.id}`}
                        >
                          <div className="max-w-2xl line-clamp-2">
                            "{quote.quoteText}"
                          </div>
                        </td>
                        <td
                          className="py-4 px-6 text-xs font-semibold text-gray-600 tracking-wide"
                          data-testid={`text-quote-author-${quote.id}`}
                        >
                          {quote.author || "-"}
                        </td>
                        <td
                          className="py-4 px-6 text-xs font-semibold text-gray-600 tracking-wide"
                          data-testid={`text-quote-lastshown-${quote.id}`}
                        >
                          {quote.lastShownDate || "-"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggle(quote)}
                            className="bg-transparent border-none p-0 cursor-pointer outline-none transition-transform"
                            data-testid={`button-toggle-quote-${quote.id}`}
                          >
                            {quote.isActive ? (
                              <ToggleRight className="w-6 h-6 text-green-500 drop-shadow-sm" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(quote)}
                              className="w-8 h-8 text-brand hover:text-brand"
                              data-testid={`button-edit-quote-${quote.id}`}
                            >
                              <Edit className="w-[18px] h-[18px]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(quote)}
                              className="w-8 h-8 text-red-500 hover:text-red-500 hover:bg-red-50"
                              data-testid={`button-delete-quote-${quote.id}`}
                            >
                              <Trash2 className="w-[18px] h-[18px]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Quote</DialogTitle>
            <DialogDescription>
              Create a new inspirational quote for users.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)}>
              <div className="space-y-4 py-4">
                <FormTextarea
                  name="quoteText"
                  label="Quote Text"
                  placeholder="Enter the quote..."
                  className="min-h-[100px]"
                  data-testid="input-quote-text"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    name="author"
                    label="Author (Optional)"
                    placeholder="e.g. Rumi"
                    data-testid="input-quote-author"
                  />
                  <FormInput
                    name="displayOrder"
                    label="Display Order"
                    type="number"
                    data-testid="input-quote-order"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-brand hover:bg-brand/90"
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Add Quote
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
            <DialogDescription>
              Update the details of this inspirational quote.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitUpdate)}>
              <div className="space-y-4 py-4">
                <FormTextarea
                  name="quoteText"
                  label="Quote Text"
                  placeholder="Enter the quote..."
                  className="min-h-[100px]"
                  data-testid="input-edit-quote-text"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    name="author"
                    label="Author (Optional)"
                    placeholder="e.g. Rumi"
                    data-testid="input-edit-quote-author"
                  />
                  <FormInput
                    name="displayOrder"
                    label="Display Order"
                    type="number"
                    data-testid="input-edit-quote-order"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-brand hover:bg-brand/90"
                  data-testid="button-submit-update"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This inspiration will no longer be visible to users. You can
              re-enable it anytime from the status toggle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Processing..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
