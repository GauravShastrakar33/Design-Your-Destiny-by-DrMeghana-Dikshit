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
      console.log("🔙 Back button pressed, canGoBack:", canGoBack);

      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.minimizeApp();
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
    const registerTokenWithBackend = async (token: string) => {
      try {
        const userToken = localStorage.getItem("@app:user_token");
        if (!userToken) return false;

        const res = await fetch("/api/v1/notifications/register-device", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          window.dispatchEvent(
            new CustomEvent("nativePushRegistered", {
              detail: { success: true },
            })
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error("❌ Token registration failed", err);
        return false;
      }
    };

    setTimeout(async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === "granted") {
          await PushNotifications.register();
        }

        PushNotifications.addListener("registration", async (token) => {
          console.log("🔥 FCM TOKEN:", token.value);
          await registerTokenWithBackend(token.value);
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("❌ Push error", err);
          window.dispatchEvent(
            new CustomEvent("nativePushRegistered", {
              detail: { success: false, error: err },
            })
          );
        });
      } catch (e) {
        console.error("❌ Push init failed", e);
      }
    }, 1000);
  })();
}
