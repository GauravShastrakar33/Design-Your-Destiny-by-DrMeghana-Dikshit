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
    <div className="min-h-screen bg-page-bg pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="py-4 relative flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="absolute left-4 top-1/2 translate-y-[4px] hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase whitespace-nowrap">
              COMMUNITY PRACTICES
            </h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <Card className="bg-white border border-gray-200 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-brand mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Practice Together
                </h3>
                <p className="text-sm text-gray-600">
                  Join our community for guided group practices. Sessions run daily at scheduled times.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Today's Sessions
            </h2>
            {sessions.map((session) => {
              const { status, label } = getCurrentStatus(session.time);
              
              return (
                <Card
                  key={session.time}
                  className="bg-white border border-gray-200 p-4"
                  data-testid={`session-${session.time}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-brand/10 rounded-lg flex items-center justify-center">
                        <Video className="w-7 h-7 text-brand" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.displayTime}
                        </h3>
                        {status === 'live' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                            {label}
                          </span>
                        )}
                        {status === 'starting-soon' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                            {label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
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

          <Card className="mt-6 p-4 bg-white border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Sessions are open 30 minutes before and after scheduled time
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
