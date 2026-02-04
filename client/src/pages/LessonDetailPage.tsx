import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, useSearch } from "wouter";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Video,
  Music,
  FileType,
  Save,
  X,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsLesson, CmsLessonFile, CmsCourse } from "@shared/schema";

type LessonWithFiles = CmsLesson & { files: CmsLessonFile[] };
type CourseBasic = CmsCourse & { programCode?: string | null };

interface FileUploadState {
  file: File;
  fileType: "video" | "audio" | "script";
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
}

const lessonSchema = yup.object().shape({
  title: yup.string().required("Lesson title is required").trim(),
  description: yup.string().optional(),
});

type LessonFormData = yup.InferType<typeof lessonSchema>;

export default function LessonDetailPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId || "0");
  const lessonId = parseInt(params.lessonId || "0");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();

  const handleBack = () => {
    setLocation(`/admin/courses/${courseId}/edit?step=3`);
  };

  const form = useForm<LessonFormData>({
    resolver: yupResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const [uploadQueue, setUploadQueue] = useState<FileUploadState[]>([]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: lesson, isLoading } = useQuery<LessonWithFiles>({
    queryKey: ["/api/admin/v1/cms/lessons", lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/cms/lessons/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch lesson");
      return response.json();
    },
    enabled: !!lessonId,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<
    CmsLessonFile[]
  >({
    queryKey: ["/api/admin/v1/cms/files", lessonId],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/v1/cms/files?lessonId=${lessonId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json();
    },
    enabled: !!lessonId,
  });

  const { data: course } = useQuery<CourseBasic>({
    queryKey: ["/api/admin/v1/cms/courses", courseId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/cms/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch course");
      return response.json();
    },
    enabled: !!courseId,
  });

  useEffect(() => {
    if (lesson) {
      form.reset({
        title: lesson.title,
        description: lesson.description || "",
      });
    }
  }, [lesson, form]);

  const updateLessonMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/lessons/${lessonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/lessons", lessonId],
      });
      toast({ title: "Lesson updated" });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: () => {
      toast({ title: "Failed to update lesson", variant: "destructive" });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/admin/v1/cms/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/files", lessonId],
      });
      toast({ title: "File deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete file", variant: "destructive" });
    },
  });

  const getFileTypeFromMime = (
    mimeType: string
  ): "video" | "audio" | "script" | null => {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "script";
    return null;
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "video" | "audio" | "script"
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      const validType = getFileTypeFromMime(file.type);
      if (fileType === "video" && validType !== "video") {
        toast({ title: "Please select a video file", variant: "destructive" });
        continue;
      }
      if (fileType === "audio" && validType !== "audio") {
        toast({ title: "Please select an audio file", variant: "destructive" });
        continue;
      }
      if (fileType === "script" && file.type !== "application/pdf") {
        toast({ title: "Please select a PDF file", variant: "destructive" });
        continue;
      }

      const uploadState: FileUploadState = {
        file,
        fileType,
        progress: 0,
        status: "pending",
      };

      setUploadQueue((prev) => [...prev, uploadState]);

      uploadFile(uploadState);
    }

    e.target.value = "";
  };

  const uploadFile = async (uploadState: FileUploadState) => {
    try {
      if (!course?.programCode || !lesson?.moduleId) {
        toast({
          title: "Missing course or lesson data for upload",
          variant: "destructive",
        });
        setUploadQueue((prev) =>
          prev.map((u) =>
            u.file === uploadState.file ? { ...u, status: "error" as const } : u
          )
        );
        return;
      }

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.file === uploadState.file
            ? { ...u, status: "uploading" as const, progress: 10 }
            : u
        )
      );

      const uploadUrlResponse = await apiRequest(
        "POST",
        "/api/admin/v1/cms/files/get-upload-url",
        {
          filename: uploadState.file.name,
          contentType: uploadState.file.type,
          lessonId,
          fileType: uploadState.fileType,
          programCode: course.programCode,
          courseId,
          moduleId: lesson.moduleId,
        }
      );
      const { uploadUrl, key, publicUrl } = await uploadUrlResponse.json();

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.file === uploadState.file ? { ...u, progress: 30 } : u
        )
      );

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 60) + 30;
            setUploadQueue((prev) =>
              prev.map((u) =>
                u.file === uploadState.file ? { ...u, progress } : u
              )
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", uploadState.file.type);
        xhr.send(uploadState.file);
      });

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.file === uploadState.file ? { ...u, progress: 95 } : u
        )
      );

      await apiRequest("POST", "/api/admin/v1/cms/files/confirm", {
        lessonId,
        fileType: uploadState.fileType,
        r2Key: key,
        publicUrl,
        sizeMb: Math.round(uploadState.file.size / (1024 * 1024)),
      });

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.file === uploadState.file
            ? { ...u, status: "done" as const, progress: 100 }
            : u
        )
      );

      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/files", lessonId],
      });

      setTimeout(() => {
        setUploadQueue((prev) =>
          prev.filter((u) => u.file !== uploadState.file)
        );
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadQueue((prev) =>
        prev.map((u) =>
          u.file === uploadState.file ? { ...u, status: "error" as const } : u
        )
      );
      toast({ title: "Failed to upload file", variant: "destructive" });
    }
  };

  const cancelUpload = (uploadState: FileUploadState) => {
    setUploadQueue((prev) => prev.filter((u) => u.file !== uploadState.file));
  };

  const handleSave = form.handleSubmit((data) => {
    updateLessonMutation.mutate(data);
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return <Video className="w-5 h-5 text-blue-500" />;
      case "audio":
        return <Music className="w-5 h-5 text-green-500" />;
      case "script":
        return <FileType className="w-5 h-5 text-orange-500" />;
      default:
        return <FileType className="w-5 h-5 text-gray-500" />;
    }
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-500 hover:text-brand transition-colors bg-white shadow-sm border border-gray-100 h-9 px-3 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Curriculum
          </Button>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <h1 className="text-xl font-bold text-gray-900 leading-none">
                Edit Lesson
              </h1>
            </div>
            <p className="text-xs font-bold text-gray-400 tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" />
              {lesson?.title || "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={updateLessonMutation.isPending}
            className="bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20 font-bold rounded-lg h-10 px-6 transition-all"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Lesson
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <FormProvider {...form}>
            <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand" />
                  </div>
                  <h2 className="text-md font-bold text-gray-900">
                    Lesson Details
                  </h2>
                </div>

                <div className="space-y-5">
                  <FormInput
                    name="title"
                    label="Lesson Title"
                    placeholder="Enter lesson title"
                    required
                  />
                  <FormTextarea
                    name="description"
                    label="Description (Optional)"
                    placeholder="Describe what this lesson covers..."
                    className="min-h-[150px]"
                  />
                </div>
              </div>
            </Card>
          </FormProvider>

          <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Quick Tip</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Keep your lessons focused and concise. Attach relevant handouts
                or scripts help students follow along.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Side: Media & Files */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Lesson Assets
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-brand/10 text-brand border-none font-bold"
                >
                  {files.length} {files.length === 1 ? "File" : "Files"}{" "}
                  Attached
                </Badge>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Upload and manage files associated with this lesson.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                {
                  type: "video" as const,
                  label: "Video",
                  icon: Video,
                  color: "blue",
                  accept: "video/*",
                },
                {
                  type: "audio" as const,
                  label: "Audio",
                  icon: Music,
                  color: "green",
                  accept: "audio/*",
                },
                {
                  type: "script" as const,
                  label: "Script",
                  icon: FileType,
                  color: "orange",
                  accept: "application/pdf",
                },
              ].map((item) => (
                <div key={item.type} className="group relative">
                  <input
                    id={`file-${item.type}`}
                    type="file"
                    accept={item.accept}
                    onChange={(e) => handleFileSelect(e, item.type)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`file-${item.type}`}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer",
                      "bg-gray-50/30 border-gray-100 hover:border-brand/40 hover:bg-brand/[0.02]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                        item.color === "blue"
                          ? "bg-blue-50 text-blue-500"
                          : item.color === "green"
                          ? "bg-green-50 text-green-500"
                          : "bg-orange-50 text-orange-500"
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 tracking-widest font-bold">
                      Click to Upload
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploadQueue.length > 0 && (
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-brand animate-spin" />
                  <h4 className="text-sm font-bold text-gray-900">
                    Uploading Files...
                  </h4>
                </div>
                {uploadQueue.map((upload, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                      {getFileIcon(upload.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-700 truncate mr-4">
                          {upload.file.name}
                        </p>
                        <span className="text-[10px] font-bold text-brand">
                          {upload.progress}%
                        </span>
                      </div>
                      <Progress
                        value={upload.progress}
                        className="h-1.5 bg-gray-200"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelUpload(upload)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Files List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-4">
                Attached Materials
              </h4>
              {filesLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-500">
                    Retrieving files...
                  </p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-500 italic">
                    No files attached yet
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Upload media files to populate this list
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 transition-all flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {file.fileType.charAt(0).toUpperCase() +
                              file.fileType.slice(1)}{" "}
                            File
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 tracking-tighter">
                              {file.sizeMb
                                ? `${file.sizeMb} MB`
                                : "Size unknown"}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-[10px] font-bold text-green-600">
                              Ready
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.publicUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 rounded-lg text-xs font-bold bg-gray-100 hover:bg-brand hover:text-white transition-all shadow-none border-none"
                            onClick={() =>
                              window.open(file.publicUrl!, "_blank")
                            }
                          >
                            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFileMutation.mutate(file.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
