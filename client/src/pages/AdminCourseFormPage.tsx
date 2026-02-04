import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams, useSearch } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Video,
  Music,
  FileType,
  GripVertical,
  Save,
  Image as ImageIcon,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  Settings2,
  Layers,
  Layout,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type {
  CmsCourse,
  CmsModule,
  CmsModuleFolder,
  CmsLesson,
  CmsLessonFile,
  Program,
} from "@shared/schema";
import { cn } from "@/lib/utils";

// --- Validation Schemas ---

const step1Schema = yup.object().shape({
  title: yup.string().required("Course title is required"),
  programId: yup.string().required("Program assignment is required"),
  description: yup.string().nullable(),
});

const moduleSchema = yup.object().shape({
  title: yup.string().required("Module title is required"),
});

const folderSchema = yup.object().shape({
  title: yup.string().required("Folder title is required"),
});

const lessonSchema = yup.object().shape({
  title: yup.string().required("Lesson title is required"),
  description: yup.string().nullable(),
});

type Step1Data = yup.InferType<typeof step1Schema>;
type ModuleData = yup.InferType<typeof moduleSchema>;
type FolderData = yup.InferType<typeof folderSchema>;
type LessonData = yup.InferType<typeof lessonSchema>;

// --- Types ---

type CourseWithModules = CmsCourse & {
  thumbnailSignedUrl?: string | null;
  programCode?: string | null;
  modules: (CmsModule & {
    folders: CmsModuleFolder[];
    lessons: (CmsLesson & { files: CmsLessonFile[] })[];
  })[];
};

const STEPS = [
  { id: 1, title: "Basic Information", icon: Layout },
  { id: 2, title: "Course Media", icon: ImageIcon },
  { id: 3, title: "Curriculum Builder", icon: Layers },
];

export default function AdminCourseFormPage() {
  const params = useParams();
  const courseId = params.id ? parseInt(params.id) : null;
  const isEdit = !!courseId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Curriculum State
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CmsModule | null>(null);
  const [editingFolder, setEditingFolder] = useState<CmsModuleFolder | null>(
    null
  );
  const [editingLesson, setEditingLesson] = useState<CmsLesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
    new Set()
  );

  const searchString = useSearch();

  useEffect(() => {
    const searchParams = new URLSearchParams(searchString);
    const step = searchParams.get("step");
    if (step) {
      setCurrentStep(parseInt(step));
    }
  }, [searchString]);

  const moduleForm = useForm<ModuleData>({
    resolver: yupResolver(moduleSchema),
    defaultValues: { title: "" },
  });

  const folderForm = useForm<FolderData>({
    resolver: yupResolver(folderSchema),
    defaultValues: { title: "" },
  });

  const lessonForm = useForm<LessonData>({
    resolver: yupResolver(lessonSchema),
    defaultValues: { title: "", description: "" },
  });

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  // --- Queries & Mutations ---

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  const { data: course, isLoading: isLoadingCourse } =
    useQuery<CourseWithModules>({
      queryKey: ["/api/admin/v1/cms/courses", courseId],
      queryFn: async () => {
        const response = await fetch(`/api/admin/v1/cms/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch course");
        return response.json();
      },
      enabled: !!courseId,
    });

  const form = useForm<Step1Data>({
    resolver: yupResolver(step1Schema),
    defaultValues: {
      title: "",
      programId: "",
      description: "",
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        programId: course.programId ? String(course.programId) : "none",
        description: course.description || "",
      });
      if (course.thumbnailSignedUrl) {
        setPreviewUrl(course.thumbnailSignedUrl);
      }
    }
  }, [course, form]);

  const saveStep1Mutation = useMutation({
    mutationFn: async (data: Step1Data) => {
      const payload = {
        title: data.title,
        programId:
          data.programId && data.programId !== "none"
            ? parseInt(data.programId)
            : null,
        description: data.description || null,
      };

      if (isEdit) {
        return apiRequest(
          "PUT",
          `/api/admin/v1/cms/courses/${courseId}`,
          payload
        );
      } else {
        const response = await apiRequest(
          "POST",
          "/api/admin/v1/cms/courses",
          payload
        );
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses"],
      });
      if (!isEdit) {
        setLocation(`/admin/courses/${data.id}/edit`);
        setCurrentStep(2);
      } else {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/v1/cms/courses", courseId],
        });
        setCurrentStep(2);
      }
      toast({ title: isEdit ? "Course updated" : "Course created" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: Partial<CmsCourse>) => {
      await apiRequest("PUT", `/api/admin/v1/cms/courses/${courseId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses"],
      });
    },
  });

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (!course?.programCode) {
      toast({
        title: "Course must have a program assigned to upload files",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const uploadUrlResponse = await apiRequest(
        "POST",
        "/api/admin/v1/cms/files/get-upload-url",
        {
          filename: file.name,
          contentType: file.type,
          courseId,
          programCode: course.programCode,
          uploadType: "thumbnail",
        }
      );
      const { uploadUrl, key, signedUrl } = await uploadUrlResponse.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await updateCourseMutation.mutateAsync({ thumbnailKey: key });
      setPreviewUrl(signedUrl);
      toast({ title: "Thumbnail uploaded" });
    } catch (error) {
      toast({ title: "Failed to upload thumbnail", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // --- Curriculum Actions ---

  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleData) => {
      await apiRequest("POST", "/api/admin/v1/cms/modules", {
        courseId,
        title: data.title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses", courseId],
      });
      setModuleDialogOpen(false);
      moduleForm.reset();
      toast({ title: "Module created" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ModuleData }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/modules/${id}`, {
        title: data.title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses", courseId],
      });
      setModuleDialogOpen(false);
      toast({ title: "Module updated" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/v1/cms/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses", courseId],
      });
      toast({ title: "Module deleted" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: FolderData) => {
      await apiRequest("POST", "/api/admin/v1/cms/folders", {
        moduleId: selectedModuleId,
        title: data.title,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses", courseId],
      });
      setFolderDialogOpen(false);
      folderForm.reset();
      toast({ title: "Folder created" });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: LessonData) => {
      await apiRequest("POST", "/api/admin/v1/cms/lessons", {
        moduleId: selectedModuleId,
        folderId: selectedFolderId || undefined,
        title: data.title,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses", courseId],
      });
      setLessonDialogOpen(false);
      lessonForm.reset();
      toast({ title: "Lesson created" });
    },
  });

  const toggleModule = (id: number) => {
    const next = new Set(expandedModules);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedModules(next);
  };

  const toggleFolder = (id: number) => {
    const next = new Set(expandedFolders);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedFolders(next);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      form.handleSubmit((data) => saveStep1Mutation.mutate(data))();
    } else if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    } else {
      setLocation("/admin/courses");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      setLocation("/admin/courses");
    }
  };

  if (isEdit && isLoadingCourse) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="mb-5 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin/courses")}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Course" : "Create New Course"}
        </h1>
      </div>

      {/* Progress Stepper */}
      <div className="relative mb-6 w-full">
        <div className="absolute top-6 left-[6%] right-[6%] h-0.5 bg-gray-100 -translate-y-1/2" />
        <div
          className="absolute top-6 left-[6%] h-0.5 bg-brand transition-all duration-500 -translate-y-1/2"
          style={{
            width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 88}%)`,
          }}
        />

        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center w-32 z-10"
              >
                <button
                  disabled={!isEdit && step.id > currentStep}
                  onClick={() => isEdit && setCurrentStep(step.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive
                      ? "bg-white border-brand text-brand shadow-lg"
                      : isCompleted
                      ? "bg-brand border-brand text-white"
                      : "bg-white border-gray-100 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>
                <span
                  className={cn(
                    "mt-3 text-xs font-semibold tracking-wider text-center",
                    isActive ? "text-brand" : "text-gray-400"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="w-full">
        {currentStep === 1 && (
          <Card className="p-5 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <FormProvider {...form}>
              <form className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-brand" />
                  </div>
                  <h2 className="text-md font-bold text-gray-900">
                    General Information
                  </h2>
                </div>

                <FormInput
                  name="title"
                  label="Course Title"
                  placeholder="e.g. Master Your Morning Routine"
                  required
                />

                <FormSelect
                  name="programId"
                  label="Assigned Program"
                  placeholder="Select a program"
                  required
                  options={[
                    { label: "-- No Program (Stand-alone) --", value: "none" },
                    ...programs.map((p) => ({
                      label: `${p.name} (${p.code})`,
                      value: String(p.id),
                    })),
                  ]}
                />

                <FormTextarea
                  name="description"
                  label="Course Description"
                  placeholder="Describe what students will learn..."
                />
              </form>
            </FormProvider>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="p-5 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-brand" />
                </div>
                <h2 className="text-md font-bold text-gray-900">
                  Thumbnail Preview
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="w-full">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleThumbnailUpload(file);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    className={cn(
                      "relative aspect-video rounded-lg border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden bg-gray-50/50",
                      dragOver
                        ? "border-brand bg-brand/5 scale-[0.99]"
                        : "border-gray-200 hover:border-gray-300",
                      previewUrl && "border-none shadow-inner"
                    )}
                  >
                    {previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                handleThumbnailUpload(e.target.files[0])
                              }
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30"
                            >
                              Change Image
                            </Button>
                          </label>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-500/80 backdrop-blur-md"
                            onClick={() => {
                              setPreviewUrl(null);
                              updateCourseMutation.mutate({
                                thumbnailKey: null,
                              });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-10">
                        <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4 mx-auto border border-gray-100">
                          {uploading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
                          ) : (
                            <Upload className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-gray-600 font-semibold mb-1">
                          {uploading
                            ? "Uploading..."
                            : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs font-semibold text-gray-400 tracking-widest">
                          Recommended: 1024 x 576 (16:9)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleThumbnailUpload(e.target.files[0])
                          }
                          disabled={uploading}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="p-6 bg-gray-50/50 rounded-lg border border-gray-100 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand" />
                      Upload Requirements
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-400">
                          Accepted Formats
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          JPG, PNG
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-400">
                          Maximum File Size
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          2 MB
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-400">
                          Aspect Ratio
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          16:9
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs font-semibold text-gray-400">
                          Recommended Size
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          1024 x 576 px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="p-5 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-md font-bold text-gray-900">
                      Curriculum Structure
                    </h2>
                    <p className="text-xs text-gray-400 font-bold tracking-widest">
                      {course?.modules.length || 0} Modules
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100 transition-all min-w-[140px]">
                    <div className="flex items-center gap-2 flex-1">
                      {updateCourseMutation.isPending ? (
                        <Loader2 className="w-3 h-3 text-brand animate-spin ml-1" />
                      ) : (
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full ml-1",
                            course?.isPublished
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                              : "bg-gray-300"
                          )}
                        />
                      )}
                      <Label
                        htmlFor="live-toggle"
                        className="text-xs font-bold text-gray-500"
                      >
                        {course?.isPublished ? "Publish" : "Draft"}
                      </Label>
                    </div>
                    <Switch
                      id="live-toggle"
                      disabled={updateCourseMutation.isPending}
                      checked={course?.isPublished || false}
                      onCheckedChange={(checked) =>
                        updateCourseMutation.mutate({ isPublished: checked })
                      }
                      className="data-[state=checked]:bg-green-500 scale-90"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setEditingModule(null);
                      moduleForm.reset({ title: "" });
                      setModuleDialogOpen(true);
                    }}
                    className="bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20 rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </div>

              {!course?.modules?.length ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Layout className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-bold">
                    Start Building Your Course
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                    Create modules and fill them with lessons to provide a
                    structured learning experience.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.modules.map((module) => (
                    <Collapsible
                      key={module.id}
                      open={expandedModules.has(module.id)}
                      onOpenChange={() => toggleModule(module.id)}
                      className="group"
                    >
                      <div className="rounded-lg border border-gray-100 overflow-hidden bg-white hover:border-brand/20 transition-colors shadow-sm">
                        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 text-left">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-brand group-hover:text-white transition-colors cursor-grab">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">
                                  {module.title}
                                </span>
                                {expandedModules.has(module.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                {module.lessons.length} Lessons
                              </span>
                            </div>
                          </div>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-gray-400 hover:text-brand"
                              onClick={() => {
                                setSelectedModuleId(module.id);
                                setFolderDialogOpen(true);
                              }}
                            >
                              <Folder className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-gray-400 hover:text-brand"
                              onClick={() => {
                                setSelectedModuleId(module.id);
                                setSelectedFolderId(null);
                                setLessonDialogOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-gray-400 hover:text-brand"
                              onClick={() => {
                                setEditingModule(module);
                                moduleForm.reset({ title: module.title });
                                setModuleDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-4 bg-gray-100 mx-1" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-gray-400 hover:text-red-500"
                              onClick={() =>
                                deleteModuleMutation.mutate(module.id)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-5 pt-0 bg-gray-50/30">
                            <div className="h-px bg-gray-100 mb-5" />

                            {/* Folders */}
                            <div className="space-y-3">
                              {module.folders.map((folder) => (
                                <Collapsible
                                  key={folder.id}
                                  open={expandedFolders.has(folder.id)}
                                  onOpenChange={() => toggleFolder(folder.id)}
                                >
                                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm ml-4">
                                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/50">
                                      <div className="flex items-center gap-3">
                                        <Folder className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                                        <span className="font-bold text-gray-700 text-sm">
                                          {folder.title}
                                        </span>
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-400"
                                          onClick={() => {
                                            setSelectedModuleId(module.id);
                                            setSelectedFolderId(folder.id);
                                            setLessonDialogOpen(true);
                                          }}
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-400"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="p-3 pt-0 ml-7 space-y-1">
                                        {module.lessons
                                          .filter(
                                            (l) => l.folderId === folder.id
                                          )
                                          .map((lesson) => (
                                            <div
                                              key={lesson.id}
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group/lesson"
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-600">
                                                  {lesson.title}
                                                </span>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover/lesson:opacity-100"
                                                onClick={() =>
                                                  setLocation(
                                                    `/admin/courses/${courseId}/lessons/${lesson.id}`
                                                  )
                                                }
                                              >
                                                <Edit className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          ))}
                                      </div>
                                    </CollapsibleContent>
                                  </div>
                                </Collapsible>
                              ))}

                              {/* Loose Lessons */}
                              {module.lessons
                                .filter((l) => !l.folderId)
                                .map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm ml-4 flex items-center justify-between group/lesson"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-gray-800 text-sm leading-none mb-1">
                                          {lesson.title}
                                        </p>
                                        <div className="flex gap-1.5">
                                          {lesson.files.map((f) => (
                                            <Badge
                                              key={f.id}
                                              variant="secondary"
                                              className="px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-tighter bg-gray-100 text-gray-500 border-none"
                                            >
                                              {f.fileType === "video" && (
                                                <Video className="w-2.5 h-2.5 mr-0.5" />
                                              )}
                                              {f.fileType === "audio" && (
                                                <Music className="w-2.5 h-2.5 mr-0.5" />
                                              )}
                                              {f.fileType === "script" && (
                                                <FileType className="w-2.5 h-2.5 mr-0.5" />
                                              )}
                                              {f.fileType}
                                            </Badge>
                                          ))}
                                          {lesson.files.length === 0 && (
                                            <span className="text-[9px] text-gray-400 font-bold italic uppercase tracking-widest">
                                              No Content
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-brand"
                                        onClick={() =>
                                          setLocation(
                                            `/admin/courses/${courseId}/lessons/${lesson.id}`
                                          )
                                        }
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {module.lessons.length === 0 &&
                              module.folders.length === 0 && (
                                <div className="p-8 text-center bg-white/50 rounded-lg border-2 border-dashed border-gray-200">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Empty Module
                                  </p>
                                </div>
                              )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 w-full">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-lg border-gray-200 font-bold transition-all hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? "Cancel" : "Previous Step"}
        </Button>

        <Button
          onClick={handleNext}
          disabled={saveStep1Mutation.isPending}
          className="rounded-lg bg-brand hover:bg-brand/90 shadow-xl shadow-brand/20 font-bold transition-all"
        >
          {currentStep === 3 ? "Complete Course" : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* --- Dialogs --- */}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <FormProvider {...moduleForm}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 leading-none mb-1">
                {editingModule ? "Edit Module" : "New Module"}
              </DialogTitle>
              <p className="text-xs font-bold text-gray-400 ">
                Organize your course content
              </p>
            </DialogHeader>
            <div className="py-6">
              <FormInput
                name="title"
                label="Module Title"
                placeholder="e.g. Week 1: The Foundation"
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setModuleDialogOpen(false)}
                className="h-11 rounded-lg font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={moduleForm.handleSubmit((data) =>
                  editingModule
                    ? updateModuleMutation.mutate({
                        id: editingModule.id,
                        data,
                      })
                    : createModuleMutation.mutate(data)
                )}
                className="bg-brand hover:bg-brand/90 h-11 px-8 rounded-lg font-bold shadow-lg shadow-brand/20"
                disabled={
                  createModuleMutation.isPending ||
                  updateModuleMutation.isPending
                }
              >
                {editingModule ? "Update Module" : "Create Module"}
              </Button>
            </DialogFooter>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <FormProvider {...folderForm}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 leading-none mb-1">
                New Folder
              </DialogTitle>
              <p className="text-xs font-bold text-gray-400 ">
                Group related lessons together
              </p>
            </DialogHeader>
            <div className="py-6">
              <FormInput
                name="title"
                label="Folder Title"
                placeholder="e.g. Meditations"
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFolderDialogOpen(false)}
                className="h-11 rounded-lg font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={folderForm.handleSubmit((data) =>
                  createFolderMutation.mutate(data)
                )}
                className="bg-brand hover:bg-brand/90 h-11 px-8 rounded-lg font-bold shadow-lg shadow-brand/20"
                disabled={createFolderMutation.isPending}
              >
                Save Folder
              </Button>
            </DialogFooter>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <FormProvider {...lessonForm}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 leading-none mb-1">
                Quick Add Lesson
              </DialogTitle>
              <p className="text-xs font-bold text-gray-400 ">
                Add a new lesson to this section
              </p>
            </DialogHeader>
            <div className="py-6 space-y-5">
              <FormInput
                name="title"
                label="Lesson Title"
                placeholder="e.g. Introduction to Mindset"
                required
              />
              <FormTextarea
                name="description"
                label="Short Description"
                placeholder="Small summary..."
                className="min-h-[80px]"
              />
            </div>
            <DialogFooter>
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={lessonForm.handleSubmit((data) =>
                    createLessonMutation.mutate(data)
                  )}
                  className="bg-brand hover:bg-brand/90 h-11 w-full rounded-lg font-bold shadow-lg shadow-brand/20"
                  disabled={createLessonMutation.isPending}
                >
                  Add Lesson
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLessonDialogOpen(false)}
                  className="h-11 w-full rounded-lg font-bold"
                >
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
