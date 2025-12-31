import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users,
  Image,
  UsersRound, 
  FileText, 
  GraduationCap, 
  Heart,
  LogOut,
  BookOpen,
  Quote,
  Calendar,
  Bell
} from "lucide-react";
import { useAdminSidebar } from "@/contexts/AdminSidebarContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuItemConfig {
  id: string;
  path?: string;
  label: string;
  icon: React.ElementType;
}

const menuItemsConfig: MenuItemConfig[] = [
  { id: "dashboard", path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users },
  { id: "banner", path: "/admin/session-banner/banners", label: "Session Banner", icon: Image },
  { id: "events", path: "/admin/events", label: "Event Calendar", icon: Calendar },
  { id: "sessions", path: "/admin/sessions", label: "Community Practices", icon: UsersRound },
  { id: "courses", path: "/admin/courses", label: "Courses", icon: GraduationCap },
  { id: "process", path: "/admin/processes", label: "Process Library", icon: BookOpen },
  { id: "project", path: "/admin/project-heart", label: "Project of Heart", icon: Heart },
  { id: "quotes", path: "/admin/quotes", label: "Daily Quotes", icon: Quote },
  { id: "notifications", path: "/admin/notifications", label: "Push Notifications", icon: Bell },
];

export default function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { selectedMenuId, setSelectedMenuId } = useAdminSidebar();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleMenuClick = (item: MenuItemConfig) => {
    setSelectedMenuId(item.id);
    if (item.path) {
      setLocation(item.path);
    }
  };

  return (
    <div className="w-16 bg-brand min-h-screen flex flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mx-auto">
          <span className="text-brand font-bold text-sm">Dr.M</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center py-4">
        {menuItemsConfig.map((item) => {
          const Icon = item.icon;
          const isActive = selectedMenuId === item.id;
          
          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleMenuClick(item)}
                  data-testid={`nav-${item.id}`}
                  className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all mb-1 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="border-t border-white/10 py-4 flex justify-center">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="w-12 h-12 flex items-center justify-center rounded-lg text-white/60 hover:bg-red-500/30 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
