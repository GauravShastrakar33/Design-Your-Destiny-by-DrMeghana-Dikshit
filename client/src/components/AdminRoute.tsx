import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, admin } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  if (!admin || !["SUPER_ADMIN", "COACH"].includes(admin.role)) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}
