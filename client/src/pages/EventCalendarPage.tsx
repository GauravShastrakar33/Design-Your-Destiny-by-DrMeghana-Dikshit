import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Bell,
  Calendar,
  Clock,
  Video,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import type { Event } from "@shared/schema";
import { Header } from "@/components/Header";

type Tab = "upcoming" | "latest";

type EventWithSignedUrl = Event & {
  thumbnailSignedUrl?: string | null;
};

function CountdownTimer({ startTime }: { startTime: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Live Now!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span>{timeLeft}</span>;
}

export default function EventCalendarPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<EventWithSignedUrl | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-update current time every 30 seconds to check for live events (critical for mobile app)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const { data: upcomingEvents = [], isLoading: upcomingLoading } = useQuery<
    EventWithSignedUrl[]
  >({
    queryKey: ["/api/events/upcoming"],
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: latestEvents = [], isLoading: latestLoading } = useQuery<
    EventWithSignedUrl[]
  >({
    queryKey: ["/api/events/latest"],
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [match, params] = useRoute("/events/:id");

  // Handle deep link from notification
  useEffect(() => {
    if (match && params?.id) {
      const eventId = parseInt(params.id);
      if (!isNaN(eventId)) {
        const foundUpcoming = upcomingEvents.find((e) => e.id === eventId);
        const foundLatest = latestEvents.find((e) => e.id === eventId);
        const found = foundUpcoming || foundLatest;

        if (found) {
          setSelectedEvent(found);
          // Auto-switch tab if the event is in "latest" (recordings)
          if (!foundUpcoming && foundLatest) {
            setActiveTab("latest");
          }
        }
      }
    }
  }, [match, params?.id, upcomingEvents, latestEvents]);

  const tabs = [
    { id: "upcoming" as Tab, label: "Upcoming" },
    { id: "latest" as Tab, label: "Latest" },
  ];

  const handleJoin = (joinUrl: string) => {
    window.open(joinUrl, "_blank");
  };

  const handleCopyPasscode = (passcode: string) => {
    navigator.clipboard.writeText(passcode);
    toast({ title: "Passcode copied to clipboard" });
  };

  const handleOpenRecording = (event: EventWithSignedUrl) => {
    setSelectedEvent(event);
  };

  // Use currentTime state to check if event is live (auto-updates via timer)
  const isEventLive = useCallback(
    (event: EventWithSignedUrl): boolean => {
      const start = new Date(event.startDatetime);
      const end = new Date(event.endDatetime);
      return currentTime >= start && currentTime <= end;
    },
    [currentTime]
  );

  // Filter upcoming events client-side to hide ended events (in case backend hasn't updated yet)
  const visibleUpcomingEvents = upcomingEvents.filter(
    (event) => new Date(event.endDatetime) > currentTime
  );

  const eventsWithRecordings = latestEvents.filter(
    (event) => event.showRecording === true && event.recordingUrl
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Top Navigation */}
        <Header
          title="Event Calendar"
          rightContent={
            <>
              <button
                onClick={() => setLocation("/search")}
                className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
              </button>
              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
              </button>
            </>
          }
        >
          {/* Horizontal Tab Selector */}
          <div className="overflow-x-auto scrollbar-hide bg-white">
            <div className="flex gap-2 px-4 pb-3 pt-3 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                    ? "bg-[#703DFA] text-white"
                    : "bg-[#F3F0FF] text-gray-600 hover-elevate"
                    }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </Header>

        {/* Tab Content */}
        <div className="px-4 py-6">
          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <div className="space-y-5">
              {upcomingLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : visibleUpcomingEvents.length === 0 ? (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No upcoming events scheduled
                  </p>
                </Card>
              ) : (
                visibleUpcomingEvents.map((event) => {
                  const live = isEventLive(event);
                  return (
                    <div
                      key={event.id}
                      className="bg-white border border-[#232A34]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                      data-testid={`upcoming-event-${event.id}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-48">
                        {event.thumbnailSignedUrl ? (
                          <img
                            src={event.thumbnailSignedUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-white/60" />
                          </div>
                        )}
                        {/* LIVE Badge */}
                        {live && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                            LIVE
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="p-3 space-y-1.5">
                        {/* Calendar + Date and Start/End Times */}
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              className="w-4 h-4 text-[#703DFA]"
                              strokeWidth={2}
                            />
                            <span className="text-sm font-medium">
                              {format(
                                new Date(event.startDatetime),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            {format(
                              new Date(event.startDatetime),
                              "h:mm a"
                            )} - {format(new Date(event.endDatetime), "h:mm a")}
                          </span>
                        </div>

                        {/* Title and JOIN Button Row */}
                        <div className="flex items-start justify-between gap-2 pt-0.5">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-[#232A34] leading-tight">
                              {event.title}
                            </h3>
                            {event.coachName && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                by {event.coachName}
                              </p>
                            )}
                          </div>

                          {/* JOIN Button (only shown when event is live) */}
                          {live && event.joinUrl && (
                            <Button
                              onClick={() => handleJoin(event.joinUrl!)}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm whitespace-nowrap shrink-0"
                              data-testid={`button-join-${event.id}`}
                            >
                              JOIN
                            </Button>
                          )}
                        </div>

                        {/* Countdown for events that haven't started yet */}
                        {!live &&
                          new Date(event.startDatetime) > currentTime && (
                            <div className="text-xs text-muted-foreground">
                              Starts in{" "}
                              <CountdownTimer
                                startTime={new Date(event.startDatetime)}
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Latest Tab */}
          {activeTab === "latest" && (
            <div className="space-y-4">
              {latestLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : eventsWithRecordings.length === 0 ? (
                <Card className="p-8 text-center">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No recordings available yet
                  </p>
                </Card>
              ) : (
                eventsWithRecordings.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => handleOpenRecording(event)}
                    data-testid={`latest-event-${event.id}`}
                  >
                    <div className="relative h-48">
                      {event.thumbnailSignedUrl ? (
                        <img
                          src={event.thumbnailSignedUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                          <Video className="w-12 h-12 text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Video className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground flex-1">
                          {event.title}
                        </h3>
                        {event.recordingExpiryDate && (
                          <Badge className="bg-amber-500 text-white shrink-0 text-xs">
                            Expires{" "}
                            {format(
                              new Date(event.recordingExpiryDate),
                              "MMM d"
                            )}
                          </Badge>
                        )}
                      </div>
                      {event.coachName && (
                        <p className="text-sm text-muted-foreground mb-1">
                          by {event.coachName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.startDatetime), "MMM d, yyyy")}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recording Access Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Access Recording</DialogTitle>
            <DialogDescription>{selectedEvent?.title}</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Recording Passcode
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono font-bold tracking-wider">
                    {selectedEvent.recordingPasscode || "N/A"}
                  </span>
                  {selectedEvent.recordingPasscode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyPasscode(selectedEvent.recordingPasscode!)
                      }
                      data-testid="button-copy-passcode"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>

              {selectedEvent.recordingExpiryDate && (
                <div className="text-sm text-amber-600">
                  This recording expires on{" "}
                  {format(
                    new Date(selectedEvent.recordingExpiryDate),
                    "MMMM d, yyyy"
                  )}
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => {
                  if (selectedEvent.recordingUrl) {
                    window.open(selectedEvent.recordingUrl, "_blank");
                  }
                }}
                disabled={!selectedEvent.recordingUrl}
                data-testid="button-open-recording"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Recording
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
