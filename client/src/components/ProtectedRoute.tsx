import { type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, requiresPasswordChange } = useAuth();
  const [location] = useLocation();

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

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!user || !["USER", "COACH"].includes(user.role)) {
    return <Redirect to="/login" />;
  }

  // Redirect to account settings if password change is required
  // But allow access to account settings page itself
  if (requiresPasswordChange && location !== "/account") {
    return <Redirect to="/account" />;
  }

  return <>{children}</>;
}
