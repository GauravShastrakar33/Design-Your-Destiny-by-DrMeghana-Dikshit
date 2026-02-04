import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { apiRequest } from "@/lib/queryClient";
import { setUnread } from "./notificationState";

// SPA navigation helper for use outside React components
function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Check if we're running in a native Capacitor environment
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

async function getNativeFcmToken(): Promise<string | null> {
  try {
    const result = await FirebaseMessaging.getToken();
    return result?.token ?? null;
  } catch (error) {
    console.error("❌ Failed to get FCM token:", error);
    return null;
  }
}

// Check current permission status without requesting
export async function checkNativePermissionStatus(): Promise<
  "granted" | "denied" | "prompt"
> {
  if (!isNativePlatform()) {
    return "denied";
  }

  try {
    const status = await PushNotifications.checkPermissions();
    console.log("📱 Native permission status:", status.receive);
    return status.receive as "granted" | "denied" | "prompt";
  } catch (error) {
    console.error("Error checking native permissions:", error);
    return "denied";
  }
}

// Set up the registration listener - call this once on app init
let registrationListenerActive = false;

export function setupNativePushListeners() {
  if (!isNativePlatform() || registrationListenerActive) {
    return;
  }

  registrationListenerActive = true;

  // Handle successful registration - this is called after PushNotifications.register()
  PushNotifications.addListener("registration", async (token) => {
    const rawPlatform = Capacitor.getPlatform();
    const platform = rawPlatform === "ios" || rawPlatform === "android"
      ? rawPlatform
      : "native";
    let tokenValue = token.value;

    // iOS registration returns APNs token; fetch FCM token instead
    if (platform === "ios") {
      const fcmToken = await getNativeFcmToken();
      if (fcmToken) {
        tokenValue = fcmToken;
      } else {
        console.error("❌ iOS FCM token unavailable; skipping registration");
        window.dispatchEvent(
          new CustomEvent("nativePushRegistered", { detail: { success: false } }),
        );
        return;
      }
    }

    console.log(
      "🔥 Native push token received:",
      tokenValue.substring(0, 20) + "...",
    );

    try {
      await apiRequest("POST", "/api/v1/notifications/register-device", {
        token: tokenValue,
        platform,
      });
      console.log("✅ Native FCM token registered with backend");

      // Dispatch custom event so ProfilePage can update its state
      window.dispatchEvent(
        new CustomEvent("nativePushRegistered", { detail: { success: true } }),
      );
    } catch (error) {
      console.error("❌ Failed to register native token with backend:", error);
      window.dispatchEvent(
        new CustomEvent("nativePushRegistered", { detail: { success: false } }),
      );
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ Push registration error:", error);
    window.dispatchEvent(
      new CustomEvent("nativePushRegistered", {
        detail: { success: false, error },
      }),
    );
  });

  // Handle notification tap (deep linking)
  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (notification) => {
      console.log("📱 Notification tapped:", notification);
      const data = notification.notification.data;

      if (!data) return;

      if (data.eventId) {
        navigate(`/events/${data.eventId}`);
        return;
      }

      if (data.type === "admin_test") {
        navigate("/notifications");
        return;
      }

      if (data.type === "drm_answer") {
        navigate("/drm");
        return;
      }
    },
  );

  // Handle foreground notifications
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("📱 Foreground notification received:", notification);
    setUnread(true);
  });

  console.log("📱 Native push listeners set up");
}

/**
 * Initialize Push Notifications according to requirements:
 * 1. On FIRST launch: Request OS permissions. If granted, enable and register.
 * 2. On SUBSEQUENT launches: Use saved user preference. Do not auto-request.
 */
export async function initPushNotifications() {
  if (!isNativePlatform()) return;

  setupNativePushListeners();
  console.log("📱 Native push init: checking permissions...");
  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === "granted") {
      await PushNotifications.register();
      console.log("✅ Native push registered");
    } else {
      console.log("❌ Native push permission not granted");
    }
  } catch (error) {
    console.error("❌ Error during native push init:", error);
  }
}

/**
 * Toggle push notifications based on user choice
 */
export async function setPushEnabled(enabled: boolean) {
  if (!isNativePlatform()) return false;

  if (enabled) {
    // If enabling, we might need to request permissions again if they haven't been granted
    const status = await checkNativePermissionStatus();
    if (status !== "granted") {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== "granted") {
        return false;
      }
    }
    await PushNotifications.register();
    await apiRequest("POST", "/api/v1/notifications/push-enabled", {
      enabled: true,
    });
    console.log("📱 Push notifications enabled and registered");
  } else {
    try {
      await apiRequest("POST", "/api/v1/notifications/push-enabled", {
        enabled: false,
      });
      console.log("✅ Push preference disabled");
    } catch (error) {
      console.error("❌ Failed to update push preference:", error);
    }
  }
  return true;
}

// Keep for backwards compatibility if needed elsewhere
export async function initializeNativePush() {
  return initPushNotifications();
}

/**
 * @deprecated Use setPushEnabled(true) instead
 */
export async function requestNativePushPermission(): Promise<boolean> {
  return setPushEnabled(true);
}
