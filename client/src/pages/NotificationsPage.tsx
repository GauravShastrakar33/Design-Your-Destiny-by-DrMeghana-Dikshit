import { ArrowLeft, Bell, Calendar, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { clearUnread } from "@/lib/notificationState";

interface InAppNotification {
  id: number;
  title: string;
  body: string;
  type: string;
  relatedEventId: number | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [, setLocation] = useLocation();

  // 🔵 CLEAR RED DOT WHEN PAGE OPENS
  useEffect(() => {
    clearUnread().then(() => {
      console.log("🔔 Unread notifications cleared");
    });
  }, []);

  const userToken = localStorage.getItem("@app:user_token");

  const { data: notifications = [], isLoading } = useQuery<InAppNotification[]>(
    {
      queryKey: ["/api/v1/notifications"],
      queryFn: async () => {
        if (!userToken) return [];
        const response = await fetch("/api/v1/notifications", {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await response.json();

        // 🔵 Sync unread count and last seen ID
        if (Array.isArray(data) && data.length > 0) {
          const { setLastSeenId } = await import("@/lib/notificationState");
          await setLastSeenId(data[0].id);
        }

        return data;
      },
      enabled: !!userToken,
    }
  );

  const handleNotificationClick = (notification: InAppNotification) => {
    // Deep link to event page if relatedEventId exists
    if (notification.relatedEventId) {
      setLocation(`/events/${notification.relatedEventId}`);
    } else if (notification.type === "drm_answer") {
      setLocation("/drm");
    } else {
      // For other notification types, navigate to home
      setLocation("/");
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event_reminder":
        return <Calendar className="w-5 h-5 text-[#703DFA]" />;
      default:
        return <Bell className="w-5 h-5 text-[#703DFA]" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title="Notifications"
          hasBackButton={true}
          onBack={() => setLocation("/")}
        />

        <div className="px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No Notifications
                </h2>
                <p className="text-muted-foreground">You're all caught up!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="p-4 cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
