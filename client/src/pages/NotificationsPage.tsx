import {
  ArrowLeft,
  Bell,
  Calendar,
  Loader2,
  MessageCircle,
  Info,
  X,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { clearUnread } from "@/lib/notificationState";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [selectedNotification, setSelectedNotification] =
    useState<InAppNotification | null>(null);

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
    if (notification.type === "admin_test") {
      setSelectedNotification(notification);
      return;
    }

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
        return <Calendar className="w-5 h-5 text-brand" />;
      case "drm_answer":
        return <MessageCircle className="w-5 h-5 text-emerald-500" />;
      case "admin_test":
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-brand" />;
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case "event_reminder":
        return {
          bg: "bg-brand/5",
          border: "border-brand/10",
          iconBg: "bg-white",
        };
      case "drm_answer":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          iconBg: "bg-white",
        };
      case "admin_test":
        return {
          bg: "bg-blue-50",
          border: "border-blue-100",
          iconBg: "bg-white",
        };
      default:
        return {
          bg: "bg-slate-50",
          border: "border-slate-100",
          iconBg: "bg-white",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24">
      <Header
        title="Notifications"
        hasBackButton={true}
        onBack={() => setLocation("/")}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
            <p className="text-sm font-medium text-slate-500">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              No Notifications
            </h2>
            <p className="text-slate-500 font-medium">You're all caught up!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notifications.map((notification, idx) => {
                const styles = getNotificationStyles(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`
                        p-4 cursor-pointer transition-all duration-300
                        ${styles.bg} border ${styles.border}
                        hover:shadow-lg hover:shadow-black/[0.03] hover:scale-[1.01]
                        active:scale-[0.99]
                      `}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`
                          flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                          ${styles.iconBg} shadow-sm border border-black/[0.02]
                        `}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <h3 className="font-bold text-slate-900 leading-tight pr-4 mb-1">
                            {notification.title}
                          </h3>
                          <p
                            className={`text-sm text-slate-500 leading-relaxed mb-2 ${
                              notification.type === "admin_test"
                                ? "line-clamp-2"
                                : ""
                            }`}
                          >
                            {notification.body}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider block">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Admin Notification Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl bg-white focus:outline-none">
          {selectedNotification &&
            (() => {
              const styles = getNotificationStyles(selectedNotification.type);
              return (
                <div className="flex flex-col">
                  <div className="p-6 pb-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${styles.bg} ${styles.border}`}
                      >
                        {getNotificationIcon(selectedNotification.type)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                          {selectedNotification.title}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 tracking-wide mt-1">
                          {formatTime(selectedNotification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-2 flex-1 overflow-y-auto max-h-[60vh]">
                    <div className="prose prose-sm prose-slate max-w-none">
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {selectedNotification.body}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-2">
                    <Button
                      onClick={() => setSelectedNotification(null)}
                      className="w-full bg-brand text-white font-bold rounded-lg text-base"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
