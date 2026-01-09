import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

createRoot(document.getElementById("root")!).render(<App />);

// 🔔 Run ONLY on native platforms & AFTER bridge is ready
if (Capacitor.isNativePlatform()) {
  setTimeout(async () => {
    try {
      const permStatus = await PushNotifications.requestPermissions();
      console.log("🔔 Notification permission status:", permStatus);

      if (permStatus.receive === "granted") {
        await PushNotifications.register();
        console.log("✅ PushNotifications.register() called");
      } else {
        console.warn("❌ Push notification permission not granted");
      }

      PushNotifications.addListener("registration", token => {
        console.log("🔥 FCM TOKEN:", token.value);
      });

      PushNotifications.addListener("registrationError", err => {
        console.error("❌ Registration error:", err);
      });
    } catch (e) {
      console.error("❌ Push init failed", e);
    }
  }, 1000); // ⏱ critical delay
}
