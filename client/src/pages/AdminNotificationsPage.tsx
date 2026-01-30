import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bell, Send, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DeviceTokenStats {
  totalDevices: number;
  uniqueUsers: number;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<DeviceTokenStats>({
    queryKey: ["/admin/api/notifications/stats"],
  });

  // Debug: log stats query result
  console.log("[AdminNotifications] Stats:", {
    stats,
    isLoadingStats,
    statsError,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { title: string; body: string }) => {
      console.log("[AdminNotifications] Sending notification:", data);
      const response = await apiRequest(
        "POST",
        "/admin/api/notifications/test",
        data
      );
      const result = await response.json();
      console.log("[AdminNotifications] Send result:", result);
      return result;
    },
    onSuccess: (result) => {
      console.log("[AdminNotifications] Success:", result);
      toast({
        title: "Notification sent",
        description: `Successfully sent to ${
          result.successCount || 0
        } device(s)`,
      });
      setTitle("");
      setBody("");
    },
    onError: (error: any) => {
      console.error("[AdminNotifications] Error:", error);
      const message = error?.message || "Failed to send notification";
      toast({
        title: "Failed to send",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSendNotification = () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both title and message",
        variant: "destructive",
      });
      return;
    }
    sendMutation.mutate({ title, body });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-600 mt-2">
          Send notifications to all registered devices
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Registered Devices
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold text-gray-900"
              data-testid="text-total-devices"
            >
              {isLoadingStats
                ? "..."
                : statsError
                ? "Error"
                : stats?.totalDevices || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {statsError
                ? "Failed to load stats"
                : "Active push notification tokens"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unique Users
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold text-gray-900"
              data-testid="text-unique-users"
            >
              {isLoadingStats ? "..." : stats?.uniqueUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Users with notifications enabled
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Notification
          </CardTitle>
          <CardDescription>
            Send notification to all registered devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              placeholder="Enter notification title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-notification-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Enter notification message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              data-testid="input-notification-body"
            />
          </div>
          <Button
            onClick={handleSendNotification}
            disabled={sendMutation.isPending || !title.trim() || !body.trim()}
            className="bg-brand hover:bg-brand/90"
            data-testid="button-send-notification"
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
