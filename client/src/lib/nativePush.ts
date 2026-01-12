import { PushNotifications } from "@capacitor/push-notifications";
import { apiRequest } from "@/lib/queryClient";

export async function initializeNativePush() {
  const permStatus = await PushNotifications.requestPermissions();

  if (permStatus.receive !== "granted") {
    console.log("❌ Push permission not granted");
    return;
  }

  await PushNotifications.register();

  // 🔑 THIS IS THE IMPORTANT PART
  PushNotifications.addListener("registration", async (token) => {
    console.log("🔥 Native FCM token:", token.value);

    await apiRequest("POST", "/api/v1/notifications/register-device", {
      token: token.value,
      platform: "native",
    });
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ Push registration error", error);
  });

  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (notification) => {
      const eventId = notification.notification.data?.eventId;
      if (eventId) {
        window.location.href = `/events/${eventId}`;
      }
    }
  );
}
