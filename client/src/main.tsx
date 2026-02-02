import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Capacitor } from "@capacitor/core";

createRoot(document.getElementById("root")!).render(<App />);

if (Capacitor.isNativePlatform()) {
  // Dynamically load native plugins ONLY on mobile
  (async () => {
    const { App: CapacitorApp } = await import("@capacitor/app");
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // 🔙 Android back button handling
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      const currentPath = window.location.pathname;
      console.log("🔙 Back button pressed, canGoBack:", canGoBack, "path:", currentPath);

      // Exit app if on login screen (no further back to go)
      if (currentPath === "/login" || currentPath === "/") {
        CapacitorApp.exitApp();
        return;
      }

      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
    console.log("✅ Android back button handler registered");

    // 📱 Status bar config
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#703DFA" });
      console.log("✅ StatusBar configured");
    } catch (e) {
      console.error("❌ StatusBar error", e);
    }

    // 🔔 Push Notifications
    const { initPushNotifications } = await import("./lib/nativePush");
    const { enableBackgroundAudio } = await import("./lib/backgroundAudio");
    initPushNotifications();
    enableBackgroundAudio();
  })();
}
