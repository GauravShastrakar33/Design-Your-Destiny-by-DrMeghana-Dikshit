import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Upload, Trash2, Video, Music, FileType, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsLesson, CmsLessonFile } from "@shared/schema";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminContentPanel from "@/components/AdminContentPanel";

type LessonWithFiles = CmsLesson & { files: CmsLessonFile[] };

interface FileUploadState {
  file: File;
  fileType: "video" | "audio" | "script";
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
}

export default function LessonDetailPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId || "0");
  const lessonId = parseInt(params.lessonId || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadQueue, setUploadQueue] = useState<FileUploadState[]>([]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: lesson, isLoading } = useQuery<LessonWithFiles>({
    queryKey: ["/api/admin/v1/cms/lessons", lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/cms/lessons/${lessonId}`, {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch lesson");
      return response.json();
    },
    enabled: !!lessonId,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<CmsLessonFile[]>({
    queryKey: ["/api/admin/v1/cms/files", lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/cms/files?lessonId=${lessonId}`, {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json();
    },
    enabled: !!lessonId,
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/lessons/${lessonId}`, data);
    },
    onSuccess: () => {
      toast({ title: "Lesson updated" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/files", lessonId] });
      toast({ title: "File deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete file", variant: "destructive" });
    },
  });

  const getFileTypeFromMime = (mimeType: string): "video" | "audio" | "script" | null => {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "script";
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fileType: "video" | "audio" | "script") => {
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

      setUploadQueue(prev => [...prev, uploadState]);
      
      uploadFile(uploadState);
    }

    e.target.value = "";
  };

  const uploadFile = async (uploadState: FileUploadState) => {
    try {
      setUploadQueue(prev => 
        prev.map(u => u.file === uploadState.file ? { ...u, status: "uploading" as const, progress: 10 } : u)
      );

      const uploadUrlResponse = await apiRequest("POST", "/api/admin/v1/cms/files/get-upload-url", {
        filename: uploadState.file.name,
        contentType: uploadState.file.type,
        lessonId,
        fileType: uploadState.fileType,
      });
      const { uploadUrl, key, publicUrl } = await uploadUrlResponse.json();

      setUploadQueue(prev => 
        prev.map(u => u.file === uploadState.file ? { ...u, progress: 30 } : u)
      );

      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 60) + 30;
            setUploadQueue(prev => 
              prev.map(u => u.file === uploadState.file ? { ...u, progress } : u)
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

      setUploadQueue(prev => 
        prev.map(u => u.file === uploadState.file ? { ...u, progress: 95 } : u)
      );

      await apiRequest("POST", "/api/admin/v1/cms/files/confirm", {
        lessonId,
        fileType: uploadState.fileType,
        r2Key: key,
        publicUrl,
        sizeMb: Math.round(uploadState.file.size / (1024 * 1024)),
      });

      setUploadQueue(prev => 
        prev.map(u => u.file === uploadState.file ? { ...u, status: "done" as const, progress: 100 } : u)
      );

      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/files", lessonId] });

      setTimeout(() => {
        setUploadQueue(prev => prev.filter(u => u.file !== uploadState.file));
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadQueue(prev => 
        prev.map(u => u.file === uploadState.file ? { ...u, status: "error" as const } : u)
      );
      toast({ title: "Failed to upload file", variant: "destructive" });
    }
  };

  const cancelUpload = (uploadState: FileUploadState) => {
    setUploadQueue(prev => prev.filter(u => u.file !== uploadState.file));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    updateLessonMutation.mutate({ title, description });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return <Video className="w-5 h-5 text-blue-400" />;
      case "audio":
        return <Music className="w-5 h-5 text-green-400" />;
      case "script":
        return <FileType className="w-5 h-5 text-orange-400" />;
      default:
        return <FileType className="w-5 h-5 text-gray-400" />;
    }
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

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Edit Lesson" />
        <AdminContentPanel>
          <div className="max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setLocation(`/admin/courses/${courseId}`)}
              className="border-gray-700 text-gray-300 mb-6"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>

            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Title</Label>
                  <Input
                    value={title || lesson?.title || ""}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter lesson title"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Description (Optional)</Label>
                  <Textarea
                    value={description || lesson?.description || ""}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter lesson description"
                    className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[80px]"
                    data-testid="input-description"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={updateLessonMutation.isPending}
                  className="bg-brand hover:bg-brand/90"
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Lesson Files</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload video, audio, or PDF script files for this lesson.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <Video className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300 mb-3">Video</p>
                    <label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileSelect(e, "video")}
                        className="hidden"
                        data-testid="input-video"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300"
                        asChild
                      >
                        <span>
                          <Upload className="w-3 h-3 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>

                  <div className="border border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                    <Music className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300 mb-3">Audio</p>
                    <label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileSelect(e, "audio")}
                        className="hidden"
                        data-testid="input-audio"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300"
                        asChild
                      >
                        <span>
                          <Upload className="w-3 h-3 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>

                  <div className="border border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                    <FileType className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300 mb-3">Script (PDF)</p>
                    <label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileSelect(e, "script")}
                        className="hidden"
                        data-testid="input-script"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300"
                        asChild
                      >
                        <span>
                          <Upload className="w-3 h-3 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {uploadQueue.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Uploading...</h4>
                    {uploadQueue.map((upload, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        {getFileIcon(upload.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{upload.file.name}</p>
                          <Progress value={upload.progress} className="h-1 mt-1" />
                        </div>
                        {upload.status === "error" && (
                          <span className="text-xs text-red-400">Failed</span>
                        )}
                        {upload.status === "done" && (
                          <span className="text-xs text-green-400">Done</span>
                        )}
                        {upload.status !== "done" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => cancelUpload(upload)}
                            className="text-gray-400 hover:text-red-500 h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {filesLoading ? (
                  <div className="text-center py-4 text-gray-400">Loading files...</div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No files uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Uploaded Files</h4>
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.fileType)}
                          <div>
                            <p className="text-sm text-white">
                              {file.fileType.charAt(0).toUpperCase() + file.fileType.slice(1)} File
                            </p>
                            <p className="text-xs text-gray-400">
                              {file.sizeMb ? `${file.sizeMb} MB` : "Size unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.publicUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.publicUrl!, "_blank")}
                              className="border-gray-700 text-gray-300"
                            >
                              View
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFileMutation.mutate(file.id)}
                            className="text-gray-400 hover:text-red-500"
                            data-testid={`button-delete-file-${file.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminContentPanel>
      </div>
    </div>
  );
}
