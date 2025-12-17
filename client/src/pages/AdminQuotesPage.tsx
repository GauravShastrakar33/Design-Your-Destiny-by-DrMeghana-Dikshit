import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Quote, ToggleLeft, ToggleRight } from "lucide-react";
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

export default function AdminQuotesPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<DailyQuote | null>(null);
  const [formData, setFormData] = useState({ quoteText: "", author: "", displayOrder: 1 });

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: quotes = [], isLoading } = useQuery<DailyQuote[]>({
    queryKey: ["/api/admin/quotes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/quotes", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch quotes");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { quoteText: string; author: string; displayOrder: number }) => {
      await apiRequest("POST", "/api/admin/quotes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Quote created successfully" });
      setCreateDialogOpen(false);
      setFormData({ quoteText: "", author: "", displayOrder: 1 });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create quote";
      toast({ title: message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DailyQuote> }) => {
      await apiRequest("PUT", `/api/admin/quotes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Quote updated successfully" });
      setEditDialogOpen(false);
      setSelectedQuote(null);
      setFormData({ quoteText: "", author: "", displayOrder: 1 });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update quote";
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Quote deactivated successfully" });
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to deactivate quote";
      toast({ title: message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/admin/quotes/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Quote status updated" });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update quote status";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    const maxOrder = quotes.length > 0 ? Math.max(...quotes.map(q => q.displayOrder)) + 1 : 1;
    setFormData({ quoteText: "", author: "", displayOrder: maxOrder });
    setCreateDialogOpen(true);
  };

  const handleEdit = (quote: DailyQuote) => {
    setSelectedQuote(quote);
    setFormData({ 
      quoteText: quote.quoteText, 
      author: quote.author || "", 
      displayOrder: quote.displayOrder 
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

  const submitCreate = () => {
    if (!formData.quoteText.trim()) {
      toast({ title: "Quote text is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      quoteText: formData.quoteText.trim(),
      author: formData.author.trim() || "",
      displayOrder: formData.displayOrder,
    });
  };

  const submitUpdate = () => {
    if (!selectedQuote || !formData.quoteText.trim()) {
      toast({ title: "Quote text is required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ 
      id: selectedQuote.id, 
      data: {
        quoteText: formData.quoteText.trim(),
        author: formData.author.trim() || null,
        displayOrder: formData.displayOrder,
      }
    });
  };

  const confirmDelete = () => {
    if (selectedQuote) {
      deleteMutation.mutate(selectedQuote.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50" data-testid="admin-quotes-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Daily Quotes</h1>
          <p className="text-gray-500 text-sm mt-1">Manage inspirational quotes shown to users daily</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-brand hover:bg-brand/90"
          data-testid="button-create-quote"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Quote
        </Button>
      </div>

      <Card className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-quotes">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-12">Order</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Quote</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-40">Author</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-32">Last Shown</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 w-20">Active</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Quote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No quotes found</p>
                    <p className="text-sm">Add your first quote to get started</p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr 
                    key={quote.id} 
                    className={`border-b hover:bg-gray-50 ${!quote.isActive ? 'opacity-50' : ''}`} 
                    data-testid={`row-quote-${quote.id}`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`text-quote-order-${quote.id}`}>
                        {quote.displayOrder}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900" data-testid={`text-quote-text-${quote.id}`}>
                      <p className="line-clamp-2 max-w-md">{quote.quoteText}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600" data-testid={`text-quote-author-${quote.id}`}>
                      {quote.author || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm" data-testid={`text-quote-lastshown-${quote.id}`}>
                      {quote.lastShownDate || "Never"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(quote)}
                        className="hover-elevate p-1 rounded"
                        data-testid={`button-toggle-quote-${quote.id}`}
                      >
                        {quote.isActive ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(quote)}
                        data-testid={`button-edit-quote-${quote.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quote)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-quote-${quote.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Quote</DialogTitle>
            <DialogDescription>
              Add an inspirational quote to show users daily.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quoteText">Quote Text *</Label>
              <Textarea
                id="quoteText"
                placeholder="Enter the quote..."
                value={formData.quoteText}
                onChange={(e) => setFormData({ ...formData, quoteText: e.target.value })}
                rows={4}
                data-testid="input-quote-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author (Optional)</Label>
              <Input
                id="author"
                placeholder="e.g., Tony Robbins"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                data-testid="input-quote-author"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min="1"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                data-testid="input-quote-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitCreate} 
              disabled={createMutation.isPending}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? "Creating..." : "Add Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
            <DialogDescription>
              Update the quote details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editQuoteText">Quote Text *</Label>
              <Textarea
                id="editQuoteText"
                placeholder="Enter the quote..."
                value={formData.quoteText}
                onChange={(e) => setFormData({ ...formData, quoteText: e.target.value })}
                rows={4}
                data-testid="input-edit-quote-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAuthor">Author (Optional)</Label>
              <Input
                id="editAuthor"
                placeholder="e.g., Tony Robbins"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                data-testid="input-edit-quote-author"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDisplayOrder">Display Order</Label>
              <Input
                id="editDisplayOrder"
                type="number"
                min="1"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                data-testid="input-edit-quote-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitUpdate} 
              disabled={updateMutation.isPending}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-submit-update"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the quote. It won't be shown to users anymore but can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
