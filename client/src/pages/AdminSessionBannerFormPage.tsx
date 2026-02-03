import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Calendar,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { SessionBanner } from "@shared/schema";

const sessionBannerSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(["session", "advertisement"])
    .required("Banner type is required"),
  thumbnailKey: yup.string().when("type", {
    is: "session",
    then: (schema) => schema.required("Session Banner image is required"),
    otherwise: (schema) => schema.nullable().optional(),
  }),
  videoKey: yup.string().when("type", {
    is: "advertisement",
    then: (schema) =>
      schema.required("Video is required for advertisement banners"),
    otherwise: (schema) => schema.nullable().optional(),
  }),
  posterKey: yup.string().nullable().optional(),
  ctaText: yup.string().nullable().optional(),
  ctaLink: yup.string().nullable().url("Invalid URL").optional(),
  startAt: yup.date().required("Banner start date is required"),
  endAt: yup
    .date()
    .required("Banner end date is required")
    .min(yup.ref("startAt"), "Banner end date must be after start date"),
  liveEnabled: yup.boolean().default(false),
  liveStartAt: yup
    .date()
    .when("liveEnabled", {
      is: true,
      then: (schema) => schema.required("Live start date is required"),
      otherwise: (schema) => schema.nullable().optional(),
    })
    .test(
      "within-window-start",
      "Live dates must be within visibility window",
      function (value) {
        const { liveEnabled, startAt } = this.parent;
        if (!liveEnabled || !value || !startAt) return true;
        return new Date(value) >= new Date(startAt);
      }
    ),
  liveEndAt: yup
    .date()
    .when("liveEnabled", {
      is: true,
      then: (schema) =>
        schema
          .required("Live end date is required")
          .min(
            yup.ref("liveStartAt"),
            "Live end date must be after Live start date"
          ),
      otherwise: (schema) => schema.nullable().optional(),
    })
    .test(
      "within-window-end",
      "Live dates must be within visibility window",
      function (value) {
        const { liveEnabled, endAt } = this.parent;
        if (!liveEnabled || !value || !endAt) return true;
        return new Date(value) <= new Date(endAt);
      }
    ),
});

type SessionBannerFormValues = yup.InferType<typeof sessionBannerSchema>;

export default function AdminSessionBannerFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEdit = !!params.id;

  const methods = useForm<SessionBannerFormValues>({
    resolver: yupResolver(sessionBannerSchema) as any,
    defaultValues: {
      type: "session",
      thumbnailKey: "",
      videoKey: "",
      posterKey: "",
      ctaText: "",
      ctaLink: "",
      startAt: undefined,
      endAt: undefined,
      liveEnabled: false,
      liveStartAt: undefined,
      liveEndAt: undefined,
    },
  });

  const {
    watch,
    setValue,
    reset,
    handleSubmit: handleSubmitRHF,
    control,
    formState: { errors },
  } = methods;
  const formType = watch("type");
  const liveEnabled = watch("liveEnabled");
  const thumbnailKey = watch("thumbnailKey");
  const videoKey = watch("videoKey");
  const posterKey = watch("posterKey");

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

  const { data: existingBanner, isLoading: isLoadingBanner } =
    useQuery<SessionBanner>({
      queryKey: ["/api/admin/v1/session-banners", params.id],
      queryFn: async () => {
        const response = await fetch(
          `/api/admin/v1/session-banners/${params.id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch banner");
        return response.json();
      },
      enabled: isEdit,
    });

  // Convert UTC date to local datetime-local format (YYYY-MM-DDTHH:MM)
  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    // Get local date/time components
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (existingBanner) {
      reset({
        type: existingBanner.type as "session" | "advertisement",
        thumbnailKey: existingBanner.thumbnailKey || "",
        videoKey: existingBanner.videoKey || "",
        posterKey: existingBanner.posterKey || "",
        ctaText: existingBanner.ctaText || "",
        ctaLink: existingBanner.ctaLink || "",
        startAt: existingBanner.startAt
          ? new Date(existingBanner.startAt)
          : undefined,
        endAt: existingBanner.endAt
          ? new Date(existingBanner.endAt)
          : undefined,
        liveEnabled: existingBanner.liveEnabled,
        liveStartAt: existingBanner.liveStartAt
          ? new Date(existingBanner.liveStartAt)
          : undefined,
        liveEndAt: existingBanner.liveEndAt
          ? new Date(existingBanner.liveEndAt)
          : undefined,
      });
    }
  }, [existingBanner, reset]);

  const minDate = formatDateForInput(new Date());

  const handleLiveToggleChange = (checked: boolean) => {
    setValue("liveEnabled", checked);
    if (!checked) {
      setValue("liveStartAt", undefined);
      setValue("liveEndAt", undefined);
    }
  };

  const uploadFile = async (
    file: File,
    type: "thumbnail" | "video" | "poster"
  ) => {
    setIsUploading(true);
    try {
      const urlRes = await fetch(
        `/api/admin/v1/session-banners/upload-url?filename=${encodeURIComponent(
          file.name
        )}&contentType=${encodeURIComponent(file.type)}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
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
        setValue("thumbnailKey", key, { shouldValidate: true });
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (type === "video") {
        setValue("videoKey", key, { shouldValidate: true });
        setVideoPreview(URL.createObjectURL(file));
      } else {
        setValue("posterKey", key, { shouldValidate: true });
        setPosterPreview(URL.createObjectURL(file));
      }

      toast({
        title: `${
          type === "thumbnail" ? "Banner" : type
        } uploaded successfully`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: `Failed to upload ${type}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "thumbnail" | "video" | "poster"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, type);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: SessionBannerFormValues) => {
      const response = await fetch("/api/admin/v1/session-banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...data,
          thumbnailKey: data.thumbnailKey || null,
          videoKey: data.videoKey || null,
          posterKey: data.posterKey || null,
          ctaText: data.ctaText || null,
          ctaLink: data.ctaLink || null,
          startAt: data.startAt.toISOString(),
          endAt: data.endAt.toISOString(),
          liveStartAt: data.liveStartAt ? data.liveStartAt.toISOString() : null,
          liveEndAt: data.liveEndAt ? data.liveEndAt.toISOString() : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to create banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/session-banners"],
      });
      toast({ title: "Banner created successfully" });
      setLocation("/admin/session-banner/banners");
    },
    onError: () => {
      toast({ title: "Failed to create banner", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SessionBannerFormValues) => {
      const response = await fetch(
        `/api/admin/v1/session-banners/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            ...data,
            thumbnailKey: data.thumbnailKey || null,
            videoKey: data.videoKey || null,
            posterKey: data.posterKey || null,
            ctaText: data.ctaText || null,
            ctaLink: data.ctaLink || null,
            startAt: data.startAt.toISOString(),
            endAt: data.endAt.toISOString(),
            liveStartAt: data.liveStartAt
              ? data.liveStartAt.toISOString()
              : null,
            liveEndAt: data.liveEndAt ? data.liveEndAt.toISOString() : null,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/session-banners"],
      });
      toast({ title: "Banner updated successfully" });
      setLocation("/admin/session-banner/banners");
    },
    onError: () => {
      toast({ title: "Failed to update banner", variant: "destructive" });
    },
  });

  const onSubmit = (data: SessionBannerFormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingBanner) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
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

      <Card className="p-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmitRHF(onSubmit)} className="space-y-6">
            {/* 1. Banner Type */}
            <FormSelect
              name="type"
              label="Banner Type"
              required
              options={[
                { label: "Session Banner", value: "session" },
                { label: "Advertisement Video", value: "advertisement" },
              ]}
              placeholder="Select type"
              data-testid="select-type"
            />

            {formType === "session" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Media Upload */}
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base">
                      Session Banner <span className="text-red-700">*</span>
                    </Label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "thumbnail")}
                      className="hidden"
                    />

                    {thumbnailKey || thumbnailPreview ? (
                      <div className="relative group w-full max-w-64 aspect-video rounded-xl overflow-hidden border-2 border-primary/20 bg-muted shadow-lg">
                        {thumbnailPreview ? (
                          <img
                            src={thumbnailPreview}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-primary/5">
                            <Upload className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">
                              Image Uploaded
                            </span>
                          </div>
                        )}

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-black"
                            onClick={() => thumbnailInputRef.current?.click()}
                          >
                            Change Image
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="w-8 h-8 rounded-full shadow-lg hvr-pop"
                            onClick={() => {
                              setValue("thumbnailKey", "", {
                                shouldValidate: true,
                              });
                              setThumbnailPreview(null);
                              if (thumbnailInputRef.current) {
                                thumbnailInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => thumbnailInputRef.current?.click()}
                        className={cn(
                          "w-full max-w-64 aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-primary/5 hover:border-primary/50",
                          errors.thumbnailKey
                            ? "border-destructive bg-destructive/5"
                            : "border-muted-foreground/20"
                        )}
                      >
                        <div className="p-2 bg-primary/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                          {isUploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          Click to upload banner
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 text-center px-4">
                          JPEG or PNG
                        </span>
                      </div>
                    )}
                    {errors.thumbnailKey && (
                      <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                        {errors.thumbnailKey.message?.toString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Visibility Schedule */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-xl border border-muted">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Start Date & Time{" "}
                        <span className="text-red-700">*</span>
                      </Label>
                      <Controller
                        name="startAt"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            className="bg-white"
                            date={field.value}
                            setDate={field.onChange}
                            minDate={new Date()}
                            placeholder="Set visibility start"
                            error={!!errors.startAt}
                          />
                        )}
                      />
                      {errors.startAt && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {errors.startAt.message?.toString()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        End Date & Time <span className="text-red-700">*</span>
                      </Label>
                      <Controller
                        name="endAt"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            className="bg-white"
                            date={field.value}
                            setDate={field.onChange}
                            minDate={watch("startAt") || new Date()}
                            placeholder="Set visibility end"
                            error={!!errors.endAt}
                          />
                        )}
                      />
                      {errors.endAt && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {errors.endAt.message?.toString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Live Section Integrated */}
                  <div
                    className={cn(
                      "p-6 rounded-xl border transition-all duration-300",
                      liveEnabled
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : "bg-muted/10 border-muted"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            liveEnabled
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <span className="font-bold tracking-tighter">
                            Live
                          </span>
                        </div>
                        <div>
                          <Label
                            htmlFor="liveEnabled"
                            className="text-base font-semibold cursor-pointer block"
                          >
                            Enable live broadcast
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Show live indicator during a specific window
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="liveEnabled"
                        checked={liveEnabled}
                        onCheckedChange={handleLiveToggleChange}
                        data-testid="switch-live-enabled"
                      />
                    </div>

                    {liveEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-primary/10 animate-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                          <Label className="text-sm">
                            Live Start Date & Time *
                          </Label>
                          <Controller
                            name="liveStartAt"
                            control={control}
                            render={({ field }) => (
                              <DateTimePicker
                                className="bg-white"
                                date={field.value || undefined}
                                setDate={field.onChange}
                                minDate={watch("startAt")}
                                maxDate={watch("endAt")}
                                placeholder="Start of stream"
                                error={!!errors.liveStartAt}
                              />
                            )}
                          />
                          {errors.liveStartAt && (
                            <p className="text-xs font-medium text-destructive mt-1">
                              {errors.liveStartAt.message?.toString()}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">
                            Live End Date & Time *
                          </Label>
                          <Controller
                            name="liveEndAt"
                            control={control}
                            render={({ field }) => (
                              <DateTimePicker
                                className="bg-white"
                                date={field.value || undefined}
                                setDate={field.onChange}
                                minDate={
                                  watch("liveStartAt") || watch("startAt")
                                }
                                maxDate={watch("endAt")}
                                placeholder="End of stream"
                                error={!!errors.liveEndAt}
                              />
                            )}
                          />
                          {errors.liveEndAt && (
                            <p className="text-xs font-medium text-destructive mt-1">
                              {errors.liveEndAt.message?.toString()}
                            </p>
                          )}
                        </div>
                        <p className="md:col-span-2 text-[11px] text-muted-foreground bg-primary/10 p-2 rounded flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-primary" />
                          Live timings must fall within the banner's visibility
                          window.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interaction Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      name="ctaText"
                      label="Button Text"
                      placeholder="Example: Join now"
                      data-testid="input-cta-text"
                    />
                    <FormInput
                      name="ctaLink"
                      label="Destination URL"
                      placeholder="Example: https://zoom.us/j/..."
                      data-testid="input-cta-link"
                    />
                  </div>
                </div>
              </div>
            )}

            {formType === "advertisement" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Video & Media */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Video Upload */}
                    <div className="space-y-3">
                      <Label className="text-base">
                        Video File <span className="text-red-700">*</span>
                      </Label>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileChange(e, "video")}
                        className="hidden"
                      />
                      {videoKey || videoPreview ? (
                        <div className="relative group w-full max-w-48 aspect-video rounded-xl overflow-hidden border-2 border-primary/20 bg-black shadow-lg">
                          {videoPreview ? (
                            <video
                              src={videoPreview}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              loop
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                              <Upload className="w-8 h-8 mb-2 opacity-50" />
                              <span className="text-sm font-medium">
                                Video Uploaded
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="bg-white/90 hover:bg-white text-black"
                              onClick={() => videoInputRef.current?.click()}
                            >
                              Change Video
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="w-8 h-8 rounded-full shadow-lg"
                              onClick={() => {
                                setValue("videoKey", "", {
                                  shouldValidate: true,
                                });
                                setVideoPreview(null);
                                if (videoInputRef.current) {
                                  videoInputRef.current.value = "";
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          className={cn(
                            "w-full max-w-xs aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-primary/5 hover:border-primary/50",
                            errors.videoKey
                              ? "border-destructive bg-destructive/5"
                              : "border-muted-foreground/20"
                          )}
                        >
                          <div className="p-4 bg-primary/5 rounded-full mb-3">
                            {isUploading ? (
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            ) : (
                              <Upload className="w-8 h-8 text-primary" />
                            )}
                          </div>
                          <span className="text-sm font-semibold">
                            Upload Video
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1 px-4 text-center">
                            MP4, WebM recommended
                          </span>
                        </div>
                      )}
                      {errors.videoKey && (
                        <p className="text-xs font-medium text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.videoKey.message?.toString()}
                        </p>
                      )}
                    </div>

                    {/* Poster Upload (Thumbnail for video) */}
                    <div className="space-y-3">
                      <Label className="text-base text-muted-foreground">
                        Poster Image (Optional)
                      </Label>
                      <input
                        ref={posterInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "poster")}
                        className="hidden"
                      />
                      {posterKey || posterPreview ? (
                        <div className="relative group w-full max-w-48 aspect-video rounded-xl overflow-hidden border-2 border-muted bg-muted shadow-sm">
                          {posterPreview ? (
                            <img
                              src={posterPreview}
                              alt="Poster"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                              <span className="text-sm font-medium">
                                Poster Uploaded
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="bg-white/90 hover:bg-white text-black"
                              onClick={() => posterInputRef.current?.click()}
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="w-8 h-8 rounded-full"
                              onClick={() => {
                                setValue("posterKey", "", {
                                  shouldValidate: true,
                                });
                                setPosterPreview(null);
                                if (posterInputRef.current) {
                                  posterInputRef.current.value = "";
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => posterInputRef.current?.click()}
                          className="w-full max-w-48 aspect-video rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-all"
                        >
                          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Upload Static Poster
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visibility Schedule */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-xl border border-muted">
                    <div className="space-y-2">
                      <Label>Start Date & Time *</Label>
                      <Controller
                        name="startAt"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            className="bg-white"
                            date={field.value}
                            setDate={field.onChange}
                            minDate={new Date()}
                            placeholder="Set start time"
                            error={!!errors.startAt}
                          />
                        )}
                      />
                      {errors.startAt && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {errors.startAt.message?.toString()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>End Date & Time *</Label>
                      <Controller
                        name="endAt"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            className="bg-white"
                            date={field.value}
                            setDate={field.onChange}
                            minDate={watch("startAt") || new Date()}
                            placeholder="Set end time"
                            error={!!errors.endAt}
                          />
                        )}
                      />
                      {errors.endAt && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {errors.endAt.message?.toString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Elements */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      name="ctaText"
                      label="Button Label"
                      placeholder="e.g., Learn More"
                      data-testid="input-cta-text"
                    />
                    <FormInput
                      name="ctaLink"
                      label="Destination Link"
                      placeholder="e.g., https://example.com"
                      data-testid="input-cta-link"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/session-banner/banners")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                data-testid="button-submit"
                className="bg-brand hover:bg-brand/90"
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEdit ? "Update Banner" : "Create Banner"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
