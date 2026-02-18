import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Bell,
  Calendar,
  Clock,
  Video,
  Copy,
  ExternalLink,
  ArrowUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Event } from "@shared/schema";
import { Header } from "@/components/Header";

type Tab = "upcoming" | "completed";

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

  return (
    <div className="flex items-center gap-1 bg-brand/5 px-2 py-0.5 rounded-full ring-1 ring-brand/10">
      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
      <span className="font-bold tabular-nums text-brand">{timeLeft}</span>
    </div>
  );
}

export default function EventCalendarPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<EventWithSignedUrl | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top visibility handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            setActiveTab("completed");
          }
        }
      }
    }
  }, [match, params?.id, upcomingEvents, latestEvents]);

  const tabs = [
    { id: "upcoming" as Tab, label: "Upcoming" },
    { id: "completed" as Tab, label: "Completed" },
  ];

  const handleJoin = (joinUrl: string) => {
    window.open(joinUrl, "_blank");
  };

  const handleCopyPasscode = (passcode: string) => {
    // Only copy the passcode part if it contains "Passcode: "
    const cleanPasscode = passcode.includes("Passcode: ")
      ? passcode.split("Passcode: ")[1].trim()
      : passcode.trim();

    navigator.clipboard.writeText(cleanPasscode);
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
    <div className="min-h-screen pb-24 bg-[#F8F9FB]">
      <Header title="Event Calendar" />

      <main className="max-w-3xl mx-auto p-4 pt-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as Tab)}
            className="w-full"
          >
            <TabsList
              className="
                w-full
                h-14
                grid grid-cols-2
                rounded-xl
                bg-white
                shadow-lg shadow-black/[0.03]
                p-1.5
                mb-4
              "
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="
                    h-full
                    rounded-lg
                    text-sm
                    font-bold
                    transition-all
                    data-[state=active]:bg-brand
                    data-[state=active]:text-white
                    data-[state=active]:shadow-lg
                    data-[state=active]:shadow-brand/20
                  "
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent
                  value="upcoming"
                  className="mt-0 focus-visible:outline-none"
                >
                  <div className="space-y-6">
                    {upcomingLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                        <p className="text-sm font-medium text-slate-500">
                          Discovering events...
                        </p>
                      </div>
                    ) : visibleUpcomingEvents.length === 0 ? (
                      <Card className="p-12 text-center bg-white border-0 shadow-sm rounded-2xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-900 font-bold mb-1">
                          No upcoming events
                        </p>
                        <p className="text-slate-500 text-sm">
                          Stay tuned for new events.
                        </p>
                      </Card>
                    ) : (
                      visibleUpcomingEvents.map((event, idx) => {
                        const live = isEventLive(event);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative bg-white rounded-2xl overflow-hidden shadow-md shadow-black/[0.03] border border-slate-100 hover:shadow-xl hover:shadow-brand/5 hover:border-brand/20 transition-all duration-300"
                            data-testid={`upcoming-event-${event.id}`}
                          >
                            {/* Thumbnail Container */}
                            <div className="relative h-56 overflow-hidden">
                              {event.thumbnailSignedUrl ? (
                                <img
                                  src={event.thumbnailSignedUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand/80 via-purple-400 to-indigo-500 flex items-center justify-center">
                                  <Calendar className="w-16 h-16 text-white/20" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                              {/* Top Badges */}
                              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                <div className="flex flex-col gap-2">
                                  {live ? (
                                    <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white tracking-widest uppercase shadow-lg ring-2 ring-red-500/20 w-fit animate-pulse">
                                      <span className="h-1.5 w-1.5 bg-white rounded-full "></span>
                                      LIVE NOW
                                    </div>
                                  ) : (
                                    <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg flex items-center gap-2 w-fit">
                                      <Clock className="w-3 h-3 text-brand" />
                                      <span className="text-xs font-bold text-slate-900 tracking-widest uppercase">
                                        Upcoming
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {!live &&
                                  new Date(event.startDatetime) >
                                    currentTime && (
                                    <div className="bg-white/90 backdrop-blur-md rounded-full shadow-lg self-start text-sm font-bold">
                                      <CountdownTimer
                                        startTime={
                                          new Date(event.startDatetime)
                                        }
                                      />
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Premium Content Section */}
                            <div className="p-3 space-y-2">
                              <div className="space-y-2">
                                {/* Date & Time Badges */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="px-2 py-1 bg-brand/5 rounded-full border border-brand/10 flex items-center gap-2 shadow-sm shadow-brand/5">
                                    <Calendar className="w-3 h-3 text-brand" />
                                    <span className="text-xs font-black text-brand uppercase tracking-wider tabular-nums">
                                      {format(
                                        new Date(event.startDatetime),
                                        "MMM d, yyyy"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs font-bold uppercase tracking-wider tabular-nums">
                                      {format(
                                        new Date(event.startDatetime),
                                        "h:mm a"
                                      )}{" "}
                                      -{" "}
                                      {format(
                                        new Date(event.endDatetime),
                                        "h:mm a"
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Title & Description */}
                                <div className="space-y-1">
                                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand transition-colors leading-tight tracking-tight">
                                    {event.title}
                                  </h3>
                                  {event.description && (
                                    <p className="text-sm text-slate-500">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Coach & Action Bar */}
                              <div className="pt-3 flex flex-col gap-4 border-t border-slate-100">
                                {event.coachName && (
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-400 tracking-widest leading-none">
                                        by
                                      </span>
                                      <span className="text-sm font-semibold text-slate-800 leading-none hover:text-brand transition-colors cursor-default">
                                        {event.coachName}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <Button
                                  onClick={() =>
                                    event.joinUrl && handleJoin(event.joinUrl)
                                  }
                                  // disabled={!live || !event.joinUrl}
                                  className="w-full bg-white text-brand font-semibold rounded-lg border border-brand hover:translate-y-[-2px] transition-all text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                                  data-testid={`button-join-${event.id}`}
                                >
                                  Register Now
                                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="completed"
                  className="mt-0 focus-visible:outline-none"
                >
                  <div className="grid gap-6">
                    {latestLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                      </div>
                    ) : eventsWithRecordings.length === 0 ? (
                      <Card className="p-12 text-center bg-white border-0 shadow-sm rounded-2xl flex flex-col items-center">
                        <Video className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-900 font-bold mb-1">
                          No recordings found
                        </p>
                        <p className="text-slate-500 text-sm">
                          Past sessions with recordings will appear here
                        </p>
                      </Card>
                    ) : (
                      eventsWithRecordings.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group bg-white rounded-2xl overflow-hidden shadow-md shadow-black/[0.03] border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                          onClick={() => handleOpenRecording(event)}
                          data-testid={`latest-event-${event.id}`}
                        >
                          <div className="relative h-52 overflow-hidden">
                            {event.thumbnailSignedUrl ? (
                              <img
                                src={event.thumbnailSignedUrl}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-brand/80 via-purple-400 to-indigo-500 flex items-center justify-center">
                                <Video className="w-16 h-16 text-brand/30" />
                              </div>
                            )}

                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Video className="w-8 h-8 text-white" />
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="absolute top-4 left-4">
                              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                                <Video className="w-3.5 h-3.5 text-white" />
                                <span className="text-xs font-black text-white tracking-widest uppercase">
                                  Recording
                                </span>
                              </div>
                            </div>

                            {event.recordingExpiryDate && (
                              <div className="absolute top-4 right-4">
                                <div className="bg-amber-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-white tracking-widest uppercase shadow-lg">
                                  EXPIRES{" "}
                                  {format(
                                    new Date(event.recordingExpiryDate),
                                    "MMM d"
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-3 space-y-2">
                            <div className="space-y-2">
                              {/* Date Badge */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="px-2 py-1 bg-brand/5 rounded-full border border-brand/10 flex items-center gap-2 shadow-sm shadow-brand/5">
                                  <Calendar className="w-3 h-3 text-brand" />
                                  <span className="text-xs font-black text-brand uppercase tracking-wider tabular-nums">
                                    {format(
                                      new Date(event.startDatetime),
                                      "MMM d, yyyy"
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Title & Description */}
                              <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand transition-colors leading-tight tracking-tight">
                                  {event.title}
                                </h3>
                                {event.description && (
                                  <p className="text-sm text-slate-500 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Coach & Action Bar */}
                            <div className="pt-3 flex flex-col gap-4 border-t border-slate-100">
                              {event.coachName && (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400 tracking-widest leading-none">
                                      by
                                    </span>
                                    <span className="text-sm font-semibold text-slate-800 leading-none hover:text-brand transition-colors cursor-default">
                                      {event.coachName}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <Button className="w-full font-semibold rounded-lg hover:translate-y-[-2px] transition-all text-xs uppercase tracking-wide bg-white text-brand border border-brand">
                                Watch Recording
                                <ExternalLink className="w-3.5 h-3.5 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>

      {/* Recording Access Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl bg-white focus:outline-none">
          {selectedEvent ? (
            <div className="flex flex-col">
              <div className="p-4 sm:p-6 pb-0 space-y-2">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/5 flex items-center justify-center mt-1">
                    <Video className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                      {selectedEvent?.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-1">
                      Access and watch the recorded session
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] sm:text-xs font-bold text-brand uppercase tracking-widest truncate">
                        Access Passcode
                      </h3>
                    </div>

                    {selectedEvent.recordingPasscode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCopyPasscode(selectedEvent.recordingPasscode!)
                        }
                        className="h-8 px-3 text-[10px] sm:text-xs font-bold text-brand uppercase tracking-wider hover:bg-brand/5 rounded-full transition-all shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5 text-brand" />
                        Copy Code
                      </Button>
                    )}
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-1 group-hover:border-brand/20 transition-all">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-[0.1em] font-mono break-all text-center">
                      {selectedEvent?.recordingPasscode?.includes("Passcode: ")
                        ? selectedEvent.recordingPasscode
                            .split("Passcode: ")[1]
                            .trim()
                        : selectedEvent?.recordingPasscode || "N/A"}
                    </span>
                  </div>
                </div>

                {selectedEvent.recordingExpiryDate && (
                  <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-amber-50/50 rounded-full w-fit mx-auto border border-amber-500/30">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-widest whitespace-nowrap">
                      Available until{" "}
                      {selectedEvent?.recordingExpiryDate
                        ? format(
                            new Date(selectedEvent.recordingExpiryDate),
                            "MMM d, yyyy"
                          )
                        : "N/A"}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full h-11 sm:h-12 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold shadow-lg shadow-brand/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm sm:text-base"
                  onClick={() => {
                    if (selectedEvent.recordingUrl) {
                      window.open(selectedEvent.recordingUrl, "_blank");
                    }
                  }}
                  disabled={!selectedEvent.recordingUrl}
                  data-testid="button-open-recording"
                >
                  Open Recording
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <p className="text-slate-500">No session selected.</p>
              <Button
                onClick={() => setSelectedEvent(null)}
                variant="ghost"
                className="text-brand"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
