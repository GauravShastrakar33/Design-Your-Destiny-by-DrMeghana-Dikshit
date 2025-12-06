import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Program } from "@shared/schema";

export default function AdminProgramsPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "" });

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { code: string; name: string }) => {
      await apiRequest("POST", "/api/admin/v1/programs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/programs"] });
      toast({ title: "Program created successfully" });
      setCreateDialogOpen(false);
      setFormData({ code: "", name: "" });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create program";
      toast({ title: message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { code: string; name: string } }) => {
      await apiRequest("PUT", `/api/admin/v1/programs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/programs"] });
      toast({ title: "Program updated successfully" });
      setEditDialogOpen(false);
      setSelectedProgram(null);
      setFormData({ code: "", name: "" });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update program";
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/v1/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/programs"] });
      toast({ title: "Program deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedProgram(null);
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to delete program";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setFormData({ code: "", name: "" });
    setCreateDialogOpen(true);
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormData({ code: program.code, name: program.name });
    setEditDialogOpen(true);
  };

  const handleDelete = (program: Program) => {
    setSelectedProgram(program);
    setDeleteDialogOpen(true);
  };

  const submitCreate = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast({ title: "Code and name are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const submitUpdate = () => {
    if (!selectedProgram || !formData.code.trim() || !formData.name.trim()) {
      toast({ title: "Code and name are required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: selectedProgram.id, data: formData });
  };

  const confirmDelete = () => {
    if (selectedProgram) {
      deleteMutation.mutate(selectedProgram.id);
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
    <div className="flex-1 p-6 bg-gray-50" data-testid="admin-programs-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Programs</h1>
          <p className="text-gray-500 text-sm mt-1">Manage program codes for courses</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-brand hover:bg-brand/90"
          data-testid="button-create-program"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      <Card className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-programs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No programs found</p>
                    <p className="text-sm">Create your first program to get started</p>
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program.id} className="border-b hover:bg-gray-50" data-testid={`row-program-${program.id}`}>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`text-program-code-${program.id}`}>
                        {program.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900" data-testid={`text-program-name-${program.id}`}>
                      {program.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(program)}
                        data-testid={`button-edit-program-${program.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(program)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-program-${program.id}`}
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
            <DialogTitle>Create Program</DialogTitle>
            <DialogDescription>
              Add a new program that can be assigned to courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-code">Program Code</Label>
              <Input
                id="create-code"
                placeholder="e.g., MMB, USP, ENG"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                data-testid="input-program-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Program Name</Label>
              <Input
                id="create-name"
                placeholder="e.g., Mind Mastery Bootcamp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-program-name"
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
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>
              Update the program details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Program Code</Label>
              <Input
                id="edit-code"
                placeholder="e.g., MMB, USP, ENG"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                data-testid="input-edit-program-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Program Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Mind Mastery Bootcamp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-program-name"
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
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProgram?.name}"? This action cannot be undone.
              Programs linked to courses cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
