import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users,
  Image,
  BookOpen, 
  UsersRound, 
  FileText, 
  GraduationCap, 
  Heart,
  LogOut
} from "lucide-react";
import { useAdminSidebar } from "@/contexts/AdminSidebarContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface MenuItemConfig {
  id: string;
  path?: string;
  label: string;
  icon: React.ElementType;
}

const menuItemsConfig: MenuItemConfig[] = [
  { id: "dashboard", path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users },
  { id: "banner", path: "/admin/interventions", label: "Session Banner", icon: Image },
  { id: "process", path: "/admin/process-library", label: "Process Library", icon: BookOpen },
  { id: "sessions", path: "/admin/sessions", label: "Community Practices", icon: UsersRound },
  { id: "articles", path: "/admin/articles", label: "Articles", icon: FileText },
  { id: "workshops", path: "/admin/workshops", label: "Masterclasses", icon: GraduationCap },
  { id: "project", path: "/admin/project-heart", label: "Project of Heart", icon: Heart },
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
    <div className="w-16 bg-[#1a1a1a] min-h-screen flex flex-col">
      <div className="p-3 border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-sm">Dr.M</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center py-4">
        {menuItemsConfig.map((item) => {
          const Icon = item.icon;
          const isActive = selectedMenuId === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              data-testid={`nav-${item.id}`}
              className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all mb-1 ${
                isActive
                  ? "bg-brand/20 text-brand"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-800 py-4 flex justify-center">
        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
