import { Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AppRoutes from "@/routes/AppRoutes";
import AdminRoutes from "@/routes/AdminRoutes";
import NetworkStatus from "@/components/NetworkStatus";
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Toast } from "@capacitor/toast";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from '@capacitor/splash-screen';

function App() {
  console.log("🎯 App component rendering...");
  const [location, setLocation] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAdminLoginPage = location === "/admin/login";
  const isLoginPage = location === "/login";
  console.log("📍 Current location:", location);
  console.log("🔍 isLoginPage:", isLoginPage, "| isAdminRoute:", isAdminRoute);

  // CRITICAL: Force redirect if on root path
  // 🚀 App Initialized
  useEffect(() => {
    console.log("🚀 App component mounted");

    // Hide the splash screen once the app component is ready
    const hideSplash = async () => {
      await SplashScreen.hide();
    };

    hideSplash();
  }, []);

  // 🔴 FIX 3: Handle notifications received while app was closed/backgrounded
  useEffect(() => {
    const checkUnreadOnLaunch = async () => {
      const token = localStorage.getItem("@app:user_token");
      if (!token) return;

      try {
        const res = await fetch("/api/v1/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const notifications = await res.json();

        if (Array.isArray(notifications) && notifications.length > 0) {
          const { getLastSeenId, setUnreadCount } = await import("@/lib/notificationState");
          const lastSeenId = await getLastSeenId();
          const latestId = notifications[0].id;

          if (latestId > lastSeenId) {
            // Found new notifications since last visit
            await setUnreadCount(1);
          }
        }
      } catch (err) {
        console.error("❌ Failed to check unread notifications on launch", err);
      }
    };

    checkUnreadOnLaunch();
  }, []);

  // 🔵 Android double-back to exit app
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let lastBackPress = 0;

    const listener = CapacitorApp.addListener(
      "backButton",
      async (event: any) => {
        const now = Date.now();
        const canGoBack = event?.canGoBack;

        if (canGoBack) {
          window.history.back();
          return;
        }

        if (now - lastBackPress < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPress = now;
          await Toast.show({
            text: "Press back again to exit",
            duration: "short",
          });
        }
      },
    );

    return () => {
      listener.then((l: any) => l.remove());
    };
  }, []);

  // Determine routing strategy:
  // 1. Native Mobile: Always use Hash Routing (safe for file:// protocol)
  // 2. Web Admin: Use Standard History Routing (clean URLs)
  // 3. Web App: Default to Hash Routing to match mobile behavior (or change if desired)

  const isNative = Capacitor.isNativePlatform();
  // Check if initial load is on an admin path
  const isAdminPath = window.location.pathname.startsWith("/admin");

  // Use hash location if native OR if it's NOT an admin path
  // Pass undefined to hook to use standard history API
  const useHash = isNative || !isAdminPath;

  return (
    <Router hook={useHash ? useHashLocation : undefined}>
      <NetworkStatus>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <AdminAuthProvider>
                {isAdminRoute ? (
                  isAdminLoginPage ? (
                    <AdminLayout>
                      <AdminRoutes />
                    </AdminLayout>
                  ) : (
                    <AdminRoute>
                      <AdminLayout>
                        <AdminRoutes />
                      </AdminLayout>
                    </AdminRoute>
                  )
                ) : isLoginPage ? (
                  <AppLayout>
                    <AppRoutes />
                  </AppLayout>
                ) : (
                  <ProtectedRoute>
                    <AppLayout>
                      <AppRoutes />
                    </AppLayout>
                  </ProtectedRoute>
                )}
              </AdminAuthProvider>
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </NetworkStatus>
    </Router>
  );
}

export default App;
