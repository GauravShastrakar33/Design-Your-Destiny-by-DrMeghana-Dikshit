import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { ProcessFolder, ProcessSubfolder, Process, SpiritualBreath } from "@shared/schema";

export default function AdminProcessLibraryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("folders");
  
  // Folder state
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProcessFolder | null>(null);
  const [folderFormData, setFolderFormData] = useState({
    name: "",
    type: "",
    displayOrder: 0,
  });

  // Subfolder state
  const [isSubfolderDialogOpen, setIsSubfolderDialogOpen] = useState(false);
  const [editingSubfolder, setEditingSubfolder] = useState<ProcessSubfolder | null>(null);
  const [subfolderFormData, setSubfolderFormData] = useState<{
    name: string;
    folderId: number | undefined;
    displayOrder: number;
  }>({
    name: "",
    folderId: undefined,
    displayOrder: 0,
  });

  // Process state
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [processFormData, setProcessFormData] = useState<{
    title: string;
    description: string;
    folderId: number | undefined;
    subfolderId: number | null;
    videoUrl: string;
    audioUrl: string;
    scriptUrl: string;
    iconName: string;
    displayOrder: number;
  }>({
    title: "",
    description: "",
    folderId: undefined,
    subfolderId: null,
    videoUrl: "",
    audioUrl: "",
    scriptUrl: "",
    iconName: "Brain",
    displayOrder: 0,
  });
  const [processFiles, setProcessFiles] = useState<{
    video: File | null;
    audio: File | null;
    script: File | null;
  }>({
    video: null,
    audio: null,
    script: null,
  });

  // Spiritual Breath state
  const [isBreathDialogOpen, setIsBreathDialogOpen] = useState(false);
  const [editingBreath, setEditingBreath] = useState<SpiritualBreath | null>(null);
  const [breathFormData, setBreathFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    audioUrl: "",
    displayOrder: 0,
  });
  const [breathFiles, setBreathFiles] = useState<{
    video: File | null;
    audio: File | null;
  }>({
    video: null,
    audio: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  // Queries
  const { data: folders = [] } = useQuery<ProcessFolder[]>({
    queryKey: ["/api/admin/process-folders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/process-folders", {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch folders");
      return response.json();
    },
  });

  const { data: subfolders = [] } = useQuery<ProcessSubfolder[]>({
    queryKey: ["/api/admin/process-subfolders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/process-subfolders", {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch subfolders");
      return response.json();
    },
  });

  const { data: processes = [] } = useQuery<Process[]>({
    queryKey: ["/api/admin/processes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/processes", {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch processes");
      return response.json();
    },
  });

  const { data: breaths = [] } = useQuery<SpiritualBreath[]>({
    queryKey: ["/api/admin/spiritual-breaths"],
    queryFn: async () => {
      const response = await fetch("/api/admin/spiritual-breaths", {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch spiritual breaths");
      return response.json();
    },
  });

  // Helper function to upload file to S3
  const uploadFile = async (file: File, fileType: string, endpoint: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Authorization": `Bearer ${adminToken}` },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }
    
    const data = await response.json();
    return data.url;
  };

  // Process Folder Mutations
  const createFolderMutation = useMutation({
    mutationFn: async (data: typeof folderFormData) => {
      const response = await fetch("/api/admin/process-folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/process-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Folder created successfully" });
      setIsFolderDialogOpen(false);
      resetFolderForm();
    },
    onError: () => {
      toast({ title: "Failed to create folder", variant: "destructive" });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof folderFormData }) => {
      const response = await fetch(`/api/admin/process-folders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/process-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Folder updated successfully" });
      setIsFolderDialogOpen(false);
      resetFolderForm();
    },
    onError: () => {
      toast({ title: "Failed to update folder", variant: "destructive" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/process-folders/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete folder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/process-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Folder deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    },
  });

  // Process Subfolder Mutations
  const createSubfolderMutation = useMutation({
    mutationFn: async (data: typeof subfolderFormData) => {
      const response = await fetch("/api/admin/process-subfolders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create subfolder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/process-subfolders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Subfolder created successfully" });
      setIsSubfolderDialogOpen(false);
      resetSubfolderForm();
    },
    onError: () => {
      toast({ title: "Failed to create subfolder", variant: "destructive" });
    },
  });

  const updateSubfolderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof subfolderFormData }) => {
      const response = await fetch(`/api/admin/process-subfolders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update subfolder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/process-subfolders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Subfolder updated successfully" });
      setIsSubfolderDialogOpen(false);
      resetSubfolderForm();
    },
    onError: () => {
      toast({ title: "Failed to update subfolder", variant: "destructive" });
    },
  });

  const deleteSubfolderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/process-subfolders/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete subfolder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/process-subfolders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Subfolder deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete subfolder", variant: "destructive" });
    },
  });

  // Process Mutations
  const createProcessMutation = useMutation({
    mutationFn: async (data: typeof processFormData) => {
      let videoUrl = data.videoUrl;
      let audioUrl = data.audioUrl;
      let scriptUrl = data.scriptUrl;

      if (processFiles.video) {
        try {
          videoUrl = await uploadFile(processFiles.video, "video", "/api/admin/upload/process-media");
        } catch (error) {
          if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
            toast({ 
              title: "AWS S3 not configured", 
              description: "Please configure AWS credentials to upload files",
              variant: "destructive" 
            });
            throw error;
          }
          throw error;
        }
      }
      if (processFiles.audio) {
        audioUrl = await uploadFile(processFiles.audio, "audio", "/api/admin/upload/process-media");
      }
      if (processFiles.script) {
        scriptUrl = await uploadFile(processFiles.script, "script", "/api/admin/upload/process-media");
      }

      const response = await fetch("/api/admin/processes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ ...data, videoUrl, audioUrl, scriptUrl }),
      });
      if (!response.ok) throw new Error("Failed to create process");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Process created successfully" });
      setIsProcessDialogOpen(false);
      resetProcessForm();
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
        return;
      }
      toast({ title: "Failed to create process", variant: "destructive" });
    },
  });

  const updateProcessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof processFormData }) => {
      let videoUrl = data.videoUrl;
      let audioUrl = data.audioUrl;
      let scriptUrl = data.scriptUrl;

      if (processFiles.video) {
        try {
          videoUrl = await uploadFile(processFiles.video, "video", "/api/admin/upload/process-media");
        } catch (error) {
          if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
            toast({ 
              title: "AWS S3 not configured", 
              description: "Please configure AWS credentials to upload files",
              variant: "destructive" 
            });
            throw error;
          }
          throw error;
        }
      }
      if (processFiles.audio) {
        audioUrl = await uploadFile(processFiles.audio, "audio", "/api/admin/upload/process-media");
      }
      if (processFiles.script) {
        scriptUrl = await uploadFile(processFiles.script, "script", "/api/admin/upload/process-media");
      }

      const response = await fetch(`/api/admin/processes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ ...data, videoUrl, audioUrl, scriptUrl }),
      });
      if (!response.ok) throw new Error("Failed to update process");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Process updated successfully" });
      setIsProcessDialogOpen(false);
      resetProcessForm();
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
        return;
      }
      toast({ title: "Failed to update process", variant: "destructive" });
    },
  });

  const deleteProcessMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/processes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete process");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/process-library"] });
      toast({ title: "Process deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete process", variant: "destructive" });
    },
  });

  // Spiritual Breath Mutations
  const createBreathMutation = useMutation({
    mutationFn: async (data: typeof breathFormData) => {
      let videoUrl = data.videoUrl;
      let audioUrl = data.audioUrl;

      if (breathFiles.video) {
        try {
          videoUrl = await uploadFile(breathFiles.video, "video", "/api/admin/upload/spiritual-breath-media");
        } catch (error) {
          if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
            toast({ 
              title: "AWS S3 not configured", 
              description: "Please configure AWS credentials to upload files",
              variant: "destructive" 
            });
            throw error;
          }
          throw error;
        }
      }
      if (breathFiles.audio) {
        audioUrl = await uploadFile(breathFiles.audio, "audio", "/api/admin/upload/spiritual-breath-media");
      }

      const response = await fetch("/api/admin/spiritual-breaths", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ ...data, videoUrl, audioUrl }),
      });
      if (!response.ok) throw new Error("Failed to create spiritual breath");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spiritual-breaths"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual-breaths"] });
      toast({ title: "Spiritual breath created successfully" });
      setIsBreathDialogOpen(false);
      resetBreathForm();
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
        return;
      }
      toast({ title: "Failed to create spiritual breath", variant: "destructive" });
    },
  });

  const updateBreathMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof breathFormData }) => {
      let videoUrl = data.videoUrl;
      let audioUrl = data.audioUrl;

      if (breathFiles.video) {
        try {
          videoUrl = await uploadFile(breathFiles.video, "video", "/api/admin/upload/spiritual-breath-media");
        } catch (error) {
          if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
            toast({ 
              title: "AWS S3 not configured", 
              description: "Please configure AWS credentials to upload files",
              variant: "destructive" 
            });
            throw error;
          }
          throw error;
        }
      }
      if (breathFiles.audio) {
        audioUrl = await uploadFile(breathFiles.audio, "audio", "/api/admin/upload/spiritual-breath-media");
      }

      const response = await fetch(`/api/admin/spiritual-breaths/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ ...data, videoUrl, audioUrl }),
      });
      if (!response.ok) throw new Error("Failed to update spiritual breath");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spiritual-breaths"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual-breaths"] });
      toast({ title: "Spiritual breath updated successfully" });
      setIsBreathDialogOpen(false);
      resetBreathForm();
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("AWS S3 credentials not configured")) {
        return;
      }
      toast({ title: "Failed to update spiritual breath", variant: "destructive" });
    },
  });

  const deleteBreathMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/spiritual-breaths/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to delete spiritual breath");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spiritual-breaths"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual-breaths"] });
      toast({ title: "Spiritual breath deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete spiritual breath", variant: "destructive" });
    },
  });

  // Reset forms
  const resetFolderForm = () => {
    setFolderFormData({ name: "", type: "", displayOrder: 0 });
    setEditingFolder(null);
  };

  const resetSubfolderForm = () => {
    setSubfolderFormData({ name: "", folderId: undefined, displayOrder: 0 });
    setEditingSubfolder(null);
  };

  const resetProcessForm = () => {
    setProcessFormData({
      title: "",
      description: "",
      folderId: undefined,
      subfolderId: null,
      videoUrl: "",
      audioUrl: "",
      scriptUrl: "",
      iconName: "Brain",
      displayOrder: 0,
    });
    setProcessFiles({ video: null, audio: null, script: null });
    setEditingProcess(null);
  };

  const resetBreathForm = () => {
    setBreathFormData({
      title: "",
      description: "",
      videoUrl: "",
      audioUrl: "",
      displayOrder: 0,
    });
    setBreathFiles({ video: null, audio: null });
    setEditingBreath(null);
  };

  // Edit handlers
  const handleEditFolder = (folder: ProcessFolder) => {
    setEditingFolder(folder);
    setFolderFormData({
      name: folder.name,
      type: folder.type,
      displayOrder: folder.displayOrder,
    });
    setIsFolderDialogOpen(true);
  };

  const handleEditSubfolder = (subfolder: ProcessSubfolder) => {
    setEditingSubfolder(subfolder);
    setSubfolderFormData({
      name: subfolder.name,
      folderId: subfolder.folderId,
      displayOrder: subfolder.displayOrder,
    });
    setIsSubfolderDialogOpen(true);
  };

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process);
    setProcessFormData({
      title: process.title,
      description: process.description || "",
      folderId: process.folderId,
      subfolderId: process.subfolderId || null,
      videoUrl: process.videoUrl || "",
      audioUrl: process.audioUrl || "",
      scriptUrl: process.scriptUrl || "",
      iconName: process.iconName,
      displayOrder: process.displayOrder,
    });
    setIsProcessDialogOpen(true);
  };

  const handleEditBreath = (breath: SpiritualBreath) => {
    setEditingBreath(breath);
    setBreathFormData({
      title: breath.title,
      description: breath.description,
      videoUrl: breath.videoUrl || "",
      audioUrl: breath.audioUrl || "",
      displayOrder: breath.displayOrder,
    });
    setIsBreathDialogOpen(true);
  };

  // Submit handlers
  const handleFolderSubmit = () => {
    if (!folderFormData.name || !folderFormData.type) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, data: folderFormData });
    } else {
      createFolderMutation.mutate(folderFormData);
    }
  };

  const handleSubfolderSubmit = () => {
    if (!subfolderFormData.name) {
      toast({ 
        title: "Validation Error", 
        description: "Please enter a subfolder name",
        variant: "destructive" 
      });
      return;
    }
    if (!Number.isFinite(subfolderFormData.folderId) || subfolderFormData.folderId === undefined) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a parent folder",
        variant: "destructive" 
      });
      return;
    }
    if (editingSubfolder) {
      updateSubfolderMutation.mutate({ id: editingSubfolder.id, data: subfolderFormData as typeof subfolderFormData & { folderId: number } });
    } else {
      createSubfolderMutation.mutate(subfolderFormData as typeof subfolderFormData & { folderId: number });
    }
  };

  const handleProcessSubmit = () => {
    if (!processFormData.title) {
      toast({ 
        title: "Validation Error", 
        description: "Please enter a process title",
        variant: "destructive" 
      });
      return;
    }
    if (!Number.isFinite(processFormData.folderId) || processFormData.folderId === undefined) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a parent folder",
        variant: "destructive" 
      });
      return;
    }
    if (editingProcess) {
      updateProcessMutation.mutate({ id: editingProcess.id, data: processFormData as typeof processFormData & { folderId: number } });
    } else {
      createProcessMutation.mutate(processFormData as typeof processFormData & { folderId: number });
    }
  };

  const handleBreathSubmit = () => {
    if (!breathFormData.title || !breathFormData.description) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingBreath) {
      updateBreathMutation.mutate({ id: editingBreath.id, data: breathFormData });
    } else {
      createBreathMutation.mutate(breathFormData);
    }
  };

  return (
    <div className="p-8" data-testid="admin-process-library-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">Practice Library</h1>
        <p className="text-gray-600 mt-2" data-testid="text-page-description">
          Manage practice processes, folders, and spiritual breaths
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="folders" data-testid="tab-folders">Folders</TabsTrigger>
          <TabsTrigger value="subfolders" data-testid="tab-subfolders">Subfolders</TabsTrigger>
          <TabsTrigger value="processes" data-testid="tab-processes">Processes</TabsTrigger>
          <TabsTrigger value="breaths" data-testid="tab-spiritual-breaths">Spiritual Breaths</TabsTrigger>
        </TabsList>

        {/* Folders Tab */}
        <TabsContent value="folders">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Process Folders</h2>
              <Dialog open={isFolderDialogOpen} onOpenChange={(open) => {
                setIsFolderDialogOpen(open);
                if (!open) resetFolderForm();
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-folder">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFolder ? "Edit Folder" : "Create Folder"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name">Name</Label>
                      <Input
                        id="folder-name"
                        data-testid="input-folder-name"
                        value={folderFormData.name}
                        onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                        placeholder="e.g., Wealth Code Activation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-type">Type</Label>
                      <Input
                        id="folder-type"
                        data-testid="input-folder-type"
                        value={folderFormData.type}
                        onChange={(e) => setFolderFormData({ ...folderFormData, type: e.target.value })}
                        placeholder="e.g., DYD, USM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-order">Display Order</Label>
                      <Input
                        id="folder-order"
                        data-testid="input-folder-display-order"
                        type="number"
                        value={folderFormData.displayOrder}
                        onChange={(e) => setFolderFormData({ ...folderFormData, displayOrder: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button 
                      onClick={handleFolderSubmit} 
                      data-testid="button-submit-folder"
                      disabled={createFolderMutation.isPending || updateFolderMutation.isPending}
                    >
                      {editingFolder ? "Update" : "Create"} Folder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Display Order</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {folders.map((folder) => (
                    <tr key={folder.id} className="border-b" data-testid={`row-folder-${folder.id}`}>
                      <td className="p-2" data-testid={`text-folder-name-${folder.id}`}>{folder.name}</td>
                      <td className="p-2" data-testid={`text-folder-type-${folder.id}`}>{folder.type}</td>
                      <td className="p-2" data-testid={`text-folder-order-${folder.id}`}>{folder.displayOrder}</td>
                      <td className="p-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditFolder(folder)}
                          data-testid={`button-edit-folder-${folder.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFolderMutation.mutate(folder.id)}
                          data-testid={`button-delete-folder-${folder.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Subfolders Tab */}
        <TabsContent value="subfolders">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Process Subfolders</h2>
              <Dialog open={isSubfolderDialogOpen} onOpenChange={(open) => {
                setIsSubfolderDialogOpen(open);
                if (!open) resetSubfolderForm();
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-subfolder">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subfolder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSubfolder ? "Edit Subfolder" : "Create Subfolder"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subfolder-name">Name</Label>
                      <Input
                        id="subfolder-name"
                        data-testid="input-subfolder-name"
                        value={subfolderFormData.name}
                        onChange={(e) => setSubfolderFormData({ ...subfolderFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subfolder-folder">Parent Folder *</Label>
                      <Select
                        value={subfolderFormData.folderId?.toString() || ""}
                        onValueChange={(value) => setSubfolderFormData({ ...subfolderFormData, folderId: parseInt(value) })}
                      >
                        <SelectTrigger id="subfolder-folder" data-testid="select-subfolder-folder">
                          <SelectValue placeholder="Select parent folder" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id.toString()}>
                              {folder.name} ({folder.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subfolder-order">Display Order</Label>
                      <Input
                        id="subfolder-order"
                        data-testid="input-subfolder-display-order"
                        type="number"
                        value={subfolderFormData.displayOrder}
                        onChange={(e) => setSubfolderFormData({ ...subfolderFormData, displayOrder: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button 
                      onClick={handleSubfolderSubmit} 
                      data-testid="button-submit-subfolder"
                      disabled={createSubfolderMutation.isPending || updateSubfolderMutation.isPending}
                    >
                      {editingSubfolder ? "Update" : "Create"} Subfolder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Parent Folder</th>
                    <th className="text-left p-2">Display Order</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subfolders.map((subfolder) => {
                    const parentFolder = folders.find(f => f.id === subfolder.folderId);
                    return (
                      <tr key={subfolder.id} className="border-b" data-testid={`row-subfolder-${subfolder.id}`}>
                        <td className="p-2" data-testid={`text-subfolder-name-${subfolder.id}`}>{subfolder.name}</td>
                        <td className="p-2" data-testid={`text-subfolder-parent-${subfolder.id}`}>
                          {parentFolder?.name} ({parentFolder?.type})
                        </td>
                        <td className="p-2" data-testid={`text-subfolder-order-${subfolder.id}`}>{subfolder.displayOrder}</td>
                        <td className="p-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSubfolder(subfolder)}
                            data-testid={`button-edit-subfolder-${subfolder.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSubfolderMutation.mutate(subfolder.id)}
                            data-testid={`button-delete-subfolder-${subfolder.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Processes Tab - Continued in next response due to length */}
        <TabsContent value="processes">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Processes</h2>
              <Dialog open={isProcessDialogOpen} onOpenChange={(open) => {
                setIsProcessDialogOpen(open);
                if (!open) resetProcessForm();
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-process">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Process
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProcess ? "Edit Process" : "Create Process"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="process-title">Title</Label>
                      <Input
                        id="process-title"
                        data-testid="input-process-title"
                        value={processFormData.title}
                        onChange={(e) => setProcessFormData({ ...processFormData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="process-description">Description (optional)</Label>
                      <Input
                        id="process-description"
                        data-testid="input-process-description"
                        value={processFormData.description}
                        onChange={(e) => setProcessFormData({ ...processFormData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="process-folder">Parent Folder *</Label>
                      <Select
                        value={processFormData.folderId?.toString() || ""}
                        onValueChange={(value) => setProcessFormData({ ...processFormData, folderId: parseInt(value) })}
                      >
                        <SelectTrigger id="process-folder" data-testid="select-process-folder">
                          <SelectValue placeholder="Select parent folder" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id.toString()}>
                              {folder.name} ({folder.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="process-subfolder">Subfolder (optional)</Label>
                      <Select
                        value={processFormData.subfolderId?.toString() || "none"}
                        onValueChange={(value) => setProcessFormData({ 
                          ...processFormData, 
                          subfolderId: value === "none" ? null : parseInt(value) 
                        })}
                      >
                        <SelectTrigger id="process-subfolder" data-testid="select-process-subfolder">
                          <SelectValue placeholder="Select subfolder (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {subfolders
                            .filter(sf => sf.folderId === processFormData.folderId)
                            .map((subfolder) => (
                              <SelectItem key={subfolder.id} value={subfolder.id.toString()}>
                                {subfolder.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Video File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setProcessFiles({ ...processFiles, video: e.target.files?.[0] || null })}
                          data-testid="input-process-video"
                        />
                        {processFiles.video && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProcessFiles({ ...processFiles, video: null })}
                            data-testid="button-clear-video"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {processFormData.videoUrl && !processFiles.video && (
                        <p className="text-sm text-gray-500 mt-1">Current: {processFormData.videoUrl}</p>
                      )}
                    </div>
                    <div>
                      <Label>Audio File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setProcessFiles({ ...processFiles, audio: e.target.files?.[0] || null })}
                          data-testid="input-process-audio"
                        />
                        {processFiles.audio && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProcessFiles({ ...processFiles, audio: null })}
                            data-testid="button-clear-audio"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {processFormData.audioUrl && !processFiles.audio && (
                        <p className="text-sm text-gray-500 mt-1">Current: {processFormData.audioUrl}</p>
                      )}
                    </div>
                    <div>
                      <Label>Script File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx"
                          onChange={(e) => setProcessFiles({ ...processFiles, script: e.target.files?.[0] || null })}
                          data-testid="input-process-script"
                        />
                        {processFiles.script && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProcessFiles({ ...processFiles, script: null })}
                            data-testid="button-clear-script"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {processFormData.scriptUrl && !processFiles.script && (
                        <p className="text-sm text-gray-500 mt-1">Current: {processFormData.scriptUrl}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="process-icon">Icon Name</Label>
                      <Input
                        id="process-icon"
                        data-testid="input-process-icon"
                        value={processFormData.iconName}
                        onChange={(e) => setProcessFormData({ ...processFormData, iconName: e.target.value })}
                        placeholder="Brain, Heart, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="process-order">Display Order</Label>
                      <Input
                        id="process-order"
                        data-testid="input-process-display-order"
                        type="number"
                        value={processFormData.displayOrder}
                        onChange={(e) => setProcessFormData({ ...processFormData, displayOrder: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button 
                      onClick={handleProcessSubmit} 
                      data-testid="button-submit-process"
                      disabled={createProcessMutation.isPending || updateProcessMutation.isPending}
                    >
                      {editingProcess ? "Update" : "Create"} Process
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Folder</th>
                    <th className="text-left p-2">Subfolder</th>
                    <th className="text-left p-2">Media</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => {
                    const folder = folders.find(f => f.id === process.folderId);
                    const subfolder = process.subfolderId ? subfolders.find(sf => sf.id === process.subfolderId) : null;
                    return (
                      <tr key={process.id} className="border-b" data-testid={`row-process-${process.id}`}>
                        <td className="p-2" data-testid={`text-process-title-${process.id}`}>{process.title}</td>
                        <td className="p-2" data-testid={`text-process-folder-${process.id}`}>
                          {folder?.name}
                        </td>
                        <td className="p-2" data-testid={`text-process-subfolder-${process.id}`}>
                          {subfolder?.name || "-"}
                        </td>
                        <td className="p-2">
                          {process.videoUrl && <span className="text-xs bg-blue-100 px-2 py-1 rounded mr-1">Video</span>}
                          {process.audioUrl && <span className="text-xs bg-green-100 px-2 py-1 rounded mr-1">Audio</span>}
                          {process.scriptUrl && <span className="text-xs bg-purple-100 px-2 py-1 rounded">Script</span>}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditProcess(process)}
                            data-testid={`button-edit-process-${process.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteProcessMutation.mutate(process.id)}
                            data-testid={`button-delete-process-${process.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Spiritual Breaths Tab */}
        <TabsContent value="breaths">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Spiritual Breaths</h2>
              <Dialog open={isBreathDialogOpen} onOpenChange={(open) => {
                setIsBreathDialogOpen(open);
                if (!open) resetBreathForm();
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-breath">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Spiritual Breath
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingBreath ? "Edit Spiritual Breath" : "Create Spiritual Breath"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="breath-title">Title</Label>
                      <Input
                        id="breath-title"
                        data-testid="input-breath-title"
                        value={breathFormData.title}
                        onChange={(e) => setBreathFormData({ ...breathFormData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="breath-description">Description</Label>
                      <Input
                        id="breath-description"
                        data-testid="input-breath-description"
                        value={breathFormData.description}
                        onChange={(e) => setBreathFormData({ ...breathFormData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Video File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setBreathFiles({ ...breathFiles, video: e.target.files?.[0] || null })}
                          data-testid="input-breath-video"
                        />
                        {breathFiles.video && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setBreathFiles({ ...breathFiles, video: null })}
                            data-testid="button-clear-breath-video"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {breathFormData.videoUrl && !breathFiles.video && (
                        <p className="text-sm text-gray-500 mt-1">Current: {breathFormData.videoUrl}</p>
                      )}
                    </div>
                    <div>
                      <Label>Audio File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setBreathFiles({ ...breathFiles, audio: e.target.files?.[0] || null })}
                          data-testid="input-breath-audio"
                        />
                        {breathFiles.audio && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setBreathFiles({ ...breathFiles, audio: null })}
                            data-testid="button-clear-breath-audio"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {breathFormData.audioUrl && !breathFiles.audio && (
                        <p className="text-sm text-gray-500 mt-1">Current: {breathFormData.audioUrl}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="breath-order">Display Order</Label>
                      <Input
                        id="breath-order"
                        data-testid="input-breath-display-order"
                        type="number"
                        value={breathFormData.displayOrder}
                        onChange={(e) => setBreathFormData({ ...breathFormData, displayOrder: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button 
                      onClick={handleBreathSubmit} 
                      data-testid="button-submit-breath"
                      disabled={createBreathMutation.isPending || updateBreathMutation.isPending}
                    >
                      {editingBreath ? "Update" : "Create"} Spiritual Breath
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Media</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {breaths.map((breath) => (
                    <tr key={breath.id} className="border-b" data-testid={`row-breath-${breath.id}`}>
                      <td className="p-2" data-testid={`text-breath-title-${breath.id}`}>{breath.title}</td>
                      <td className="p-2" data-testid={`text-breath-description-${breath.id}`}>{breath.description}</td>
                      <td className="p-2">
                        {breath.videoUrl && <span className="text-xs bg-blue-100 px-2 py-1 rounded mr-1">Video</span>}
                        {breath.audioUrl && <span className="text-xs bg-green-100 px-2 py-1 rounded">Audio</span>}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditBreath(breath)}
                          data-testid={`button-edit-breath-${breath.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBreathMutation.mutate(breath.id)}
                          data-testid={`button-delete-breath-${breath.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
