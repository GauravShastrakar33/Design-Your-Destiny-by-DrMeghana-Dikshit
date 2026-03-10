import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Calendar,
  Clock,
  Video,
  XCircle,
  SkipForward,
  ExternalLink,
  AlertTriangle,
  Search,
  Users,
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format, isAfter, isBefore } from "date-fns";
import type { Event } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EventWithSignedUrl = Event & { thumbnailSignedUrl?: string | null };

function getEventDisplayStatus(
  event: Event
): "draft" | "upcoming" | "live" | "completed" | "cancelled" {
  if (event.status === "DRAFT") return "draft";
  if (event.status === "CANCELLED") return "cancelled";
  if (event.status === "COMPLETED") return "completed";

  const now = new Date();
  const start = new Date(event.startDatetime);
  const end = new Date(event.endDatetime);

  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "completed";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "live":
      return (
        <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>
      );
    case "upcoming":
      return <Badge className="bg-blue-500 text-white">Upcoming</Badge>;
    case "completed":
      return <Badge className="bg-green-500 text-white">Completed</Badge>;
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function needsRecordingDecision(event: Event): boolean {
  // Event needs decision if: COMPLETED, no recording URL, not showing recording, and NOT skipped
  // Note: recordingSkipped defaults to false, but handle null/undefined for safety
  return (
    event.status === "COMPLETED" &&
    event.recordingUrl === null &&
    event.showRecording === false &&
    !event.recordingSkipped
  );
}

export default function AdminEventsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["upcoming", "completed"].includes(tab)) {
      return tab;
    }
    if (tab === "latest") return "completed";
    return "upcoming";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [recordingDialogEvent, setRecordingDialogEvent] =
    useState<EventWithSignedUrl | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingExpiryDate, setRecordingExpiryDate] = useState("");
  const [skipConfirmEvent, setSkipConfirmEvent] =
    useState<EventWithSignedUrl | null>(null);
  const [removeConfirmEvent, setRemoveConfirmEvent] =
    useState<EventWithSignedUrl | null>(null);
  const [completedSubTab, setCompletedSubTab] = useState("decision");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (recordingDialogEvent) {
      setRecordingUrl(recordingDialogEvent.recordingUrl || "");
      setRecordingExpiryDate(
        recordingDialogEvent.recordingExpiryDate
          ? format(new Date(recordingDialogEvent.recordingExpiryDate), "yyyy-MM-dd")
          : ""
      );
    }
  }, [recordingDialogEvent]);

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
      return;
    }

    // Clean up the 'tab' query param after it's been used to set initial state
    const params = new URLSearchParams(window.location.search);
    if (params.has("tab")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: allEvents = [], isLoading } = useQuery<EventWithSignedUrl[]>({
    queryKey: ["/api/admin/v1/events"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/events", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/v1/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to cancel event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      toast({ title: "Event cancelled successfully" });
      setDeleteDialogOpen(false);
      setEventToDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to cancel event", variant: "destructive" });
    },
  });

  const skipRecordingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        `/api/admin/v1/events/${id}/skip-recording`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to skip recording");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/latest"] });
      toast({ title: "Recording skipped" });
      setSkipConfirmEvent(null);
    },
    onError: () => {
      toast({ title: "Failed to skip recording", variant: "destructive" });
    },
  });

  const addRecordingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/admin/v1/events/${id}/add-recording`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add recording");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/latest"] });
      toast({ title: "Recording added successfully" });
      setRecordingDialogEvent(null);
      setRecordingUrl("");
      setRecordingExpiryDate("");
    },
    onError: () => {
      toast({ title: "Failed to add recording", variant: "destructive" });
    },
  });

  const removeRecordingMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = `/api/admin/v1/events/${id}/remove-recording`;
      console.log(`[Admin] Initiating remove recording request: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "Failed to remove recording";
        try {
          const json = JSON.parse(text);
          errorMsg = json.details || json.error || errorMsg;
        } catch {
          errorMsg = `Server error (${response.status})`;
        }
        console.error(`[Admin] Remove recording failed:`, errorMsg);
        throw new Error(errorMsg);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/latest"] });
      toast({ title: "Recording removed successfully" });
      setRemoveConfirmEvent(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Remove Recording Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCancel = (id: number) => {
    setEventToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDeleteId) {
      cancelMutation.mutate(eventToDeleteId);
    }
  };

  const handleAddRecording = () => {
    if (!recordingDialogEvent) return;
    if (!recordingUrl || !recordingExpiryDate) {
      toast({
        title: "Please fill all recording fields",
        variant: "destructive",
      });
      return;
    }
    addRecordingMutation.mutate({
      id: recordingDialogEvent.id,
      data: {
        recordingUrl,
        recordingExpiryDate,
      },
    });
  };

  const filteredEvents = allEvents.filter((event) => {
    const searchMatch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.coachName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  const upcomingEvents = filteredEvents.filter(
    (e) =>
      e.status === "UPCOMING" && isAfter(new Date(e.endDatetime), new Date())
  );

  // Completed Events: Show COMPLETED only (never CANCELLED), hide expired recordings, hide skipped
  const completedEvents = filteredEvents.filter((e) => {
    // Only show COMPLETED events, never CANCELLED
    if (e.status !== "COMPLETED") return false;

    // Hide skipped events
    if (e.recordingSkipped) return false;

    // Hide events with expired recordings (but include events without expiry date or pending decision)
    if (e.recordingExpiryDate) {
      const expiryDate = new Date(e.recordingExpiryDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (expiryDate < now) return false;
    }

    return true;
  });

  const eventsNeedingDecision = completedEvents.filter(needsRecordingDecision);

  // Events with recordings published
  const eventsWithRecordings = completedEvents.filter(
    (e) => e.showRecording === true && e.recordingUrl
  );

  const renderEventCard = (
    event: EventWithSignedUrl,
    showDecisionActions = false
  ) => {
    const displayStatus = getEventDisplayStatus(event);
    const needsDecision = needsRecordingDecision(event);

    return (
      <Card
        key={event.id}
        className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-brand" />

        <div className="p-5 flex flex-col md:flex-row gap-5 flex-1">
          {/* Thumbnail */}
          <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex-shrink-0 relative">
            {event.thumbnailSignedUrl ? (
              <img
                src={event.thumbnailSignedUrl}
                alt={event.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-200" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge(displayStatus)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3
                  className="text-lg font-bold text-gray-900 leading-tight line-clamp-2"
                  title={event.title}
                >
                  {event.title}
                </h3>
                {event.coachName && (
                  <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium line-clamp-1">
                      {event.coachName}
                    </span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4">
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    <Calendar className="w-3.5 h-3.5 text-brand" />
                    <span className="text-xs font-bold leading-none">
                      {format(new Date(event.startDatetime), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span className="text-xs font-bold leading-none">
                      {format(new Date(event.startDatetime), "h:mm a")}
                    </span>
                  </div>
                  {event.requiredProgramCode && (
                    <Badge
                      variant="secondary"
                      className="bg-brand/5 text-brand border-brand/10 hover:bg-brand/10 font-black tracking-widest text-[10px]"
                    >
                      {event.requiredProgramCode}
                    </Badge>
                  )}
                </div>

                {event.showRecording && event.recordingUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black tracking-wide flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Recording Published
                    </div>
                    {event.recordingExpiryDate && (
                      <span className="text-[10px] font-bold text-gray-400">
                        Exp:{" "}
                        {format(
                          new Date(event.recordingExpiryDate),
                          "MMM d, yyyy"
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>

               {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                {showDecisionActions ? (
                  needsDecision ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setRecordingDialogEvent(event)}
                        className="bg-brand hover:bg-brand/90 font-bold"
                        data-testid={`button-add-recording-${event.id}`}
                      >
                        <Video className="w-4 h-4 mr-1.5" />
                        Add Recording
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSkipConfirmEvent(event)}
                        className="font-bold text-gray-600"
                        data-testid={`button-skip-recording-${event.id}`}
                      >
                        <SkipForward className="w-4 h-4 mr-1.5" />
                        Skip Recording
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecordingDialogEvent(event)}
                        className="bg-white border-gray-200 hover:border-brand hover:text-brand font-bold shadow-sm"
                        data-testid={`button-edit-recording-${event.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit recording
                      </Button>
                      {event.status === "COMPLETED" && event.recordingUrl && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRemoveConfirmEvent(event)}
                          disabled={removeRecordingMutation.isPending}
                          className="font-bold flex items-center gap-1.5"
                          data-testid={`button-remove-recording-${event.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Recording
                        </Button>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setLocation(
                          `/admin/events/${event.id}/edit?tab=${activeTab}`
                        )
                      }
                      className="bg-white border-gray-200 hover:border-brand hover:text-brand font-bold shadow-sm"
                      data-testid={`button-edit-event-${event.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    {event.joinUrl && event.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(event.joinUrl!, "_blank")}
                        className="bg-white border-gray-200 hover:bg-gray-50 font-bold shadow-sm"
                        data-testid={`button-join-event-${event.id}`}
                      >
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        Registration Link
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(event.id)}
                      disabled={cancelMutation.isPending}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                      data-testid={`button-cancel-event-${event.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-gray-900 leading-none"
            data-testid="text-page-title"
          >
            Events
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            Manage your live sessions, recordings, and event schedules.
          </p>
        </div>
        <Button
          onClick={() => setLocation(`/admin/events/new?tab=${activeTab}`)}
          className="bg-brand hover:bg-brand/90 font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2 w-fit"
          data-testid="button-add-event"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-8"
      >
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <TabsList className="bg-gray-100/80 p-1 w-full lg:w-auto">
            <TabsTrigger
              value="upcoming"
              className="font-bold px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
              data-testid="tab-upcoming"
            >
              Upcoming
              <Badge className="ml-2 bg-brand/10 text-brand border-none h-5 min-w-[20px] px-1 text-[10px] font-black rounded-full shadow-sm flex items-center justify-center">
                {upcomingEvents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="font-bold px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
              data-testid="tab-completed"
            >
              Completed
              {eventsNeedingDecision.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white border-none h-5 min-w-[20px] px-1 text-[10px] font-black rounded-full animate-pulse shadow-sm flex items-center justify-center">
                  {eventsNeedingDecision.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events, coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50/50 border-gray-200 rounded-lg focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>
        </div>

        <div className="w-full">
          <TabsContent
            value="upcoming"
            className="mt-0 focus-visible:outline-none focus-visible:ring-0"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-60">
                <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
                <p className="text-gray-500 font-bold">
                  Loading upcoming events...
                </p>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card className="p-20 text-center border border-slate-200 rounded-2xl bg-white">
                <Calendar className="w-16 h-16 mx-auto text-gray-200 mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No upcoming events
                </h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Stay on top of your schedule. Create a new event to get
                  started.
                </p>
                <Button
                  onClick={() => setLocation("/admin/events/new")}
                  className="bg-brand/10 text-brand hover:bg-brand/20 font-bold px-8"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule an Event
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {upcomingEvents.map((event) => renderEventCard(event))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="completed"
            className="mt-0 focus-visible:outline-none focus-visible:ring-0"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-60">
                <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
                <p className="text-gray-500 font-bold">
                  Loading completed events...
                </p>
              </div>
            ) : (
              <Tabs
                value={completedSubTab}
                onValueChange={setCompletedSubTab}
                className="w-full space-y-4"
              >
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  <div className="flex items-center gap-2 opacity-60">
                    <Video className="w-4 h-4 text-brand" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Recording Management
                    </h2>
                  </div>
                  <TabsList className="bg-gray-100/50 p-1.5 h-auto">
                    <TabsTrigger
                      value="decision"
                      className="text-sm font-bold px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl transition-all"
                    >
                      Needs Decision
                      {eventsNeedingDecision.length > 0 && (
                        <Badge className="ml-3 bg-amber-500 text-white border-none h-6 min-w-[24px] flex items-center justify-center px-1.5 text-xs font-black rounded-full shadow-sm">
                          {eventsNeedingDecision.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="published"
                      className="text-sm font-bold px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl transition-all"
                    >
                      Published
                      {eventsWithRecordings.length > 0 && (
                        <Badge className="ml-3 bg-blue-500 text-white border-none h-6 min-w-[24px] flex items-center justify-center px-1.5 text-xs font-black rounded-full shadow-sm">
                          {eventsWithRecordings.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="decision" className="mt-0 outline-none">
                  {eventsNeedingDecision.length === 0 ? (
                    <Card className="p-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                      <AlertTriangle className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        All caught up!
                      </h3>
                      <p className="text-sm text-gray-500">
                        No events are waiting for a recording decision.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {eventsNeedingDecision.map((event) =>
                        renderEventCard(event, true)
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="published" className="mt-0 outline-none">
                  {eventsWithRecordings.length === 0 ? (
                    <Card className="p-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                      <Video className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        No recordings yet
                      </h3>
                      <p className="text-sm text-gray-500">
                        Events with published recordings will appear here.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {eventsWithRecordings.map((event) =>
                        renderEventCard(event, true)
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <Dialog
        open={!!recordingDialogEvent}
        onOpenChange={() => setRecordingDialogEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {recordingDialogEvent?.showRecording
                ? "Edit Recording"
                : "Add Recording"}
            </DialogTitle>
            <DialogDescription>
              {recordingDialogEvent?.showRecording
                ? `Update recording details for "${recordingDialogEvent?.title}"`
                : `Add the recording details for "${recordingDialogEvent?.title}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recordingUrl">Recording URL</Label>
              <Input
                id="recordingUrl"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="https://zoom.us/rec/..."
                data-testid="input-recording-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordingExpiryDate">Expiry Date</Label>
              <Input
                id="recordingExpiryDate"
                type="date"
                value={recordingExpiryDate}
                onChange={(e) => setRecordingExpiryDate(e.target.value)}
                data-testid="input-recording-expiry"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordingDialogEvent(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRecording}
              disabled={addRecordingMutation.isPending}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-save-recording"
            >
              {addRecordingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : recordingDialogEvent?.showRecording ? (
                "Save Changes"
              ) : (
                "Add Recording"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Recording Confirmation Modal */}
      <Dialog
        open={!!skipConfirmEvent}
        onOpenChange={() => setSkipConfirmEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Skip Recording for this Event?
            </DialogTitle>
            <DialogDescription className="pt-2">
              The event will be marked as <strong>no recording</strong> and <strong>removed</strong> from the Events page.
              <br />
              <br />
              Users will not have access to a recording for this session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="default"
              onClick={() => setSkipConfirmEvent(null)}
              data-testid="button-skip-go-back"
            >
              Go Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (skipConfirmEvent) {
                  skipRecordingMutation.mutate(skipConfirmEvent.id);
                }
              }}
              disabled={skipRecordingMutation.isPending}
              data-testid="button-skip-confirm"
            >
              {skipRecordingMutation.isPending
                ? "Skipping..."
                : "Skip Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Recording Confirmation Modal */}
      <Dialog
        open={!!removeConfirmEvent}
        onOpenChange={() => setRemoveConfirmEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove Published Recording?
            </DialogTitle>
            <DialogDescription className="pt-2">
              The current recording will be removed from the user Event Calender page.
              <br />
              <br />
              This event will move back to <strong>Needs Decision</strong>, where you can publish a new recording once it becomes available or skip publishing it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="default"
              onClick={() => setRemoveConfirmEvent(null)}
              data-testid="button-remove-go-back"
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeConfirmEvent) {
                  removeRecordingMutation.mutate(removeConfirmEvent.id);
                }
              }}
              disabled={removeRecordingMutation.isPending}
              data-testid="button-remove-confirm"
            >
              {removeRecordingMutation.isPending
                ? "Removing..."
                : "Remove Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This event will be cancelled and users will no longer see it in
              the upcoming schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 font-bold"
              data-testid="button-confirm-delete"
            >
              {cancelMutation.isPending
                ? "Cancelling..."
                : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
