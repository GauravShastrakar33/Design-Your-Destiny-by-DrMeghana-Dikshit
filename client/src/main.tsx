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
        <p><strong>Error:</strong> ${
          error instanceof Error ? error.message : String(error)
        }</p>
        <pre style="background: rgba(0,0,0,0.2); padding: 10px; overflow: auto;">${
          error instanceof Error ? error.stack : ""
        }</pre>
        <button onclick="location.reload()" style="padding: 10px; background: white; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">RELOAD</button>
      </div>
    `;
  }
}

if (Capacitor.isNativePlatform()) {
  (async () => {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const { App: CapacitorApp } = await import("@capacitor/app");

    // ✅ iOS Status Bar Fix
    if (Capacitor.getPlatform() === "ios") {
      await StatusBar.setStyle({ style: Style.Dark});

      // Only needed if overlaysWebView = false
      await StatusBar.setBackgroundColor({ color: "#703DFA" });
    }

    // 🔔 Push Notifications
    const { initPushNotifications } = await import("./lib/nativePush");
    const { enableBackgroundAudio } = await import("./lib/backgroundAudio");

    initPushNotifications();
    enableBackgroundAudio();
  })();
}
