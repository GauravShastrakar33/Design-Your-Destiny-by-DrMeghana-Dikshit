import { type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, requiresPasswordChange } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Ensure we only redirect if loading is finished and user is definitely not authenticated
  if (!isLoading && !isAuthenticated) {
    if (location !== "/login") {
      setLocation("/login");
    }
    return null;
  }

  if (!isLoading && (!user || !["USER", "COACH"].includes(user.role))) {
    if (location !== "/login") {
      setLocation("/login");
    }
    return null;
  }

  // Redirect to account settings if password change is required
  // But allow access to account settings page itself
  if (requiresPasswordChange && location !== "/account-settings") {
    return <Redirect to="/account-settings" />;
  }

  return <>{children}</>;
}
