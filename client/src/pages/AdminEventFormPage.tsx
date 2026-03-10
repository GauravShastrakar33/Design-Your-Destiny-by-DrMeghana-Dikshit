import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  AlertCircle,
  Trash2,
  X,
  Video,
  Lock,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Event, Program } from "@shared/schema";
import { FormProvider, Controller } from "react-hook-form";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  coachName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  startDatetime: z.string().optional(),
  endDatetime: z.string().optional(),
  joinUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  requiredProgramCode: z.string().min(1, "Program is required"),
  requiredProgramLevel: z.number().min(1),
  status: z.enum(["UPCOMING", "COMPLETED", "CANCELLED"]),
  recordingUrl: z.string().optional(),
  recordingExpiryDate: z.string().optional(),
  showRecording: z.boolean().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function AdminEventFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const isEditing = !!params.id && params.id !== "new";
  const eventId = isEditing ? parseInt(params.id!) : null;

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [eventType, setEventType] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      coachName: "",
      thumbnailUrl: "",
      startDatetime: "",
      endDatetime: "",
      joinUrl: "",
      requiredProgramCode: "DYD",
      requiredProgramLevel: 1,
      status: "UPCOMING",
      recordingUrl: "",
      recordingExpiryDate: "",
      showRecording: false,
    },
  });

  const { data: event, isLoading: eventLoading } = useQuery<
    Event & { thumbnailSignedUrl?: string }
  >({
    queryKey: ["/api/admin/v1/events", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch event");
      return response.json();
    },
    enabled: isEditing && !!eventId,
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  useEffect(() => {
    if (event && isEditing) {
      const startDt = new Date(event.startDatetime);
      const endDt = new Date(event.endDatetime);

      // Determine event type based on status or presence of recording
      if (event.status === "COMPLETED") {
        setEventType("past");
      } else {
        setEventType("upcoming");
      }

      form.reset({
        title: event.title,
        description: event.description || "",
        coachName: event.coachName || "",
        thumbnailUrl: event.thumbnailUrl || "",
        startDatetime: format(startDt, "yyyy-MM-dd'T'HH:mm"),
        endDatetime: format(endDt, "yyyy-MM-dd'T'HH:mm"),
        joinUrl: event.joinUrl || "",
        requiredProgramCode: event.requiredProgramCode || "DYD",
        requiredProgramLevel: event.requiredProgramLevel || 1,
        status: event.status as any,
        recordingUrl: event.recordingUrl || "",
        recordingExpiryDate: event.recordingExpiryDate || "",
        showRecording: event.showRecording || false,
      });

      if (event.thumbnailSignedUrl) {
        setThumbnailPreview(event.thumbnailSignedUrl);
      }
    }
  }, [event, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await fetch("/api/admin/v1/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startDatetime: data.startDatetime ? new Date(data.startDatetime).toISOString() : new Date().toISOString(),
          endDatetime: data.endDatetime ? new Date(data.endDatetime).toISOString() : new Date().toISOString(),
          joinUrl: eventType === "upcoming" ? (data.joinUrl || null) : null,
          requiredProgramCode: data.requiredProgramCode,
          requiredProgramLevel: data.requiredProgramLevel,
          recordingUrl: eventType === "past" ? (data.recordingUrl || null) : (data.recordingUrl || null),
          recordingExpiryDate: eventType === "past" ? (data.recordingExpiryDate || null) : (data.recordingExpiryDate || null),
          showRecording: eventType === "past" ? true : (data.showRecording ?? false),
        }),
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/events"] });
      toast({ title: "Event created successfully" });
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get("tab");
      setLocation(tab ? `/admin/events?tab=${tab}` : "/admin/events");
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await fetch(`/api/admin/v1/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startDatetime: data.startDatetime ? new Date(data.startDatetime).toISOString() : new Date().toISOString(),
          endDatetime: data.endDatetime ? new Date(data.endDatetime).toISOString() : new Date().toISOString(),
          joinUrl: eventType === "upcoming" ? (data.joinUrl || null) : null,
          requiredProgramCode: data.requiredProgramCode,
          requiredProgramLevel: data.requiredProgramLevel,
          recordingUrl: eventType === "past" ? (data.recordingUrl || null) : (data.recordingUrl || null),
          recordingExpiryDate: eventType === "past" ? (data.recordingExpiryDate || null) : (data.recordingExpiryDate || null),
          showRecording: eventType === "past" ? true : (data.showRecording ?? false),
        }),
      });
      if (!response.ok) throw new Error("Failed to update event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/events"] });
      toast({ title: "Event updated successfully" });
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get("tab");
      setLocation(tab ? `/admin/events?tab=${tab}` : "/admin/events");
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
    },
  });

  const handleThumbnailUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/admin/v1/events/upload-url?filename=${encodeURIComponent(
          file.name
        )}&contentType=${encodeURIComponent(file.type)}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { key, signedUrl } = await response.json();

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      form.setValue("thumbnailUrl", key);
      setThumbnailPreview(URL.createObjectURL(file));
      toast({ title: "Thumbnail uploaded successfully" });
    } catch (error) {
      toast({ title: "Failed to upload thumbnail", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: EventFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && eventLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const searchParams = new URLSearchParams(window.location.search);
            const tab = searchParams.get("tab");
            setLocation(tab ? `/admin/events?tab=${tab}` : "/admin/events");
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Event" : "Create New Event"}
          </h1>
        </div>
      </div>

      <Card className="relative overflow-hidden p-0 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-brand z-10" />

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            {/* Top Section: Media & Basic Info */}
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Media Upload */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ImageIcon className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-gray-500">
                      Event Thumbnail
                    </span>
                  </div>

                  {form.watch("thumbnailUrl") || thumbnailPreview ? (
                    <div className="relative group w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                      {thumbnailPreview || form.watch("thumbnailUrl") ? (
                        <img
                          src={thumbnailPreview || form.watch("thumbnailUrl")}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Upload className="w-8 h-8 mb-2 opacity-30" />
                          <span className="text-sm font-medium">
                            Image Uploaded
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleThumbnailUpload(file);
                            }}
                          />
                          <div className="bg-white/90 hover:bg-white text-black px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Change
                          </div>
                        </label>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="w-9 h-9 rounded-xl shadow-lg"
                          onClick={() => {
                            setThumbnailPreview(null);
                            form.setValue("thumbnailUrl", "");
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      className={cn(
                        "w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:border-brand/40 group",
                        form.formState.errors.thumbnailUrl
                          ? "border-red-200 bg-red-50/30"
                          : "border-gray-200"
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(file);
                        }}
                        data-testid="input-thumbnail"
                      />
                      <div className="p-3 bg-brand/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 text-brand animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-brand" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        Upload Thumbnail
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                        JPEG, PNG recommended
                      </span>
                    </label>
                  )}
                  {form.formState.errors.thumbnailUrl && (
                    <p className="text-xs font-bold text-red-500 mt-1">
                      {form.formState.errors.thumbnailUrl.message}
                    </p>
                  )}
                </div>

                {/* Right: Basic Info */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-gray-500">
                      Basic Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-4">
                        <Button
                          type="button"
                          variant={eventType === "upcoming" ? "secondary" : "ghost"}
                          className={cn(
                            "rounded-lg px-4 h-9 text-xs font-bold transition-all",
                            eventType === "upcoming" ? "bg-white shadow-sm text-brand" : "text-slate-500 hover:text-slate-700"
                          )}
                          onClick={() => {
                            setEventType("upcoming");
                            form.setValue("status", "UPCOMING");
                          }}
                        >
                          <Calendar className="w-3.5 h-3.5 mr-2" />
                          Upcoming Event
                        </Button>
                        <Button
                          type="button"
                          variant={eventType === "past" ? "secondary" : "ghost"}
                          className={cn(
                            "rounded-lg px-4 h-9 text-xs font-bold transition-all",
                            eventType === "past" ? "bg-white shadow-sm text-brand" : "text-slate-500 hover:text-slate-700"
                          )}
                          onClick={() => {
                            setEventType("past");
                            form.setValue("status", "COMPLETED");
                            form.setValue("showRecording", true);
                          }}
                        >
                          <Video className="w-3.5 h-3.5 mr-2" />
                          Past Event (Publish Recording)
                        </Button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <FormInput
                        name="title"
                        label="Event Title"
                        placeholder="e.g. Masterclass on Wealth Creation"
                        required
                        data-testid="input-event-title"
                      />
                    </div>
                    <FormInput
                      name="coachName"
                      label="Coach / Host Name"
                      placeholder="e.g. Dr. Meghana Dikshit"
                      data-testid="input-coach-name"
                    />
                    <div className="md:col-span-2">
                      <FormTextarea
                        name="description"
                        label="Description"
                        placeholder="What will users learn during this session?"
                        rows={4}
                        data-testid="input-event-description"
                      />
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Middle Section: Schedule & Access */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-gray-100">
                {/* Left side: Schedule (Upcoming only) or Spacer (Past) */}
                <div className="lg:col-span-4">
                  {eventType === "upcoming" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-brand" />
                        <span className="text-sm font-semibold text-gray-500">
                          Schedule
                        </span>
                      </div>
  
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500 tracking-wider">
                            Start Date & Time
                          </Label>
                          <Controller
                            name="startDatetime"
                            control={form.control}
                            render={({ field }) => (
                              <DateTimePicker
                                date={
                                  field.value ? new Date(field.value) : undefined
                                }
                                setDate={(date) =>
                                  field.onChange(date?.toISOString() || "")
                                }
                                placeholder="Select start date"
                                error={!!form.formState.errors.startDatetime}
                              />
                            )}
                          />
                          {form.formState.errors.startDatetime && (
                            <p className="text-xs font-bold text-red-500 mt-1">
                              {form.formState.errors.startDatetime.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500 tracking-wider">
                            End Date & Time
                          </Label>
                          <Controller
                            name="endDatetime"
                            control={form.control}
                            render={({ field }) => (
                              <DateTimePicker
                                date={
                                  field.value ? new Date(field.value) : undefined
                                }
                                setDate={(date) =>
                                  field.onChange(date?.toISOString() || "")
                                }
                                minDate={
                                  form.watch("startDatetime")
                                    ? new Date(form.watch("startDatetime"))
                                    : undefined
                                }
                                placeholder="Select end date"
                                error={!!form.formState.errors.endDatetime}
                              />
                            )}
                          />
                          {form.formState.errors.endDatetime && (
                            <p className="text-xs font-bold text-red-500 mt-1">
                              {form.formState.errors.endDatetime.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
 
                {/* Right side: Access & Links */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-gray-500">
                      Access & Links
                    </span>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 max-w-md">
                        <Label className="text-sm font-semibold text-gray-700">
                          Required Program{" "}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          value="DYD — Design Your Destiny"
                          readOnly
                          className="bg-gray-100 cursor-not-allowed h-10"
                        />
                        <input type="hidden" {...form.register("requiredProgramCode")} />
                        <input type="hidden" {...form.register("requiredProgramLevel")} />
                        {form.formState.errors.requiredProgramCode && (
                          <p className="text-xs font-medium text-destructive">
                            {form.formState.errors.requiredProgramCode.message}
                          </p>
                        )}
                      </div>
                      
                      {eventType === "upcoming" && (
                        <div className="space-y-2 max-w-md animate-in fade-in slide-in-from-right-4 duration-500">
                          <Label className="text-sm font-semibold text-gray-700">
                            Registration Link
                            <span className="text-[10px] text-slate-400 font-bold ml-2 uppercase tracking-wider">
                              Optional
                            </span>
                          </Label>
                          <Input
                            {...form.register("joinUrl")}
                            placeholder="Registration link (leave empty if not open)"
                            className={cn(
                              "h-10",
                              form.formState.errors.joinUrl && "!border-destructive"
                            )}
                            data-testid="input-join-url"
                          />
                          {form.formState.errors.joinUrl && (
                            <p className="text-xs font-medium text-red-500">
                              {form.formState.errors.joinUrl.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      {eventType === "upcoming"
                        ? "Users will be able to register for this event if they belong to the selected program or higher. If you leave the link empty, users will see 'Registration Opening Soon'."
                        : "Past events are accessible to users in the selected program or higher for watching recordings."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recording Details Section - Show when status is COMPLETED OR eventType is past */}
              {(form.watch("status") === "COMPLETED" || eventType === "past") && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-brand" />
                      <span className="text-sm font-semibold text-gray-500">
                        Recording Details
                      </span>
                    </div>
                    <div className="space-y-4">
                      {eventType === "past" ? (
                        <div className="p-4 bg-brand/5 rounded-xl border border-brand/10">
                          <p className="text-xs font-bold text-brand">
                             Recording will be published immediately
                          </p>
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="showRecording"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50/50 border-gray-100 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-bold text-gray-900">
                                  Show Recording
                                </FormLabel>
                                <FormDescription className="text-xs font-medium text-gray-500">
                                  Make visible to users
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-show-recording"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <FormInput
                          name="recordingUrl"
                          label="Recording URL"
                          placeholder="e.g. https://zoom.us/rec/..."
                          data-testid="input-recording-url"
                          required={eventType === "past"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Recording Expiry Date {eventType === "past" && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                          type="date"
                          {...form.register("recordingExpiryDate")}
                          className="bg-white border-gray-200"
                          data-testid="input-recording-expiry"
                          required={eventType === "past"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Footer / Actions */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/admin/events")}
                className="font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2 w-fit border border-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand hover:bg-brand/90 font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2 w-fit"
                data-testid="button-save-event"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
