import { Users, Video, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { CommunitySession } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

// Format 24h time to 12h display format
const formatDisplayTime = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return time24; // fallback to raw time
  }

  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;
  const period = isPM ? "PM" : "AM";

  return `${displayHours}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
};


export default function CommunityPracticesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery<CommunitySession[]>({
    queryKey: ["/api/sessions"],
  });

  const handleJoin = (meetingLink: string, time: string, title: string) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
      const displayTime = formatDisplayTime(time);
      toast({
        title: "Opening Session",
        description: `Launching ${displayTime} practice session...`,
      });
    } else {
      toast({
        title: "Link unavailable",
        description: "Meeting link not set for this session",
        variant: "destructive",
      });
    }
  };

  const getCurrentStatus = (sessionTime: string) => {
    const now = new Date();
    // 1. Parse 24h time (HH:mm)
    const [hours, minutes] = sessionTime.split(":").map(Number);
    // Create session date for today
    let sessionDate = new Date();
    sessionDate.setHours(hours, minutes, 0, 0);
    // 2. Calculate time difference in minutes
    const diffMinutes = Math.floor(
      (sessionDate.getTime() - now.getTime()) / (1000 * 60),
    );
    // 3. Status Mapping with Midnight Reset
    // Sessions automatically reset to "Upcoming" at midnight (start of new day)
    if (diffMinutes > 15) {
      // More than 15 minutes before start
      return { status: "upcoming", label: "Upcoming" };
    } else if (diffMinutes > 0 && diffMinutes <= 15) {
      // 15 minutes before start - Join opens
      return { status: "starting-soon", label: "Starting Soon" };
    } else if (diffMinutes <= 0 && diffMinutes >= -120) {
      // From start time until 2 hours later - Session is live
      return { status: "live", label: "Live Now" };
    } else if (diffMinutes < -120) {
      // More than 2 hours after start - Session ended for today
      // Will naturally reset to "Upcoming" at midnight when new day starts
      return { status: "ended", label: "Ended" };
    } else {
      return { status: "upcoming", label: "Upcoming" };
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header
        title="Community Practices"
        hasBackButton={true}
        onBack={() => setLocation("/")}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Intro Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-transparent border-0 shadow-none overflow-hidden relative">
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1">
                <Users className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                Practice Together
              </h2>
              <p className="text-gray-700 text-sm max-w-md font-medium">
                Join our community for guided group practices. Sessions run
                daily at scheduled times.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Sessions List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border-gray-200 p-8 text-center"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No Sessions Yet
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Check back soon for upcoming community practice sessions.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sessions.map((session, idx) => {
                const { status, label } = getCurrentStatus(session.time);

                return (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="bg-white rounded-2xl shadow-lg shadow-black/[0.03] border-0 overflow-hidden group"
                      data-testid={`session-${session.id}`}
                    >
                      <div className="p-4 flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                            <Video className="w-7 h-7 text-brand" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900">
                              {session.title}
                            </h3>
                            {status === "live" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                {label}
                              </span>
                            )}
                            {status === "starting-soon" && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
                                {label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            {formatDisplayTime(session.time)}
                          </p>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() =>
                            handleJoin(session.meetingLink, session.time, session.title)
                          }
                          variant={status === "live" ? "default" : "outline"}
                          size="default"
                          disabled={status === "upcoming" || status === "ended"}
                          className={
                            status === "live"
                              ? "rounded-lg bg-brand hover:bg-brand/90 text-white font-bold shadow-lg shadow-brand/20"
                              : status === "starting-soon"
                              ? "rounded-lg font-bold border-amber-500 text-amber-600 hover:bg-amber-50"
                              : "rounded-lg font-bold border-gray-200 text-gray-600"
                          }
                          data-testid={`button-join-${session.id}`}
                        >
                          {status === "ended" ? "Ended" : status === "upcoming" ? "Upcoming" : "Join"}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/50 border-0 shadow-none p-4">
            <p className="text-xs text-gray-500 text-center font-medium">
              Sessions are open 15 minutes before scheduled time and stay live for 2 hours
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
