import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapacitorApp } from "@capacitor/app";

createRoot(document.getElementById("root")!).render(<App />);

// 🔙 Handle Android hardware back button
if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener("backButton", ({ canGoBack }) => {
    // Check if we can go back in browser history
    if (window.history.length > 1 && canGoBack) {
      window.history.back();
    } else {
      // At root - minimize app instead of closing
      CapacitorApp.minimizeApp();
    }
  });
}

// 📱 Configure StatusBar for native platforms
if (Capacitor.isNativePlatform()) {
  (async () => {
    try {
      // Ensure content doesn't overlap with status bar
      await StatusBar.setOverlaysWebView({ overlay: false });
      // Set status bar style (light text for dark backgrounds)
      await StatusBar.setStyle({ style: Style.Light });
      // Set status bar background color to match app theme
      await StatusBar.setBackgroundColor({ color: "#703DFA" });
      console.log("✅ StatusBar configured successfully");
    } catch (e) {
      console.error("❌ StatusBar configuration failed", e);
    }
  })();
}

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
