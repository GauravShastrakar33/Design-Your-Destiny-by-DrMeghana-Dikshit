import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const VAPID_KEY = "BMrLLVU6E1DhWCD8jqgFWyamRpSOXMMbtBgbXxa4qVqMO_sctWDVASLKOLJv_zXi3MzTslf2Mg9TfIVYKWDjrNI";

export async function requestNotificationPermission(): Promise<string | null> {
  if (!("Notification" in window)) {
    console.log("Notifications not supported in this browser");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("Notification permission denied");
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.log("Firebase messaging not supported");
    return null;
  }

  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log("FCM token obtained:", token?.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export async function registerDeviceToken(token: string): Promise<boolean> {
  try {
    await apiRequest("POST", "/api/v1/notifications/register-device", { token });
    console.log("Device token registered successfully");
    return true;
  } catch (error) {
    console.error("Error registering device token:", error);
    return false;
  }
}

export async function initializePushNotifications(): Promise<boolean> {
  const token = await requestNotificationPermission();
  if (!token) return false;

  const registered = await registerDeviceToken(token);
  return registered;
}

export function setupForegroundNotifications() {
  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Foreground notification received:", payload);
        if (Notification.permission === "granted" && payload.notification) {
          new Notification(payload.notification.title || "Notification", {
            body: payload.notification.body,
            icon: "/icon-192.png",
          });
        }
      });
    }
  });
}
