import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FileText, Video, Music, FileType, GripVertical, Save, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsCourse, CmsModule, CmsModuleFolder, CmsLesson, CmsLessonFile } from "@shared/schema";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminContentPanel from "@/components/AdminContentPanel";

type CourseWithModules = CmsCourse & {
  modules: (CmsModule & {
    folders: CmsModuleFolder[];
    lessons: (CmsLesson & { files: CmsLessonFile[] })[];
  })[];
};

export default function CourseBuilderPage() {
  const params = useParams();
  const courseId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CmsModule | null>(null);
  const [editingFolder, setEditingFolder] = useState<CmsModuleFolder | null>(null);
  const [editingLesson, setEditingLesson] = useState<CmsLesson | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [folderTitle, setFolderTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: course, isLoading } = useQuery<CourseWithModules>({
    queryKey: ["/api/admin/v1/cms/courses", courseId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/cms/courses/${courseId}`, {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch course");
      return response.json();
    },
    enabled: !!courseId,
  });

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setProgramCode(course.programCode);
      setDescription(course.description || "");
    }
  }, [course]);

  const updateCourseMutation = useMutation({
    mutationFn: async (data: Partial<CmsCourse>) => {
      await apiRequest("PUT", `/api/admin/v1/cms/courses/${courseId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses"] });
      toast({ title: "Course updated" });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleTitle: string) => {
      await apiRequest("POST", "/api/admin/v1/cms/modules", { courseId, title: moduleTitle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      setModuleDialogOpen(false);
      setModuleTitle("");
      toast({ title: "Module created" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/modules/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      setModuleDialogOpen(false);
      setEditingModule(null);
      setModuleTitle("");
      toast({ title: "Module updated" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/v1/cms/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      toast({ title: "Module deleted" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ moduleId, title }: { moduleId: number; title: string }) => {
      await apiRequest("POST", "/api/admin/v1/cms/folders", { moduleId, title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      setFolderDialogOpen(false);
      setFolderTitle("");
      setSelectedModuleId(null);
      toast({ title: "Folder created" });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/folders/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      setFolderDialogOpen(false);
      setEditingFolder(null);
      setFolderTitle("");
      toast({ title: "Folder updated" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/v1/cms/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      toast({ title: "Folder deleted" });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: { moduleId: number; folderId?: number; title: string; description?: string }) => {
      await apiRequest("POST", "/api/admin/v1/cms/lessons", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      setLessonDialogOpen(false);
      setLessonTitle("");
      setLessonDescription("");
      setSelectedModuleId(null);
      setSelectedFolderId(null);
      toast({ title: "Lesson created" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/v1/cms/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      toast({ title: "Lesson deleted" });
    },
  });

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const uploadUrlResponse = await apiRequest("POST", "/api/admin/v1/cms/files/get-upload-url", {
        filename: file.name,
        contentType: file.type,
        courseId,
        uploadType: "thumbnail",
      });
      const { uploadUrl, key, publicUrl } = await uploadUrlResponse.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      await updateCourseMutation.mutateAsync({
        thumbnailKey: key,
        thumbnailUrl: publicUrl,
      });

      toast({ title: "Thumbnail uploaded" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload thumbnail", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleModule = (id: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedModules(newExpanded);
  };

  const toggleFolder = (id: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const openAddModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    setModuleDialogOpen(true);
  };

  const openEditModule = (module: CmsModule) => {
    setEditingModule(module);
    setModuleTitle(module.title);
    setModuleDialogOpen(true);
  };

  const openAddFolder = (moduleId: number) => {
    setEditingFolder(null);
    setSelectedModuleId(moduleId);
    setFolderTitle("");
    setFolderDialogOpen(true);
  };

  const openEditFolder = (folder: CmsModuleFolder) => {
    setEditingFolder(folder);
    setFolderTitle(folder.title);
    setFolderDialogOpen(true);
  };

  const openAddLesson = (moduleId: number, folderId?: number) => {
    setEditingLesson(null);
    setSelectedModuleId(moduleId);
    setSelectedFolderId(folderId || null);
    setLessonTitle("");
    setLessonDescription("");
    setLessonDialogOpen(true);
  };

  const handleSaveModule = () => {
    if (!moduleTitle.trim()) return;
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, title: moduleTitle });
    } else {
      createModuleMutation.mutate(moduleTitle);
    }
  };

  const handleSaveFolder = () => {
    if (!folderTitle.trim()) return;
    if (editingFolder) {
      updateFolderMutation.mutate({ id: editingFolder.id, title: folderTitle });
    } else if (selectedModuleId) {
      createFolderMutation.mutate({ moduleId: selectedModuleId, title: folderTitle });
    }
  };

  const handleSaveLesson = () => {
    if (!lessonTitle.trim()) return;
    if (selectedModuleId) {
      createLessonMutation.mutate({ 
        moduleId: selectedModuleId, 
        folderId: selectedFolderId || undefined, 
        title: lessonTitle, 
        description: lessonDescription 
      });
    }
  };

  const handleSaveCourseInfo = () => {
    updateCourseMutation.mutate({ title, programCode, description });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#1a1a1a]">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  const getLessonsInFolder = (moduleId: number, folderId: number) => {
    const module = course?.modules.find(m => m.id === moduleId);
    return module?.lessons.filter(l => l.folderId === folderId) || [];
  };

  const getLessonsWithoutFolder = (moduleId: number) => {
    const module = course?.modules.find(m => m.id === moduleId);
    return module?.lessons.filter(l => !l.folderId) || [];
  };

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title={`Edit Course: ${course?.title || ""}`} />
        <AdminContentPanel>
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin/courses")}
                className="border-gray-700 text-gray-300"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="publish-toggle" className="text-gray-300">Published</Label>
                  <Switch
                    id="publish-toggle"
                    checked={course?.isPublished || false}
                    onCheckedChange={(checked) => updateCourseMutation.mutate({ isPublished: checked })}
                    data-testid="switch-publish"
                  />
                </div>
              </div>
            </div>

            <Tabs defaultValue="curriculum" className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="info" className="data-[state=active]:bg-gray-700">Course Info</TabsTrigger>
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-gray-700">Curriculum</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-gray-300">Title</Label>
                        <Input
                          value={title || course?.title || ""}
                          onChange={(e) => setTitle(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white mt-2"
                          data-testid="input-title"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Program Code</Label>
                        <Input
                          value={programCode || course?.programCode || ""}
                          onChange={(e) => setProgramCode(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white mt-2"
                          data-testid="input-program-code"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        value={description || course?.description || ""}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[100px]"
                        data-testid="input-description"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Thumbnail</Label>
                      <div className="mt-2 flex items-center gap-4">
                        {course?.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt="Course thumbnail"
                            className="w-32 h-18 object-cover rounded"
                          />
                        ) : (
                          <div className="w-32 h-18 bg-gray-700 rounded flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                            className="hidden"
                            disabled={uploading}
                          />
                          <Button
                            variant="outline"
                            disabled={uploading}
                            className="border-gray-700 text-gray-300"
                            asChild
                          >
                            <span>{uploading ? "Uploading..." : "Change Thumbnail"}</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveCourseInfo}
                      disabled={updateCourseMutation.isPending}
                      className="bg-brand hover:bg-brand/90"
                      data-testid="button-save-info"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="curriculum">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="text-white">Course Curriculum</CardTitle>
                    <Button onClick={openAddModule} className="bg-brand hover:bg-brand/90" data-testid="button-add-module">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {course?.modules.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <p>No modules yet. Add your first module to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {course?.modules.map((module) => (
                          <Collapsible
                            key={module.id}
                            open={expandedModules.has(module.id)}
                            onOpenChange={() => toggleModule(module.id)}
                          >
                            <div className="border border-gray-700 rounded-lg overflow-hidden">
                              <CollapsibleTrigger className="w-full px-4 py-3 bg-gray-800/50 flex items-center justify-between hover:bg-gray-800">
                                <div className="flex items-center gap-3">
                                  <GripVertical className="w-4 h-4 text-gray-500" />
                                  {expandedModules.has(module.id) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-white font-medium">{module.title}</span>
                                  <span className="text-gray-500 text-sm">
                                    ({module.lessons.length} lessons)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openAddFolder(module.id)}
                                    className="text-gray-400 hover:text-white"
                                    title="Add Folder"
                                  >
                                    <Folder className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openAddLesson(module.id)}
                                    className="text-gray-400 hover:text-white"
                                    title="Add Lesson"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditModule(module)}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteModuleMutation.mutate(module.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-4 space-y-3">
                                  {module.folders.map((folder) => (
                                    <Collapsible
                                      key={folder.id}
                                      open={expandedFolders.has(folder.id)}
                                      onOpenChange={() => toggleFolder(folder.id)}
                                    >
                                      <div className="border border-gray-700 rounded-lg overflow-hidden ml-6">
                                        <CollapsibleTrigger className="w-full px-3 py-2 bg-gray-800/30 flex items-center justify-between hover:bg-gray-800/50">
                                          <div className="flex items-center gap-2">
                                            <Folder className="w-4 h-4 text-yellow-500" />
                                            <span className="text-gray-200">{folder.title}</span>
                                          </div>
                                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openAddLesson(module.id, folder.id)}
                                              className="text-gray-400 hover:text-white h-8 w-8"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openEditFolder(folder)}
                                              className="text-gray-400 hover:text-white h-8 w-8"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => deleteFolderMutation.mutate(folder.id)}
                                              className="text-gray-400 hover:text-red-500 h-8 w-8"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                          <div className="p-2 space-y-1">
                                            {getLessonsInFolder(module.id, folder.id).map((lesson) => (
                                              <div
                                                key={lesson.id}
                                                className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-800/50"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <FileText className="w-4 h-4 text-gray-400" />
                                                  <span className="text-gray-300">{lesson.title}</span>
                                                  <div className="flex gap-1">
                                                    {lesson.files.map((file) => (
                                                      <span key={file.id} className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">
                                                        {file.fileType === "video" && <Video className="w-3 h-3 inline" />}
                                                        {file.fileType === "audio" && <Music className="w-3 h-3 inline" />}
                                                        {file.fileType === "script" && <FileType className="w-3 h-3 inline" />}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setLocation(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                                                    className="text-gray-400 hover:text-white h-8 w-8"
                                                  >
                                                    <Edit className="w-3 h-3" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                                    className="text-gray-400 hover:text-red-500 h-8 w-8"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CollapsibleContent>
                                      </div>
                                    </Collapsible>
                                  ))}
                                  
                                  {getLessonsWithoutFolder(module.id).map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-800/50 ml-6"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-300">{lesson.title}</span>
                                        <div className="flex gap-1">
                                          {lesson.files.map((file) => (
                                            <span key={file.id} className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">
                                              {file.fileType === "video" && <Video className="w-3 h-3 inline" />}
                                              {file.fileType === "audio" && <Music className="w-3 h-3 inline" />}
                                              {file.fileType === "script" && <FileType className="w-3 h-3 inline" />}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setLocation(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                                          className="text-gray-400 hover:text-white h-8 w-8"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                          className="text-gray-400 hover:text-red-500 h-8 w-8"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AdminContentPanel>
      </div>

      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingModule ? "Edit Module" : "Add Module"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-gray-300">Module Title</Label>
            <Input
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Enter module title"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveModule} className="bg-brand hover:bg-brand/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingFolder ? "Edit Folder" : "Add Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-gray-300">Folder Title</Label>
            <Input
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              placeholder="Enter folder title"
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveFolder} className="bg-brand hover:bg-brand/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Lesson</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-gray-300">Lesson Title</Label>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Enter lesson title"
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description (Optional)</Label>
              <Input
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Enter lesson description"
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} className="bg-brand hover:bg-brand/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
