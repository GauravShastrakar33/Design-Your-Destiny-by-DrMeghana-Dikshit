import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { ErrorBoundary } from "./components/ErrorBoundary";

console.log("🚀 main.tsx loaded, starting React initialization...");

try {
  const rootElement = document.getElementById("root");
  console.log("📦 Root element found:", rootElement ? "✅ YES" : "❌ NO");

  if (!rootElement) {
    throw new Error("Root element not found!");
  }

  console.log("🎨 Creating React root...");
  const root = createRoot(rootElement);

  console.log("🎨 Rendering App component...");
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  console.log("✅ React app mounted successfully!");
} catch (error) {
  console.error("❌ FATAL: Failed to mount React app:", error);
  // Show error on screen
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: red; color: white; font-family: monospace;">
        <h2>🛑 React Mount Failed</h2>
        <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
        <pre style="background: rgba(0,0,0,0.2); padding: 10px; overflow: auto;">${error instanceof Error ? error.stack : ''}</pre>
        <button onclick="location.reload()" style="padding: 10px; background: white; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">RELOAD</button>
      </div>
    `;
  }
}

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
