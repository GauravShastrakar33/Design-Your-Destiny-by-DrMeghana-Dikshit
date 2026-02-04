import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Clock,
  Video,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { CommunitySession } from "@shared/schema";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormInput } from "@/components/ui/form-input";

// Form Schema
const sessionSchema = yup.object().shape({
  title: yup
    .string()
    .required("Session title is required")
    .min(3, "Title must be at least 3 characters"),
  time: yup
    .string()
    .required("Time is required")
    .matches(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Time must be in HH:MM format (24h)"
    ),
  displayTime: yup
    .string()
    .required("Display time is required")
    .min(4, "Display time is too short"),
  meetingLink: yup
    .string()
    .required("Meeting link is required")
    .url("Must be a valid URL"),
  isActive: yup.boolean().default(true),
});

type SessionFormData = yup.InferType<typeof sessionSchema>;

export default function AdminSessionsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<CommunitySession | null>(null);

  // react-hook-form for Create
  const createForm = useForm<SessionFormData>({
    resolver: yupResolver(sessionSchema),
    defaultValues: {
      title: "",
      time: "",
      displayTime: "",
      meetingLink: "",
      isActive: true,
    },
  });

  // react-hook-form for Edit
  const editForm = useForm<SessionFormData>({
    resolver: yupResolver(sessionSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: sessions = [], isLoading } = useQuery<CommunitySession[]>({
    queryKey: ["/api/admin/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sessions", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Success", description: "Session created successfully" });
      setCreateDialogOpen(false);
      createForm.reset({
        title: "",
        time: "",
        displayTime: "",
        meetingLink: "",
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create session",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SessionFormData }) => {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Success", description: "Session updated successfully" });
      setEditDialogOpen(false);
      setSelectedSession(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update session",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Success", description: "Session deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedSession(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Success", description: "Session status updated" });
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
    createForm.reset({
      title: "",
      time: "",
      displayTime: "",
      meetingLink: "",
      isActive: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (session: CommunitySession) => {
    setSelectedSession(session);
    editForm.reset({
      title: session.title,
      time: session.time,
      displayTime: session.displayTime,
      meetingLink: session.meetingLink,
      isActive: session.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (session: CommunitySession) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  };

  const handleToggle = (session: CommunitySession) => {
    toggleMutation.mutate({ id: session.id, isActive: !session.isActive });
  };

  const onSubmitCreate = (data: SessionFormData) => {
    createMutation.mutate(data);
  };

  const onSubmitUpdate = (data: SessionFormData) => {
    if (!selectedSession) return;
    updateMutation.mutate({ id: selectedSession.id, data });
  };

  const confirmDelete = () => {
    if (selectedSession) {
      deleteMutation.mutate(selectedSession.id);
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
                Community Practices
              </h1>
            </div>
            <p className="text-sm font-semibold text-gray-600">
              Manage practice sessions, meeting links, and schedules for the
              community.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-brand hover:bg-brand/90 font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2 w-fit"
            data-testid="button-add-session"
          >
            <Plus className="w-4 h-4" />
            Add New Session
          </Button>
        </header>

        <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
          <div className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-left border-collapse"
                data-testid="table-sessions"
              >
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-[40%]">
                      Title
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-[20%]">
                      Time
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-[20%]">
                      Meeting Link
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-[10%] text-center">
                      Status
                    </th>
                    <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <Calendar className="w-10 h-10 mb-4 text-gray-600" />
                          <p className="text-sm font-bold text-gray-600">
                            No sessions available
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Click "Add New Session" to create your first
                            practice session.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr
                        key={session.id}
                        className="group transition-colors hover:bg-gray-50/50"
                        data-testid={`row-session-${session.id}`}
                      >
                        <td
                          className="py-4 px-6 text-sm font-semibold text-gray-900"
                          data-testid={`text-session-title-${session.id}`}
                        >
                          {session.title}
                        </td>
                        <td
                          className="py-4 px-6 text-xs font-semibold text-gray-600 tracking-wide"
                          data-testid={`text-session-time-${session.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {session.displayTime}
                          </div>
                        </td>
                        <td
                          className="py-4 px-6 text-xs font-medium text-gray-600"
                          data-testid={`text-session-link-${session.id}`}
                        >
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-brand hover:text-brand/80 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Meeting
                          </a>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggle(session)}
                            className="bg-transparent border-none p-0 cursor-pointer outline-none transition-transform"
                            data-testid={`button-toggle-session-${session.id}`}
                          >
                            {session.isActive ? (
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
                              onClick={() => handleEdit(session)}
                              className="w-8 h-8 text-brand hover:text-brand"
                              data-testid={`button-edit-${session.id}`}
                            >
                              <Edit className="w-[18px] h-[18px]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(session)}
                              className="w-8 h-8 text-red-500 hover:text-red-500 hover:bg-red-50"
                              data-testid={`button-delete-${session.id}`}
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
            <DialogTitle>Add New Session</DialogTitle>
            <DialogDescription>
              Create a new community practice session with meeting details.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)}>
              <div className="space-y-4 py-4">
                <FormInput
                  name="title"
                  label="Session Title"
                  placeholder="e.g., Morning Meditation"
                  data-testid="input-session-title"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    name="time"
                    label="Time (24h)"
                    placeholder="07:00"
                    data-testid="input-session-time"
                  />
                  <FormInput
                    name="displayTime"
                    label="Display Time"
                    placeholder="7:00 AM"
                    data-testid="input-session-display-time"
                  />
                </div>
                <FormInput
                  name="meetingLink"
                  label="Meeting Link"
                  placeholder="https://zoom.us/..."
                  data-testid="input-session-link"
                />
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={createForm.watch("isActive")}
                    onCheckedChange={(checked) =>
                      createForm.setValue("isActive", checked)
                    }
                    data-testid="switch-session-active"
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
                  data-testid="button-submit-session"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Add Session
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
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update the details of this community practice session.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitUpdate)}>
              <div className="space-y-4 py-4">
                <FormInput
                  name="title"
                  label="Session Title"
                  placeholder="e.g., Morning Meditation"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    name="time"
                    label="Time (24h)"
                    placeholder="07:00"
                  />
                  <FormInput
                    name="displayTime"
                    label="Display Time"
                    placeholder="7:00 AM"
                  />
                </div>
                <FormInput
                  name="meetingLink"
                  label="Meeting Link"
                  placeholder="https://zoom.us/..."
                />
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={editForm.watch("isActive")}
                    onCheckedChange={(checked) =>
                      editForm.setValue("isActive", checked)
                    }
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
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This session will be permanently removed and users will no longer
              be able to access it. This action cannot be undone.
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
