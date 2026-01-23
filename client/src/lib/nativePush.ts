import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiRequest } from "@/lib/queryClient";
import { setUnread } from "./notificationState";


// Check if we're running in a native Capacitor environment
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

// Check current permission status without requesting
export async function checkNativePermissionStatus(): Promise<"granted" | "denied" | "prompt"> {
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

// Request permission and register for push notifications
export async function requestNativePushPermission(): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log("Not a native platform, skipping native push");
    return false;
  }

  try {
    // Request permissions
    const permStatus = await PushNotifications.requestPermissions();
    console.log("📱 Permission request result:", permStatus.receive);

    if (permStatus.receive !== "granted") {
      console.log("❌ Push permission not granted");
      return false;
    }

    // After permission granted, check again to confirm
    const confirmedStatus = await PushNotifications.checkPermissions();
    console.log("📱 Confirmed permission status:", confirmedStatus.receive);

    if (confirmedStatus.receive !== "granted") {
      console.log("❌ Permission confirmation failed");
      return false;
    }

    // Register for push notifications - this triggers the 'registration' event
    await PushNotifications.register();
    console.log("📱 Push registration initiated");

    // Return true - the actual token registration happens in the listener
    return true;
  } catch (error) {
    console.error("❌ Error requesting native push permission:", error);
    return false;
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
    console.log("🔥 Native FCM token received:", token.value.substring(0, 20) + "...");

    try {
      await apiRequest("POST", "/api/v1/notifications/register-device", {
        token: token.value,
        platform: "native",
      });
      console.log("✅ Native FCM token registered with backend");
      
      // Dispatch custom event so ProfilePage can update its state
      window.dispatchEvent(new CustomEvent("nativePushRegistered", { detail: { success: true } }));
    } catch (error) {
      console.error("❌ Failed to register native token with backend:", error);
      window.dispatchEvent(new CustomEvent("nativePushRegistered", { detail: { success: false } }));
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ Push registration error:", error);
    window.dispatchEvent(new CustomEvent("nativePushRegistered", { detail: { success: false, error } }));
  });

  // Handle notification tap (deep linking)
  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (notification) => {
      console.log("📱 Notification tapped:", notification);
      const eventId = notification.notification.data?.eventId;
      if (eventId) {
        window.location.href = `/events/${eventId}`;
      }
      
      const questionId = notification.notification.data?.questionId;
      if (questionId) {
        window.location.href = `/dr-m/questions/${questionId}`;
      }
    }
  );

  // Handle foreground notifications
PushNotifications.addListener(
  "pushNotificationReceived",
  async (notification) => {
    console.log("📱 Foreground notification received:", notification);
    await setUnread(true);
  }
);


  console.log("📱 Native push listeners set up");
}

// Legacy function for backwards compatibility
export async function initializeNativePush() {
  setupNativePushListeners();
  
  // Check if already has permission
  const status = await checkNativePermissionStatus();
  if (status === "granted") {
    // Re-register to ensure token is fresh
    try {
      await PushNotifications.register();
      console.log("📱 Re-registered for push notifications");
    } catch (error) {
      console.error("Error re-registering:", error);
    }
  }
}
