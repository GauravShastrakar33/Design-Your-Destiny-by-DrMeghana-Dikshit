import { type ReactNode, useState } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { AdminSidebarProvider } from "@/contexts/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoginPage = location === "/admin/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <AdminSidebarProvider>
      <div className="h-screen bg-[#F8FAFC] flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden",
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-[70] transition-transform duration-300 transform lg:relative lg:translate-x-0",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <AdminSidebar
            onMobileClose={() => setIsMobileMenuOpen(false)}
            isMobileDrawer={true}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Shared Header for Mobile/Tablet Toggle */}
          <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center px-6 lg:hidden shrink-0 sticky top-0 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-4 font-bold text-gray-900">Dr.M Admin</span>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
            <div className="min-h-full pb-20">{children}</div>
          </main>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
