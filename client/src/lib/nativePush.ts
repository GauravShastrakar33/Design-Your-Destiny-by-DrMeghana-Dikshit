import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { apiRequest } from "@/lib/queryClient";
import { setUnread } from "./notificationState";
import { Preferences } from "@capacitor/preferences";

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

    // 💾 Always save the token for later sync
    await Preferences.set({ key: "@app:pending_fcm_token", value: tokenValue });
    await Preferences.set({ key: "@app:fcm_platform", value: platform });

    // 🚀 Only sync now if we are already authenticated
    const { value: hasToken } = await Preferences.get({ key: "@app:user_token" });
    if (hasToken) {
      await syncTokenWithBackend();
    } else {
      console.log("⏳ No user token found; deferring registration until login");
    }
  });

  // Handle registration errors
  PushNotifications.addListener("registrationError", (error: any) => {
    console.error("❌ Error on registration:", error);
    window.dispatchEvent(
      new CustomEvent("nativePushRegistered", { detail: { success: false } }),
    );
  });

  // Handle incoming push notification (fg/bg)
  PushNotifications.addListener("pushNotificationReceived", async (notification) => {
    console.log("Push received:", notification);
    const { fetchUnreadCount } = await import("./notificationState");
    await fetchUnreadCount();
  });

  // Handle push notification action (tap)
  PushNotifications.addListener("pushNotificationActionPerformed", async (notification) => {
    console.log("Push action performed:", JSON.stringify(notification));
    const data = notification.notification.data;

    // Mark as read
    if (data?.notificationId) {
      try {
        await apiRequest("PATCH", `/api/v1/notifications/${data.notificationId}/read`);
        const { fetchUnreadCount } = await import("./notificationState");
        await fetchUnreadCount();
      } catch (e) {
        console.error("Failed to mark notification read", e);
      }
    }

    // Navigate
    if (data?.url) {
      navigate(data.url);
    } else {
      navigate("/notifications");
    }
  });
}

/**
 * Synchronizes the locally stored FCM token with the backend.
 * Guaranteed to only run if a user token is present.
 */
export async function syncTokenWithBackend() {
  const { value: tokenValue } = await Preferences.get({ key: "@app:pending_fcm_token" });
  const { value: platform } = await Preferences.get({ key: "@app:fcm_platform" });
  const { value: userToken } = await Preferences.get({ key: "@app:user_token" });

  if (!tokenValue || !userToken) {
    return;
  }

  try {
    await apiRequest("POST", "/api/v1/notifications/register-device", {
      token: tokenValue,
      platform: platform || "native",
    });
    console.log("✅ Native FCM token synchronized with backend");

    window.dispatchEvent(
      new CustomEvent("nativePushRegistered", { detail: { success: true } }),
    );
  } catch (error) {
    console.error("❌ Failed to sync native token with backend:", error);
    window.dispatchEvent(
      new CustomEvent("nativePushRegistered", { detail: { success: false } }),
    );
  }
}

/**
 * Initialize Push Notifications according to requirements:
 * 1. On FIRST launch: Request OS permissions. If granted, enable and register.
 * 2. On SUBSEQUENT launches: Use saved user preference. Do not auto-request.
 * 
 * CRITICAL: This function is wrapped in try/catch to prevent Firebase errors
 * from blocking the app's UI rendering. The app should render even if push
 * notifications fail to initialize (e.g., network issues, Firebase unavailable).
 */
export async function initPushNotifications() {
  if (!isNativePlatform()) return;

  try {
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
      console.error("❌ Error during native push registration:", error);
      // Don't rethrow - let the app continue even if push fails
    }
  } catch (error) {
    // CRITICAL: Catch ALL errors to prevent blocking UI
    console.error("⚠️ Push notification initialization failed (non-blocking):", error);
    // App will continue to render normally
  }
}

/**
 * Enable push notifications - requests permissions and registers device
 * Note: Disabling is no longer supported; users should use system settings
 */
export async function setPushEnabled(enabled: boolean) {
  if (!isNativePlatform()) return false;

  if (enabled) {
    // Request permissions if not granted
    const status = await checkNativePermissionStatus();
    if (status !== "granted") {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== "granted") {
        return false;
      }
    }
    await PushNotifications.register();
    console.log("📱 Push notifications enabled and device registered");
    return true;
  } else {
    // Disabling is no longer supported via app - users should use system settings
    console.log("ℹ️ To disable notifications, please use your device's system settings");
    return false;
  }
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
