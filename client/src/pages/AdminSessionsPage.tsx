import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { CommunitySession } from "@shared/schema";

export default function AdminSessionsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CommunitySession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    displayTime: "",
    meetingLink: "",
    participants: 0,
    isActive: true,
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("@app:admin_auth");
    if (!isAuth) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminPassword = localStorage.getItem("@app:admin_auth") || "";

  const { data: sessions = [], isLoading } = useQuery<CommunitySession[]>({
    queryKey: ["/api/admin/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sessions", {
        headers: {
          "Authorization": `Bearer ${adminPassword}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Session created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create session", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Session updated successfully" });
      setEditingSession(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update session", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminPassword}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      toast({ title: "Session deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete session", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      time: "",
      displayTime: "",
      meetingLink: "",
      participants: 0,
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (session: CommunitySession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      time: session.time,
      displayTime: session.displayTime,
      meetingLink: session.meetingLink,
      participants: session.participants,
      isActive: session.isActive,
    });
  };

  const handleAddNew = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Practices</h1>
            <p className="text-gray-600 mt-2">Manage practice sessions and meeting links</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNew}
                style={{ backgroundColor: "#703DFA" }}
                data-testid="button-add-session"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Session
              </Button>
            </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Session</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Session Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Morning Meditation"
                        required
                        data-testid="input-session-title"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Time (24h)</Label>
                        <Input
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          placeholder="07:00"
                          required
                          data-testid="input-session-time"
                        />
                      </div>
                      <div>
                        <Label>Display Time</Label>
                        <Input
                          value={formData.displayTime}
                          onChange={(e) => setFormData({ ...formData, displayTime: e.target.value })}
                          placeholder="7:00 AM"
                          required
                          data-testid="input-session-display-time"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Meeting Link</Label>
                      <Input
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        placeholder="https://zoom.us/..."
                        required
                        data-testid="input-session-link"
                      />
                    </div>
                    <div>
                      <Label>Participants</Label>
                      <Input
                        type="number"
                        value={formData.participants}
                        onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        data-testid="input-session-participants"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active</Label>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        data-testid="switch-session-active"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        style={{ backgroundColor: "#703DFA" }}
                        disabled={createMutation.isPending}
                        data-testid="button-submit-session"
                      >
                        {createMutation.isPending ? "Creating..." : "Create Session"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
        </div>
      </div>

      {/* Sessions Table */}
      <Card className="bg-white border border-gray-200 p-6">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sessions yet. Click "Add Session" to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Title</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Time</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Participants</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Meeting Link</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-gray-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100" data-testid={`row-session-${session.id}`}>
                      <td className="py-3 px-4 text-gray-900">{session.title}</td>
                      <td className="py-3 px-4 text-gray-600">{session.displayTime}</td>
                      <td className="py-3 px-4 text-gray-600">{session.participants}</td>
                      <td className="py-3 px-4">
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline text-sm truncate block max-w-xs"
                        >
                          {session.meetingLink}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          session.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {session.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Dialog
                            open={editingSession?.id === session.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingSession(null);
                                resetForm();
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(session)}
                                data-testid={`button-edit-${session.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Session</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                  <Label>Session Title</Label>
                                  <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Time (24h)</Label>
                                    <Input
                                      value={formData.time}
                                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label>Display Time</Label>
                                    <Input
                                      value={formData.displayTime}
                                      onChange={(e) => setFormData({ ...formData, displayTime: e.target.value })}
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Meeting Link</Label>
                                  <Input
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Participants</Label>
                                  <Input
                                    type="number"
                                    value={formData.participants}
                                    onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label>Active</Label>
                                  <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingSession(null);
                                      resetForm();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    style={{ backgroundColor: "#703DFA" }}
                                    disabled={updateMutation.isPending}
                                  >
                                    {updateMutation.isPending ? "Updating..." : "Update Session"}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this session?")) {
                                deleteMutation.mutate(session.id);
                              }
                            }}
                            data-testid={`button-delete-${session.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}
