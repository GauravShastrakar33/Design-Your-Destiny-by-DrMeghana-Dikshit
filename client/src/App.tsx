import { useLocation } from "wouter";
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
import { setUnread } from "@/lib/notificationState";

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAdminLoginPage = location === "/admin/login";
  const isLoginPage = location === "/login";

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
          await setUnread(true);
        }
      } catch (err) {
        console.error("❌ Failed to check unread notifications on launch", err);
      }
    };

    checkUnreadOnLaunch();
  }, []);

  return (
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
  );
}

export default App;
