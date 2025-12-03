import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FileText, Video, Music, FileType, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
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
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full" />
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-600 mt-1">Step 3: Build Curriculum</p>
      </div>

      <div className="max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full">1</span>
            <span className="text-gray-500">Basic Info</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full">2</span>
            <span className="text-gray-500">Thumbnail</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="bg-brand text-white px-3 py-1 rounded-full font-medium">3</span>
            <span className="text-gray-900 font-medium">Curriculum</span>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{course?.title}</h2>
              <p className="text-gray-600 text-sm">Build your course curriculum by adding modules, folders, and lessons.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="publish-toggle" className="text-gray-700">Publish</Label>
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
          </div>

          {course?.modules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
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
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="font-medium text-gray-900">{module.title}</span>
                        <span className="text-gray-500 text-sm">
                          ({module.lessons.length} lessons)
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAddFolder(module.id)}
                          title="Add Folder"
                          data-testid={`button-add-folder-${module.id}`}
                        >
                          <Folder className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAddLesson(module.id)}
                          title="Add Lesson"
                          data-testid={`button-add-lesson-${module.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModule(module)}
                          data-testid={`button-edit-module-${module.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteModuleMutation.mutate(module.id)}
                          className="hover:text-red-500"
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
                            <div className="border border-gray-200 rounded-lg overflow-hidden ml-6">
                              <CollapsibleTrigger className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100">
                                <div className="flex items-center gap-2">
                                  <Folder className="w-4 h-4 text-yellow-600" />
                                  <span className="text-gray-800">{folder.title}</span>
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openAddLesson(module.id, folder.id)}
                                    className="h-8 w-8"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditFolder(folder)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteFolderMutation.mutate(folder.id)}
                                    className="h-8 w-8 hover:text-red-500"
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
                                      className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700">{lesson.title}</span>
                                        <div className="flex gap-1">
                                          {lesson.files.map((file) => (
                                            <span key={file.id} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
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
                                          onClick={() => setLocation(`/admin/courses/${courseId}/lessons/${lesson.id}?from=create`)}
                                          className="h-8 w-8"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                          className="h-8 w-8 hover:text-red-500"
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
                            className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 ml-6"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{lesson.title}</span>
                              <div className="flex gap-1">
                                {lesson.files.map((file) => (
                                  <span key={file.id} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
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
                                onClick={() => setLocation(`/admin/courses/${courseId}/lessons/${lesson.id}?from=create`)}
                                className="h-8 w-8"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                className="h-8 w-8 hover:text-red-500"
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
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation(`/admin/courses/create/step2/${courseId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleFinish}
            className="bg-brand hover:bg-brand/90"
            data-testid="button-finish"
          >
            Finish
          </Button>
        </div>
      </div>

      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Add Module"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="module-title">Module Title</Label>
            <Input
              id="module-title"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Enter module title"
              className="mt-2"
              data-testid="input-module-title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveModule}
              disabled={!moduleTitle.trim()}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-save-module"
            >
              {editingModule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Edit Folder" : "Add Folder"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-title">Folder Title</Label>
            <Input
              id="folder-title"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              placeholder="Enter folder title"
              className="mt-2"
              data-testid="input-folder-title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFolder}
              disabled={!folderTitle.trim()}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-save-folder"
            >
              {editingFolder ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Enter lesson title"
                className="mt-2"
                data-testid="input-lesson-title"
              />
            </div>
            <div>
              <Label htmlFor="lesson-description">Description (Optional)</Label>
              <Input
                id="lesson-description"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Enter lesson description"
                className="mt-2"
                data-testid="input-lesson-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={!lessonTitle.trim()}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-save-lesson"
            >
              {editingLesson ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
