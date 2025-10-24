import { ArrowLeft, Users, Video } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PracticeSession {
  time: string;
  displayTime: string;
  participants: number;
}

const sessions: PracticeSession[] = [
  { time: "05:00", displayTime: "5:00 AM", participants: 12 },
  { time: "07:00", displayTime: "7:00 AM", participants: 24 },
  { time: "09:00", displayTime: "9:00 AM", participants: 18 },
  { time: "14:30", displayTime: "2:30 PM", participants: 15 },
  { time: "21:00", displayTime: "9:00 PM", participants: 32 },
];

export default function CommunityPracticesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleJoin = (time: string) => {
    toast({
      title: "Joining Session",
      description: `Connecting you to the ${time} practice session...`,
    });
  };

  const getCurrentStatus = (sessionTime: string) => {
    const now = new Date();
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const sessionDate = new Date();
    sessionDate.setHours(hours, minutes, 0, 0);
    
    const diffMinutes = Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < -30) {
      return { status: 'ended', label: 'Ended' };
    } else if (diffMinutes <= 0 && diffMinutes >= -30) {
      return { status: 'live', label: 'Live Now' };
    } else if (diffMinutes <= 15) {
      return { status: 'starting-soon', label: 'Starting Soon' };
    } else {
      return { status: 'upcoming', label: 'Upcoming' };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Community Practices</h1>
              <p className="text-sm text-muted-foreground">
                Join group sessions throughout the day
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Practice Together
                </h3>
                <p className="text-sm text-muted-foreground">
                  Join our community for guided group practices. Sessions run daily at scheduled times.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Today's Sessions
            </h2>
            {sessions.map((session) => {
              const { status, label } = getCurrentStatus(session.time);
              
              return (
                <Card
                  key={session.time}
                  className="p-4"
                  data-testid={`session-${session.time}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Video className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {session.displayTime}
                        </h3>
                        {status === 'live' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" />
                            {label}
                          </span>
                        )}
                        {status === 'starting-soon' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                            {label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{session.participants} members</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoin(session.displayTime)}
                      variant={status === 'live' ? 'default' : 'outline'}
                      size="default"
                      disabled={status === 'ended'}
                      data-testid={`button-join-${session.time}`}
                    >
                      {status === 'ended' ? 'Ended' : 'Join'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Sessions are open 30 minutes before and after scheduled time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
