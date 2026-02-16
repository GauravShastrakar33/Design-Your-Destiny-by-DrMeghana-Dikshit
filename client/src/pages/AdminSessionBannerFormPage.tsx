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
      <div className="p-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
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

      <Card className="relative overflow-hidden p-8 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmitRHF(onSubmit)} className="space-y-5">
            {/* 1. Header & Type (Full Width) */}
            <div className="w-full">
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
                className="w-full"
              />
            </div>
            {formType === "session" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* 2. Media | Visibility Window Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Left: Media */}
                  <div className="lg:col-span-4 space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">
                      Banner Image <span className="text-red-700">*</span>
                    </Label>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "thumbnail")}
                      className="hidden"
                    />

                    {thumbnailKey || thumbnailPreview ? (
                      <div className="relative group w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                        {thumbnailPreview ? (
                          <img
                            src={thumbnailPreview}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <Upload className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">
                              Image Uploaded
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-black"
                            onClick={() => thumbnailInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="w-8 h-8 rounded-full shadow-lg"
                            onClick={() => {
                              setValue("thumbnailKey", "", {
                                shouldValidate: true,
                              });
                              setThumbnailPreview(null);
                              if (thumbnailInputRef.current)
                                thumbnailInputRef.current.value = "";
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
                          "w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:border-brand/40",
                          errors.thumbnailKey
                            ? "border-destructive bg-destructive/5"
                            : "border-gray-200"
                        )}
                      >
                        <div className="p-3 bg-brand/5 rounded-full mb-3">
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 text-brand animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6 text-brand" />
                          )}
                        </div>
                        <span className="text-sm font-semibold">
                          Click to upload
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1">
                          JPEG, PNG recommended
                        </span>
                      </div>
                    )}
                    {errors.thumbnailKey && (
                      <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                        {errors.thumbnailKey.message?.toString()}
                      </p>
                    )}
                  </div>

                  {/* Right: Visibility & Live */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Schedule Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-brand" />
                        <span className="text-sm font-semibold text-gray-500">
                          Visibility Window
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-500">
                            Start Date & Time *
                          </Label>
                          <Controller
                            name="startAt"
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <DateTimePicker
                                  className="bg-white border-gray-200"
                                  date={field.value}
                                  setDate={field.onChange}
                                  minDate={new Date()}
                                  placeholder="Start time"
                                  error={!!errors.startAt}
                                />
                                {errors.startAt && (
                                  <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                    {errors.startAt.message?.toString()}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-500">
                            End Date & Time *
                          </Label>
                          <Controller
                            name="endAt"
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <DateTimePicker
                                  className="bg-white border-gray-200"
                                  date={field.value}
                                  setDate={field.onChange}
                                  minDate={watch("startAt") || new Date()}
                                  placeholder="End time"
                                  error={!!errors.endAt}
                                />
                                {errors.endAt && (
                                  <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                    {errors.endAt.message?.toString()}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Broadcast Section */}
                    <div
                      className={cn(
                        "p-5 rounded-xl border transition-all duration-300",
                        liveEnabled
                          ? "bg-brand/[0.02] border-brand/20 shadow-sm"
                          : "bg-white border-gray-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors",
                              liveEnabled
                                ? "bg-red-500 text-white shadow-sm"
                                : "bg-gray-100 text-gray-400"
                            )}
                          >
                            Live
                          </div>
                          <div>
                            <Label
                              htmlFor="liveEnabled"
                              className="text-sm font-semibold cursor-pointer"
                            >
                              Enable live broadcast
                            </Label>
                            <p className="text-[11px] text-gray-400">
                              Show pulse indicator during a specific time
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="liveEnabled"
                          checked={liveEnabled}
                          onCheckedChange={handleLiveToggleChange}
                        />
                      </div>

                      {liveEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-brand/10 animate-in fade-in duration-300">
                          <div className="col-span-1 md:col-span-2 flex items-start gap-2 p-2 bg-brand/[0.03] rounded-lg border border-brand/10 mb-2">
                            <AlertCircle className="w-3.5 h-3.5 text-brand mt-0.5" />
                            <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                              Note: Live Start and End times must fall within
                              the "Visibility Window" defined above.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500">
                              Live Start *
                            </Label>
                            <Controller
                              name="liveStartAt"
                              control={control}
                              render={({ field }) => (
                                <div className="space-y-1">
                                  <DateTimePicker
                                    className="bg-white border-gray-200"
                                    date={field.value || undefined}
                                    setDate={field.onChange}
                                    minDate={watch("startAt")}
                                    maxDate={watch("endAt")}
                                    placeholder="Stream start"
                                    error={!!errors.liveStartAt}
                                  />
                                  {errors.liveStartAt && (
                                    <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                      {errors.liveStartAt.message?.toString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500">
                              Live End *
                            </Label>
                            <Controller
                              name="liveEndAt"
                              control={control}
                              render={({ field }) => (
                                <div className="space-y-1">
                                  <DateTimePicker
                                    className="bg-white border-gray-200"
                                    date={field.value || undefined}
                                    setDate={field.onChange}
                                    minDate={
                                      watch("liveStartAt") || watch("startAt")
                                    }
                                    maxDate={watch("endAt")}
                                    placeholder="Stream end"
                                    error={!!errors.liveEndAt}
                                  />
                                  {errors.liveEndAt && (
                                    <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                      {errors.liveEndAt.message?.toString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Call to Action (Section below) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-gray-500">
                      Action
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      name="ctaText"
                      label="Button text"
                      placeholder="e.g. Join Now"
                      data-testid="input-cta-text"
                    />
                    <FormInput
                      name="ctaLink"
                      label="Destination URL"
                      placeholder="e.g. https://..."
                      data-testid="input-cta-link"
                    />
                  </div>
                </div>
              </div>
            )}

            {formType === "advertisement" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* 2. Media | Timeline Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Left: Media */}
                  <div className="lg:col-span-12 flex flex-wrap gap-4 items-start">
                    {/* Video Upload */}
                    <div className="space-y-1 w-full max-w-[380px]">
                      <Label className="text-sm font-semibold text-gray-700">
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
                        <div className="relative group w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-lg shadow-black/10">
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
                              <Upload className="w-8 h-8 mb-2 opacity-30" />
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
                              Change
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
                                if (videoInputRef.current)
                                  videoInputRef.current.value = "";
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
                            "w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:border-brand/40",
                            errors.videoKey
                              ? "border-destructive bg-destructive/5"
                              : "border-gray-200"
                          )}
                        >
                          <div className="p-3 bg-brand/5 rounded-full mb-2">
                            {isUploading ? (
                              <Loader2 className="w-5 h-5 text-brand animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-brand" />
                            )}
                          </div>
                          <span className="text-sm font-semibold">
                            Upload Video
                          </span>
                          <span className="text-[11px] text-gray-400 mt-1">
                            MP4 recommended
                          </span>
                        </div>
                      )}
                      {errors.videoKey && (
                        <p className="text-xs font-medium text-destructive flex items-center gap-1">
                          {errors.videoKey.message?.toString()}
                        </p>
                      )}
                    </div>

                    {/* Poster Upload */}
                    <div className="space-y-1 w-full max-w-[380px]">
                      <Label className="text-sm font-semibold text-gray-700">
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
                        <div className="relative group w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                          {posterPreview ? (
                            <img
                              src={posterPreview}
                              alt="Poster"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
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
                              className="w-8 h-8 rounded-full shadow-lg"
                              onClick={() => {
                                setValue("posterKey", "", {
                                  shouldValidate: true,
                                });
                                setPosterPreview(null);
                                if (posterInputRef.current)
                                  posterInputRef.current.value = "";
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => posterInputRef.current?.click()}
                          className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand/40 transition-all"
                        >
                          <Upload className="w-5 h-5 text-gray-400 mb-2" />
                          <span className="text-xs font-semibold text-gray-500">
                            Static Poster
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Secondary Details Row (Full Width Timeline) */}
                  <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-1 gap-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand" />
                        <span className="text-sm font-semibold text-gray-500">
                          Timeline
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-500">
                            Start Date *
                          </Label>
                          <Controller
                            name="startAt"
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <DateTimePicker
                                  className="bg-white border-gray-200"
                                  date={field.value}
                                  setDate={field.onChange}
                                  minDate={new Date()}
                                  placeholder="Start"
                                  error={!!errors.startAt}
                                />
                                {errors.startAt && (
                                  <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                    {errors.startAt.message?.toString()}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-500">
                            End Date *
                          </Label>
                          <Controller
                            name="endAt"
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <DateTimePicker
                                  className="bg-white border-gray-200"
                                  date={field.value}
                                  setDate={field.onChange}
                                  minDate={watch("startAt") || new Date()}
                                  placeholder="End"
                                  error={!!errors.endAt}
                                />
                                {errors.endAt && (
                                  <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                    {errors.endAt.message?.toString()}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Call to Action (Section below) */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-gray-500">
                      Action
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      name="ctaText"
                      label="Label"
                      placeholder="Join Now"
                    />
                    <FormInput
                      name="ctaLink"
                      label="Link"
                      placeholder="https://..."
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
