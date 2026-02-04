import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Send, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { cn } from "@/lib/utils";

interface DeviceTokenStats {
  totalDevices: number;
  uniqueUsers: number;
}

const notificationSchema = yup.object().shape({
  title: yup
    .string()
    .required("Notification title is required")
    .min(3, "Title is too short"),
  body: yup
    .string()
    .required("Message is required")
    .min(5, "Message is too short"),
});

type NotificationFormData = yup.InferType<typeof notificationSchema>;

export default function AdminNotificationsPage() {
  const { toast } = useToast();

  const methods = useForm<NotificationFormData>({
    resolver: yupResolver(notificationSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<DeviceTokenStats>({
    queryKey: ["/admin/api/notifications/stats"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const response = await apiRequest(
        "POST",
        "/admin/api/notifications/test",
        data
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: `Notification successfully sent to ${
          result.successCount || 0
        } device(s)`,
      });
      methods.reset();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to send notification";
      toast({
        title: "Failed to send",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    sendMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900 leading-none">
              Push Notifications
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Send bulk notifications to all users with registered devices.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Stats Card 1 */}
          <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wide text-gray-600">
                  Registered Devices
                </span>
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-brand" />
                </div>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-2xl font-black text-gray-900"
                  data-testid="text-total-devices"
                >
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  ) : statsError ? (
                    <span className="text-red-500 text-lg">Error</span>
                  ) : (
                    (stats?.totalDevices || 0).toLocaleString()
                  )}
                </span>
                <span className="text-xs font-semibold text-gray-500 mt-1">
                  Active push notification tokens
                </span>
              </div>
            </div>
          </Card>

          {/* Stats Card 2 */}
          <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold tracking-wide text-gray-600">
                  Unique Users
                </span>
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-2xl font-black text-gray-900"
                  data-testid="text-unique-users"
                >
                  {isLoadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  ) : statsError ? (
                    <span className="text-red-500 text-lg">Error</span>
                  ) : (
                    (stats?.uniqueUsers || 0).toLocaleString()
                  )}
                </span>
                <span className="text-xs font-semibold text-gray-500 mt-1">
                  Users with enabled permissions
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Form Card */}
        <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-none">
                  Draft Notification
                </h2>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Compose and broadcast your message instantly.
                </p>
              </div>
            </div>

            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit)}
                className="space-y-6 max-w-2xl"
              >
                <FormInput
                  name="title"
                  label="Notification Title"
                  placeholder="e.g. New Masterclass Available!"
                  data-testid="input-notification-title"
                  required
                />

                <FormTextarea
                  name="body"
                  label="Message Content"
                  placeholder="Tell your users something inspiring..."
                  rows={4}
                  data-testid="input-notification-body"
                  required
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="bg-brand hover:bg-brand/90 font-bold text-xs h-11 px-8 rounded-lg shadow-md gap-2"
                    data-testid="button-send-notification"
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Broadcast...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </Card>
      </div>
    </div>
  );
}
