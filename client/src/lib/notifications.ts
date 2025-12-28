import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const VAPID_KEY =
  "BMrLLVU6E1DhWCD8jqgFWyamRpSOXMMbtBgbXxa4qVqMO_sctWDVASLKOLJv_zXi3MzTslf2Mg9TfIVYKWDjrNI";

// Check if browser supports notifications
export function isNotificationsSupported(): boolean {
  return "Notification" in window;
}

// Fetch notification status from backend (DB source of truth)
export async function getNotificationStatus(): Promise<boolean> {
  try {
    const token = localStorage.getItem("@app:user_token");
    if (!token) return false;
    
    const response = await fetch("/api/v1/notifications/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.enabled === true;
  } catch (error) {
    console.error("Error fetching notification status:", error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("Notifications not supported in this browser");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("Notification permission denied");
    return false;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.log("Firebase messaging not supported");
    return false;
  }

  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return false;

    // console.log("FCM token obtained:", token.substring(0, 20) + "...");
    console.log("🔥 FCM TOKEN:", token);
    const registered = await registerDeviceToken(token);
    return registered;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return false;
  }
}

export async function registerDeviceToken(token: string): Promise<boolean> {
  try {
    await apiRequest("POST", "/api/v1/notifications/register-device", {
      token,
    });
    console.log("Device token registered successfully");
    return true;
  } catch (error) {
    console.error("Error registering device token:", error);
    return false;
  }
}

export async function initializePushNotifications(): Promise<boolean> {
  return requestNotificationPermission();
}

export async function unregisterDeviceTokens(): Promise<boolean> {
  try {
    await apiRequest("DELETE", "/api/v1/notifications/unregister-device", undefined);
    console.log("Device tokens unregistered successfully");
    return true;
  } catch (error) {
    console.error("Error unregistering device tokens:", error);
    return false;
  }
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
