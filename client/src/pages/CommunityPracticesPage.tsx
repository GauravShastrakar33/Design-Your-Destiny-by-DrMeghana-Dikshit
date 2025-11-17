import { ArrowLeft, Users, Video } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { CommunitySession } from "@shared/schema";

export default function CommunityPracticesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery<CommunitySession[]>({
    queryKey: ["/api/sessions"],
  });

  const handleJoin = (meetingLink: string, displayTime: string) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
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
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <Card className="bg-white border border-gray-200 p-8">
                <p className="text-center text-gray-500">No sessions scheduled yet</p>
              </Card>
            ) : (
              sessions.map((session) => {
                const { status, label } = getCurrentStatus(session.time);
                
                return (
                  <Card
                    key={session.id}
                    className="bg-white border border-gray-200 p-4"
                    data-testid={`session-${session.id}`}
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
                            {session.title}
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
                        <p className="text-sm text-gray-600 mb-1">{session.displayTime}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-3.5 h-3.5" />
                          <span>{session.participants} members</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleJoin(session.meetingLink, session.displayTime)}
                        variant={status === 'live' ? 'default' : 'outline'}
                        size="default"
                        disabled={status === 'ended'}
                        data-testid={`button-join-${session.id}`}
                      >
                        {status === 'ended' ? 'Ended' : 'Join'}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
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
