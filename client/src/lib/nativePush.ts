import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
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
    console.log(
      "🔥 Native FCM token received:",
      token.value.substring(0, 20) + "...",
    );

    try {
      await apiRequest("POST", "/api/v1/notifications/register-device", {
        token: token.value,
        platform: "native",
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

  const isInitialized = localStorage.getItem("push_initialized") === "true";
  const isEnabled = localStorage.getItem("push_enabled") === "true";

  if (!isInitialized) {
    // First launch logic
    console.log("📱 First launch: Requesting push permissions...");
    try {
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === "granted") {
        console.log("✅ Permission granted on first launch");
        localStorage.setItem("push_enabled", "true");
        await PushNotifications.register();
      } else {
        console.log("❌ Permission denied on first launch");
        localStorage.setItem("push_enabled", "false");
      }
    } catch (error) {
      console.error("❌ Error during first launch push init:", error);
      localStorage.setItem("push_enabled", "false");
    }

    localStorage.setItem("push_initialized", "true");
  } else {
    // Subsequent launch logic
    console.log("📱 Subsequent launch: push_enabled =", isEnabled);
    if (isEnabled) {
      // Just register to ensure we have a fresh token. 
      // OS shouldn't prompt again if already granted.
      await PushNotifications.register();
    } else {
      try {
        await PushNotifications.unregister();
      } catch (e) {
        // Unregister might fail if not currently registered, which is fine
      }
    }
  }
}

/**
 * Toggle push notifications based on user choice
 */
export async function setPushEnabled(enabled: boolean) {
  if (!isNativePlatform()) return false;

  localStorage.setItem("push_enabled", enabled ? "true" : "false");

  if (enabled) {
    // If enabling, we might need to request permissions again if they haven't been granted
    const status = await checkNativePermissionStatus();
    if (status !== "granted") {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== "granted") {
        localStorage.setItem("push_enabled", "false");
        return false;
      }
    }
    await PushNotifications.register();
    console.log("📱 Push notifications enabled and registered");
  } else {
    // 1. Unregister from backend
    try {
      await apiRequest("DELETE", "/api/v1/notifications/unregister-device", undefined);
      console.log("✅ Device token unregistered from backend");
    } catch (error) {
      console.error("❌ Failed to unregister device from backend:", error);
    }

    // 2. Unregister from platform
    try {
      await PushNotifications.unregister();
      console.log("📱 Push notifications disabled and unregistered locally");
    } catch (error) {
      console.error("❌ Error unregistering push locally:", error);
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
