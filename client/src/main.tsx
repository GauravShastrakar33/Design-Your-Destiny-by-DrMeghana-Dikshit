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
    console.log("🔙 Back button pressed, canGoBack:", canGoBack);
    
    // Use Capacitor's canGoBack which checks WebView history
    if (canGoBack) {
      window.history.back();
    } else {
      // At root - minimize app instead of closing
      CapacitorApp.minimizeApp();
    }
  });
  console.log("✅ Android back button handler registered");
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
  // Register token with backend
  const registerTokenWithBackend = async (token: string) => {
    try {
      const userToken = localStorage.getItem("@app:user_token");
      if (!userToken) {
        console.warn("⚠️ No user token, cannot register device");
        return false;
      }
      
      const response = await fetch("/api/v1/notifications/register-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ token }),
      });
      
      if (response.ok) {
        console.log("✅ Device token registered with backend");
        // Dispatch event so ProfilePage can update its toggle
        window.dispatchEvent(new CustomEvent("nativePushRegistered", { 
          detail: { success: true } 
        }));
        return true;
      } else {
        console.error("❌ Failed to register device token:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error registering device token:", error);
      return false;
    }
  };

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

      PushNotifications.addListener("registration", async (token) => {
        console.log("🔥 FCM TOKEN:", token.value);
        // Send token to backend!
        await registerTokenWithBackend(token.value);
      });

      PushNotifications.addListener("registrationError", err => {
        console.error("❌ Registration error:", err);
        window.dispatchEvent(new CustomEvent("nativePushRegistered", { 
          detail: { success: false, error: err } 
        }));
      });
    } catch (e) {
      console.error("❌ Push init failed", e);
    }
  }, 1000); // ⏱ critical delay
}
