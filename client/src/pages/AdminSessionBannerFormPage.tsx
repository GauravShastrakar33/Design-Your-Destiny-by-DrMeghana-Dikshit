import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { SessionBanner } from "@shared/schema";

export default function AdminSessionBannerFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEdit = !!params.id;
  
  const [formData, setFormData] = useState({
    type: "session" as "session" | "advertisement",
    thumbnailKey: "",
    videoKey: "",
    posterKey: "",
    ctaText: "",
    ctaLink: "",
    startAt: "",
    endAt: "",
    liveEnabled: false,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: existingBanner, isLoading: isLoadingBanner } = useQuery<SessionBanner>({
    queryKey: ["/api/admin/v1/session-banners", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/session-banners/${params.id}`, {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch banner");
      return response.json();
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingBanner) {
      const formatDateForInput = (date: Date | string) => {
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };

      setFormData({
        type: existingBanner.type as "session" | "advertisement",
        thumbnailKey: existingBanner.thumbnailKey || "",
        videoKey: existingBanner.videoKey || "",
        posterKey: existingBanner.posterKey || "",
        ctaText: existingBanner.ctaText || "",
        ctaLink: existingBanner.ctaLink || "",
        startAt: formatDateForInput(existingBanner.startAt),
        endAt: formatDateForInput(existingBanner.endAt),
        liveEnabled: existingBanner.liveEnabled,
      });
    }
  }, [existingBanner]);

  const uploadFile = async (file: File, type: "thumbnail" | "video" | "poster") => {
    setIsUploading(true);
    try {
      const urlRes = await fetch(
        `/api/admin/v1/session-banners/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
        { headers: { "Authorization": `Bearer ${adminToken}` } }
      );
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { key, signedUrl } = await urlRes.json();

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      if (type === "thumbnail") {
        setFormData(prev => ({ ...prev, thumbnailKey: key }));
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (type === "video") {
        setFormData(prev => ({ ...prev, videoKey: key }));
        setVideoPreview(URL.createObjectURL(file));
      } else {
        setFormData(prev => ({ ...prev, posterKey: key }));
        setPosterPreview(URL.createObjectURL(file));
      }

      toast({ title: `${type} uploaded successfully` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: `Failed to upload ${type}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "video" | "poster") => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, type);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/v1/session-banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...data,
          thumbnailKey: data.thumbnailKey || null,
          videoKey: data.videoKey || null,
          posterKey: data.posterKey || null,
          ctaText: data.ctaText || null,
          ctaLink: data.ctaLink || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/session-banners"] });
      toast({ title: "Banner created successfully" });
      setLocation("/admin/session-banner/banners");
    },
    onError: () => {
      toast({ title: "Failed to create banner", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/admin/v1/session-banners/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...data,
          thumbnailKey: data.thumbnailKey || null,
          videoKey: data.videoKey || null,
          posterKey: data.posterKey || null,
          ctaText: data.ctaText || null,
          ctaLink: data.ctaLink || null,
        }),
      });
      if (!response.ok) throw new Error("Failed to update banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/session-banners"] });
      toast({ title: "Banner updated successfully" });
      setLocation("/admin/session-banner/banners");
    },
    onError: () => {
      toast({ title: "Failed to update banner", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startAt || !formData.endAt) {
      toast({ title: "Start and end dates are required", variant: "destructive" });
      return;
    }

    if (formData.type === "session" && !formData.thumbnailKey) {
      toast({ title: "Thumbnail is required for session banners", variant: "destructive" });
      return;
    }

    if (formData.type === "advertisement" && !formData.videoKey) {
      toast({ title: "Video is required for advertisement banners", variant: "destructive" });
      return;
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingBanner) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/admin/session-banner/banners")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Banner" : "Add New Banner"}
        </h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="type">Banner Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "session" | "advertisement") => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger data-testid="select-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">Session Thumbnail</SelectItem>
                <SelectItem value="advertisement">Advertisement Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "session" && (
            <>
              <div>
                <Label>Thumbnail Image</Label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "thumbnail")}
                  className="hidden"
                />
                {formData.thumbnailKey || thumbnailPreview ? (
                  <div className="mt-2 relative inline-block">
                    <div className="w-48 h-32 bg-muted rounded overflow-hidden">
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          Uploaded
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, thumbnailKey: "" }));
                        setThumbnailPreview(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-thumbnail"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Thumbnail
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="liveEnabled"
                  checked={formData.liveEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, liveEnabled: checked }))}
                  data-testid="switch-live-enabled"
                />
                <Label htmlFor="liveEnabled">Enable LIVE badge when session is active</Label>
              </div>
            </>
          )}

          {formData.type === "advertisement" && (
            <>
              <div>
                <Label>Video File</Label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, "video")}
                  className="hidden"
                />
                {formData.videoKey || videoPreview ? (
                  <div className="mt-2 relative inline-block">
                    <div className="w-48 h-32 bg-muted rounded overflow-hidden flex items-center justify-center">
                      {videoPreview ? (
                        <video src={videoPreview} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Video uploaded</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, videoKey: "" }));
                        setVideoPreview(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-video"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Video
                  </Button>
                )}
              </div>

              <div>
                <Label>Poster Image (optional)</Label>
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "poster")}
                  className="hidden"
                />
                {formData.posterKey || posterPreview ? (
                  <div className="mt-2 relative inline-block">
                    <div className="w-48 h-32 bg-muted rounded overflow-hidden">
                      {posterPreview ? (
                        <img src={posterPreview} alt="Poster" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          Uploaded
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, posterKey: "" }));
                        setPosterPreview(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => posterInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-poster"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Poster
                  </Button>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startAt">Start Date & Time</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                data-testid="input-start-at"
              />
            </div>
            <div>
              <Label htmlFor="endAt">End Date & Time</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                data-testid="input-end-at"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ctaText">CTA Text (optional)</Label>
            <Input
              id="ctaText"
              value={formData.ctaText}
              onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
              placeholder="e.g., Join Now"
              data-testid="input-cta-text"
            />
          </div>

          <div>
            <Label htmlFor="ctaLink">CTA Link (optional)</Label>
            <Input
              id="ctaLink"
              value={formData.ctaLink}
              onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
              placeholder="e.g., https://example.com/join"
              data-testid="input-cta-link"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/session-banner/banners")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading} data-testid="button-submit">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update Banner" : "Create Banner"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
