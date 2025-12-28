import { useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AppRoutes from "@/routes/AppRoutes";
import AdminRoutes from "@/routes/AdminRoutes";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const isAdminRoute = location.startsWith("/admin");
  const isAdminLoginPage = location === "/admin/login";
  const isLoginPage = location === "/login";

  // Admin routes have their own auth handling
  if (isAdminRoute) {
    if (isAdminLoginPage) {
      return (
        <AdminLayout>
          <AdminRoutes />
        </AdminLayout>
      );
    }
    return (
      <AdminRoute>
        <AdminLayout>
          <AdminRoutes />
        </AdminLayout>
      </AdminRoute>
    );
  }

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Login page - render without protection
  if (isLoginPage) {
    return (
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Authenticated - render app
  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <AppContent />
          </AdminAuthProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
