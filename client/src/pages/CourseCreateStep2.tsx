import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsCourse } from "@shared/schema";

type CourseWithSignedUrl = CmsCourse & { thumbnailSignedUrl?: string | null };

export default function CourseCreateStep2() {
  const params = useParams();
  const courseId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: course, isLoading } = useQuery<CourseWithSignedUrl>({
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

  const updateMutation = useMutation({
    mutationFn: async (data: { thumbnailKey?: string }) => {
      await apiRequest("PUT", `/api/admin/v1/cms/courses/${courseId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses"] });
    },
  });

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image must be less than 2MB", variant: "destructive" });
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
      const { uploadUrl, key, signedUrl } = await uploadUrlResponse.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      await updateMutation.mutateAsync({
        thumbnailKey: key,
      });

      setPreviewUrl(signedUrl);
      toast({ title: "Thumbnail uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload thumbnail", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [courseId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleContinue = () => {
    setLocation(`/admin/courses/create/step3/${courseId}`);
  };

  const handleSkip = () => {
    setLocation(`/admin/courses/create/step3/${courseId}`);
  };

  const displayUrl = previewUrl || course?.thumbnailSignedUrl;

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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-600 mt-1">Step 2: Upload Thumbnail</p>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full">1</span>
            <span className="text-gray-500">Basic Info</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="bg-brand text-white px-3 py-1 rounded-full font-medium">2</span>
            <span className="text-gray-900 font-medium">Thumbnail</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full">3</span>
            <span className="text-gray-500">Curriculum</span>
          </div>
        </div>

        <Card className="p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Course Thumbnail</h2>
          <p className="text-gray-600 text-sm mb-6">Add a thumbnail image for your course. This will be displayed in the course list.</p>

          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? "border-brand bg-brand/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {displayUrl ? (
                <div className="relative inline-block">
                  <img
                    src={displayUrl}
                    alt="Thumbnail preview"
                    className="max-w-full h-auto max-h-[200px] rounded-lg mx-auto"
                  />
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      updateMutation.mutate({ thumbnailKey: undefined });
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700"
                    data-testid="button-remove-thumbnail"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {uploading ? "Uploading..." : "Drag and drop your image here, or"}
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                      data-testid="input-thumbnail"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>Recommended specs:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Aspect ratio: 16:9</li>
                <li>Recommended size: 1024 x 576 pixels</li>
                <li>Formats: JPG or PNG</li>
                <li>Max size: 2 MB</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 mb-6">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm"
            data-testid="button-skip"
          >
            I don't have one - Skip for now
          </button>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(`/admin/courses/create/step1`)}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="bg-brand hover:bg-brand/90"
            data-testid="button-continue"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
