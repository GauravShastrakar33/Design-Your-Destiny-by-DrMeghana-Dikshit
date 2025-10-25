import { ArrowLeft, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

const notifications = [
  {
    id: 1,
    title: "Welcome to Dr.M App! 🎉",
    message: "Start your wellness journey today with personalized practices.",
    time: "2 hours ago",
    read: false
  },
  {
    id: 2,
    title: "New Community Practice Session",
    message: "Join the 7:00 AM session tomorrow for guided meditation.",
    time: "5 hours ago",
    read: false
  },
  {
    id: 3,
    title: "Streak Achievement! 🔥",
    message: "You've maintained a 7-day streak. Keep it going!",
    time: "1 day ago",
    read: true
  },
  {
    id: 4,
    title: "New Articles Available",
    message: "Check out the latest wellness articles in your feed.",
    time: "2 days ago",
    read: true
  }
];

export default function NotificationsPage() {
  const [, setLocation] = useLocation();

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
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No Notifications
                </h2>
                <p className="text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 ${
                    !notification.read ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !notification.read ? "bg-primary" : "bg-transparent"
                    }`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time}
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
