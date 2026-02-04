import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Hash,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { FormInput } from "@/components/ui/form-input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Program } from "@shared/schema";
import { cn } from "@/lib/utils";

const programSchema = yup.object().shape({
  code: yup
    .string()
    .required("Program code is required")
    .max(10, "Code must be at most 10 characters"),
  name: yup
    .string()
    .required("Program name is required")
    .max(150, "Name must be at most 150 characters"),
  level: yup
    .number()
    .typeError("Level must be a number")
    .required("Level is required")
    .min(0, "Level cannot be negative"),
});

type ProgramFormData = yup.InferType<typeof programSchema>;

export default function AdminProgramsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const methods = useForm<ProgramFormData>({
    resolver: yupResolver(programSchema),
    defaultValues: {
      code: "",
      name: "",
      level: 0,
    },
  });

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  // Level is currently inferred from the order or handled by backend
  // For display, we sort by level
  const sortedPrograms = [...programs].sort((a, b) => b.level - a.level);

  const createMutation = useMutation({
    mutationFn: async (data: ProgramFormData) => {
      const res = await apiRequest("POST", "/api/admin/v1/programs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/programs"] });
      toast({ title: "Success", description: "Program created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProgramFormData }) => {
      const res = await apiRequest("PUT", `/api/admin/v1/programs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/programs"] });
      toast({ title: "Success", description: "Program updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/v1/programs/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/programs"] });
      toast({ title: "Success", description: "Program deleted successfully" });
      setProgramToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete program",
        variant: "destructive",
      });
    },
  });

  const handleOpenEditDialog = (program: Program) => {
    setEditingProgram(program);
    methods.reset({
      code: program.code,
      name: program.name,
      level: program.level,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProgram(null);
    methods.reset();
  };

  const onSubmit = (data: ProgramFormData) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      createMutation.mutate(data);
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
    <div
      className="min-h-screen bg-[#f8f9fa] p-8"
      data-testid="admin-programs-page"
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 tracking-tight"
              data-testid="text-page-title"
            >
              Programs
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Manage the hierarchy of coaching programs and access levels.
            </p>
          </div>
        </header>

        <div className="grid gap-6 mb-8">
          <div className="flex items-start gap-3 p-4 bg-brand/5 border border-brand/10 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <Info className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                Hierarchy Access Logic
              </p>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                Higher-level programs automatically include access to all
                lower-level programs. Program level is determined by system
                configuration.
              </p>
            </div>
          </div>
        </div>

        <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
          <div className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse"
                data-testid="table-programs"
              >
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600">
                      Level
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600">
                      Program Code
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600">
                      Program Name
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 text-center">
                      Status
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <BookOpen className="w-12 h-12 mb-4 text-gray-400" />
                          <p className="text-sm font-bold text-gray-600">
                            No programs found
                          </p>
                          <p className="text-xs text-gray-500 mt-1 italic">
                            Click "Add Program" to create your first coaching
                            program.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedPrograms.map((program) => (
                      <tr
                        key={program.id}
                        className="group transition-colors hover:bg-gray-50/50"
                        data-testid={`row-program-${program.id}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                              <span className="text-xs font-black text-brand">
                                {program.level}
                              </span>
                            </div>
                            <ShieldCheck className="w-4 h-4 text-brand/40" />
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
                              {program.code}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-gray-900">
                            {program.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 font-bold uppercase text-[10px] tracking-widest px-2 py-0.5"
                          >
                            Active
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleOpenEditDialog(program)}
                                className="gap-2 font-semibold text-gray-700 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setProgramToDelete(program)}
                                className="gap-2 font-semibold text-red-600 focus:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Edit Program
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-500 mt-1">
              Update the details of the coaching program.
            </DialogDescription>
          </DialogHeader>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="px-8 pb-8 space-y-5"
            >
              <FormInput
                name="name"
                label="Program Name"
                placeholder="e.g., Abundance Mastery"
                required
              />
              <FormInput
                name="code"
                label="Program Code"
                placeholder="e.g., AM (Must be unique)"
                required
              />
              <FormInput
                name="level"
                label="Program Level"
                type="number"
                placeholder="e.g., 1, 2, 3..."
                required
              />

              <DialogFooter className="pt-4 sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="bg-brand hover:bg-brand/90"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Update Program
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!programToDelete}
        onOpenChange={(open) => !open && setProgramToDelete(null)}
      >
        <AlertDialogContent className="border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-xl font-bold">
                Are you absolutely sure?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600 font-medium">
              This action cannot be undone. This will permanently delete the
              program
              <span className="font-bold text-gray-900 mx-1">
                "{programToDelete?.name}"
              </span>
              and its association with courses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="font-bold text-gray-400">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                programToDelete && deleteMutation.mutate(programToDelete.id)
              }
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete Program"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
