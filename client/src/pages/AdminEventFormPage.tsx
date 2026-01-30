import { useEffect, useState } from "react";
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
import { ArrowLeft, Upload, ImageIcon, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Event, Program } from "@shared/schema";

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  coachName: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  startDatetime: z.string().min(1, "Start date/time is required"),
  endDatetime: z.string().min(1, "End date/time is required"),
  joinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  requiredProgramCode: z.string().min(1, "Program is required"),
  requiredProgramLevel: z.number().min(1),
  status: z.enum(["DRAFT", "UPCOMING", "COMPLETED", "CANCELLED"]),
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
      requiredProgramCode: "USB",
      requiredProgramLevel: 1,
      status: "DRAFT",
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

      form.reset({
        title: event.title,
        description: event.description || "",
        coachName: event.coachName || "",
        thumbnailUrl: event.thumbnailUrl || "",
        startDatetime: startDt.toISOString().slice(0, 16),
        endDatetime: endDt.toISOString().slice(0, 16),
        joinUrl: event.joinUrl || "",
        requiredProgramCode: event.requiredProgramCode || "USB",
        requiredProgramLevel: event.requiredProgramLevel || 1,
        status: event.status as any,
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
          startDatetime: new Date(data.startDatetime).toISOString(),
          endDatetime: new Date(data.endDatetime).toISOString(),
          joinUrl: data.joinUrl || null,
          requiredProgramCode: data.requiredProgramCode,
          requiredProgramLevel: data.requiredProgramLevel,
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
          startDatetime: new Date(data.startDatetime).toISOString(),
          endDatetime: new Date(data.endDatetime).toISOString(),
          joinUrl: data.joinUrl || null,
          requiredProgramCode: data.requiredProgramCode,
          requiredProgramLevel: data.requiredProgramLevel,
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
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => {
          const searchParams = new URLSearchParams(window.location.search);
          const tab = searchParams.get("tab");
          setLocation(tab ? `/admin/events?tab=${tab}` : "/admin/events");
        }}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Event" : "Create New Event"}
      </h1>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter event title"
                      data-testid="input-event-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter event description"
                      rows={4}
                      data-testid="input-event-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coachName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach / Host Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter coach or host name"
                      data-testid="input-coach-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {thumbnailPreview ? (
                  <div className="relative w-48 h-32">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={() => {
                        setThumbnailPreview(null);
                        form.setValue("thumbnailUrl", "");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors">
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
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Upload Thumbnail
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDatetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-start-datetime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDatetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-end-datetime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="joinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting / Join URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://zoom.us/j/..."
                      data-testid="input-join-url"
                    />
                  </FormControl>
                  <FormDescription>
                    The link users will click to join the live session
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiredProgramCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Program</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(code) => {
                      const program = programs.find((p) => p.code === code);
                      if (!program) return;
                      form.setValue("requiredProgramCode", program.code);
                      form.setValue("requiredProgramLevel", program.level);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-program">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...programs]
                        .sort((a, b) => b.level - a.level)
                        .map((program) => (
                          <SelectItem key={program.code} value={program.code}>
                            {program.code} — {program.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select minimum program level required to access this event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="UPCOMING">
                        Upcoming (Published)
                      </SelectItem>
                      {isEditing && (
                        <>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only "Upcoming" events are visible to users
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-brand hover:bg-brand/90"
                data-testid="button-save-event"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Event"
                  : "Create Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/events")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
