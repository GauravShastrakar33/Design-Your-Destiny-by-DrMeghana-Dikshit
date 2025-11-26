import { type ReactNode } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import SecondarySidebar from "@/components/SecondarySidebar";
import { AdminSidebarProvider } from "@/contexts/AdminSidebarContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const isLoginPage = location === "/admin/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <AdminSidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <SecondarySidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
