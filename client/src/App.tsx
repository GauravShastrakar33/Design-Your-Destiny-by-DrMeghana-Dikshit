import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AppRoutes from "@/routes/AppRoutes";
import AdminRoutes from "@/routes/AdminRoutes";

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isLoginPage = location === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          {isAdminRoute ? (
            <AdminLayout>
              <AdminRoutes />
            </AdminLayout>
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
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
