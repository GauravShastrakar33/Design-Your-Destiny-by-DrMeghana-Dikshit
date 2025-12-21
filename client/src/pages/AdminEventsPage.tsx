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

type EventWithSignedUrl = Event & { thumbnailSignedUrl?: string | null };

function getEventDisplayStatus(event: Event): "draft" | "upcoming" | "live" | "completed" | "cancelled" {
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
      return <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>;
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
  return event.status === "COMPLETED" && 
         event.recordingUrl === null && 
         event.showRecording === false &&
         !event.recordingSkipped;
}

export default function AdminEventsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [recordingDialogEvent, setRecordingDialogEvent] = useState<EventWithSignedUrl | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingPasscode, setRecordingPasscode] = useState("");
  const [recordingExpiryDate, setRecordingExpiryDate] = useState("");
  const [skipConfirmEvent, setSkipConfirmEvent] = useState<EventWithSignedUrl | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
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
    },
    onError: () => {
      toast({ title: "Failed to cancel event", variant: "destructive" });
    },
  });

  const skipRecordingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/v1/events/${id}/skip-recording`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
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
      setRecordingPasscode("");
      setRecordingExpiryDate("");
    },
    onError: () => {
      toast({ title: "Failed to add recording", variant: "destructive" });
    },
  });

  const handleCancel = (id: number) => {
    if (confirm("Are you sure you want to cancel this event?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleAddRecording = () => {
    if (!recordingDialogEvent) return;
    if (!recordingUrl || !recordingPasscode || !recordingExpiryDate) {
      toast({ title: "Please fill all recording fields", variant: "destructive" });
      return;
    }
    addRecordingMutation.mutate({
      id: recordingDialogEvent.id,
      data: {
        recordingUrl,
        recordingPasscode,
        recordingExpiryDate,
      },
    });
  };

  const upcomingEvents = allEvents.filter(
    (e) => e.status === "UPCOMING" && isAfter(new Date(e.endDatetime), new Date())
  );

  // Latest Events: Show COMPLETED only (never CANCELLED), hide expired recordings, hide skipped
  const latestEvents = allEvents.filter((e) => {
    // Only show COMPLETED events, never CANCELLED
    if (e.status !== "COMPLETED") return false;
    
    // Hide skipped events (they only appear in All Events)
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

  const eventsNeedingDecision = latestEvents.filter(needsRecordingDecision);
  
  // Events with recordings published (for display in Recent Events)
  const eventsWithRecordings = latestEvents.filter(
    (e) => e.showRecording === true && e.recordingUrl
  );

  const renderEventCard = (event: EventWithSignedUrl, showDecisionActions = false) => {
    const displayStatus = getEventDisplayStatus(event);
    const needsDecision = needsRecordingDecision(event);

    return (
      <Card key={event.id} className="p-4">
        <div className="flex gap-4">
          {event.thumbnailSignedUrl ? (
            <img
              src={event.thumbnailSignedUrl}
              alt={event.title}
              className="w-24 h-24 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{event.title}</h3>
                {event.coachName && (
                  <p className="text-sm text-muted-foreground">by {event.coachName}</p>
                )}
              </div>
              {getStatusBadge(displayStatus)}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.startDatetime), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(event.startDatetime), "h:mm a")}
              </span>
            </div>
            {event.requiredProgramCode && (
              <Badge variant="outline" className="mt-2">
                {event.requiredProgramCode}
              </Badge>
            )}
            {event.showRecording && event.recordingUrl && (
              <Badge variant="secondary" className="mt-2 ml-2">
                <Video className="w-3 h-3 mr-1" />
                {event.recordingExpiryDate 
                  ? `Recording available till ${format(new Date(event.recordingExpiryDate), "MMM d, yyyy")}`
                  : "Recording Available"
                }
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {showDecisionActions && needsDecision ? (
            <>
              {/* Decision pending: Only show Add Recording and Skip Recording */}
              <Button
                size="sm"
                onClick={() => setRecordingDialogEvent(event)}
                data-testid={`button-add-recording-${event.id}`}
              >
                <Video className="w-4 h-4 mr-1" />
                Add Recording
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSkipConfirmEvent(event)}
                data-testid={`button-skip-recording-${event.id}`}
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip Recording
              </Button>
            </>
          ) : showDecisionActions && event.showRecording && event.recordingUrl ? (
            // Recording published: No actions needed (already shows "Recording available till...")
            null
          ) : !showDecisionActions ? (
            <>
              {/* Standard actions for non-decision cards */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation(`/admin/events/${event.id}/edit`)}
                data-testid={`button-edit-event-${event.id}`}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              {event.joinUrl && event.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(event.joinUrl!, "_blank")}
                  data-testid={`button-join-event-${event.id}`}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Join Link
                </Button>
              )}
              {event.status !== "CANCELLED" && event.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancel(event.id)}
                  disabled={cancelMutation.isPending}
                  data-testid={`button-cancel-event-${event.id}`}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </>
          ) : null}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Event Calendar</h1>
        <Button
          onClick={() => setLocation("/admin/events/new")}
          data-testid="button-add-event"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="latest" data-testid="tab-latest">
            Latest
            {eventsNeedingDecision.length > 0 && (
              <Badge className="ml-2 bg-amber-500">{eventsNeedingDecision.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All Events ({allEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : upcomingEvents.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No upcoming events</p>
              <Button onClick={() => setLocation("/admin/events/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule an Event
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => renderEventCard(event))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="latest">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-6">
              {eventsNeedingDecision.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Needs Recording Decision
                  </h2>
                  <div className="space-y-4">
                    {eventsNeedingDecision.map((event) => renderEventCard(event, true))}
                  </div>
                </div>
              )}

              {eventsWithRecordings.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Recording Published</h2>
                  <div className="space-y-4">
                    {eventsWithRecordings.map((event) => renderEventCard(event, true))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : allEvents.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No events created yet</p>
              <Button onClick={() => setLocation("/admin/events/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {allEvents.map((event) => renderEventCard(event))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!recordingDialogEvent} onOpenChange={() => setRecordingDialogEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recording</DialogTitle>
            <DialogDescription>
              Add the recording details for "{recordingDialogEvent?.title}"
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
              <Label htmlFor="recordingPasscode">Passcode</Label>
              <Input
                id="recordingPasscode"
                value={recordingPasscode}
                onChange={(e) => setRecordingPasscode(e.target.value)}
                placeholder="Enter recording passcode"
                data-testid="input-recording-passcode"
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
            <Button variant="outline" onClick={() => setRecordingDialogEvent(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRecording}
              disabled={addRecordingMutation.isPending}
              data-testid="button-save-recording"
            >
              {addRecordingMutation.isPending ? "Saving..." : "Save Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Recording Confirmation Modal */}
      <Dialog open={!!skipConfirmEvent} onOpenChange={() => setSkipConfirmEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Skip Recording for this Event?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This event will not have a recording and will not appear in Latest for users.
              <br /><br />
              You can still add a recording later from All Events.
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
              {skipRecordingMutation.isPending ? "Skipping..." : "Skip Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
