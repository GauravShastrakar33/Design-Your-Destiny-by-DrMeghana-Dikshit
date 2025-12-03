import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FileText, Video, Music, FileType, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

export default function CourseCreateStep3() {
  const params = useParams();
  const courseId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
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

  const createModuleMutation = useMutation({
    mutationFn: async (title: string) => {
      await apiRequest("POST", "/api/admin/v1/cms/modules", { courseId, title });
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

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: number; title: string; description?: string }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/lessons/${id}`, { title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      setLessonDialogOpen(false);
      setEditingLesson(null);
      setLessonTitle("");
      setLessonDescription("");
      toast({ title: "Lesson updated" });
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

  const publishMutation = useMutation({
    mutationFn: async (isPublished: boolean) => {
      await apiRequest("PUT", `/api/admin/v1/cms/courses/${courseId}`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses"] });
      toast({ title: course?.isPublished ? "Course unpublished" : "Course published" });
    },
  });

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

  const openEditLesson = (lesson: CmsLesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description || "");
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
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, title: lessonTitle, description: lessonDescription });
    } else if (selectedModuleId) {
      createLessonMutation.mutate({ 
        moduleId: selectedModuleId, 
        folderId: selectedFolderId || undefined, 
        title: lessonTitle, 
        description: lessonDescription 
      });
    }
  };

  const handleFinish = () => {
    setLocation("/admin/courses");
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
        <AdminHeader title="Create Course - Step 3" />
        <AdminContentPanel>
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full">1</span>
                <span>Basic Info</span>
                <span className="mx-2">-</span>
                <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full">2</span>
                <span>Thumbnail</span>
                <span className="mx-2">-</span>
                <span className="bg-brand text-white px-3 py-1 rounded-full">3</span>
                <span className="text-white">Curriculum</span>
              </div>
            </div>

            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-white">{course?.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    Build your course curriculum by adding modules, folders, and lessons.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="publish-toggle" className="text-gray-300">Publish</Label>
                    <Switch
                      id="publish-toggle"
                      checked={course?.isPublished || false}
                      onCheckedChange={(checked) => publishMutation.mutate(checked)}
                      data-testid="switch-publish"
                    />
                  </div>
                  <Button onClick={openAddModule} className="bg-brand hover:bg-brand/90" data-testid="button-add-module">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                  </Button>
                </div>
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
                                data-testid={`button-add-folder-${module.id}`}
                              >
                                <Folder className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAddLesson(module.id)}
                                className="text-gray-400 hover:text-white"
                                data-testid={`button-add-lesson-${module.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModule(module)}
                                className="text-gray-400 hover:text-white"
                                data-testid={`button-edit-module-${module.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteModuleMutation.mutate(module.id)}
                                className="text-gray-400 hover:text-red-500"
                                data-testid={`button-delete-module-${module.id}`}
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

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(`/admin/courses/create/step2/${courseId}`)}
                className="border-gray-700 text-gray-300"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleFinish}
                className="bg-brand hover:bg-brand/90"
                data-testid="button-create"
              >
                {course?.modules.length ? "Finish" : "Create"}
              </Button>
            </div>
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
              data-testid="input-module-title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveModule} className="bg-brand hover:bg-brand/90" data-testid="button-save-module">
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
              data-testid="input-folder-title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveFolder} className="bg-brand hover:bg-brand/90" data-testid="button-save-folder">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLesson ? "Edit Lesson" : "Add Lesson"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-gray-300">Lesson Title</Label>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Enter lesson title"
                className="bg-gray-800 border-gray-700 text-white mt-2"
                data-testid="input-lesson-title"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description (Optional)</Label>
              <Input
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Enter lesson description"
                className="bg-gray-800 border-gray-700 text-white mt-2"
                data-testid="input-lesson-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} className="bg-brand hover:bg-brand/90" data-testid="button-save-lesson">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
