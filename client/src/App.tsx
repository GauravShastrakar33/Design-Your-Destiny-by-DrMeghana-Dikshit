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

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAdminLoginPage = location === "/admin/login";
  const isLoginPage = location === "/login";

  return (
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
  );
}

export default App;
