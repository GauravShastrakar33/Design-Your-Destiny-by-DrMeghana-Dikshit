import { useState, useRef } from "react";
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
  LogOut,
  UserCircle,
  ShieldCheck
} from "lucide-react";
import SubmenuFlyout, { SubmenuItem } from "./SubmenuFlyout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface MenuItem {
  id: string;
  path?: string;
  label: string;
  icon: React.ElementType;
  submenu?: { path: string; label: string }[];
}

const menuItems: MenuItem[] = [
  { 
    id: "dashboard",
    path: "/admin", 
    label: "Dashboard", 
    icon: LayoutDashboard 
  },
  { 
    id: "users",
    label: "User Management", 
    icon: Users,
    submenu: [
      { path: "/admin/users/students", label: "Students" },
      { path: "/admin/users/admins", label: "Admins" },
    ]
  },
  { 
    id: "banner",
    path: "/admin/session-banner", 
    label: "Session Banner", 
    icon: Image 
  },
  { 
    id: "process",
    path: "/admin/process-library", 
    label: "Process Library", 
    icon: BookOpen 
  },
  { 
    id: "sessions",
    path: "/admin/sessions", 
    label: "Community Practices", 
    icon: UsersRound 
  },
  { 
    id: "articles",
    path: "/admin/articles", 
    label: "Articles", 
    icon: FileText 
  },
  { 
    id: "workshops",
    path: "/admin/workshops", 
    label: "Masterclasses", 
    icon: GraduationCap 
  },
  { 
    id: "project",
    path: "/admin/project-heart", 
    label: "Project of Heart", 
    icon: Heart 
  },
];

export default function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.submenu) {
      setOpenSubmenu(openSubmenu === item.id ? null : item.id);
    } else if (item.path) {
      setOpenSubmenu(null);
      setLocation(item.path);
    }
  };

  const isItemActive = (item: MenuItem) => {
    if (item.path) {
      return location === item.path;
    }
    if (item.submenu) {
      return item.submenu.some(sub => location === sub.path);
    }
    return false;
  };

  return (
    <div className="w-16 bg-[#1a1a1a] min-h-screen flex flex-col relative">
      <div className="flex-1 flex flex-col items-center pt-4 pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);
          const hasSubmenu = !!item.submenu;
          const isSubmenuOpen = openSubmenu === item.id;
          
          return (
            <div key={item.id} className="relative w-full flex justify-center mb-1">
              <button
                ref={(el) => { menuRefs.current[item.id] = el; }}
                onClick={() => handleMenuClick(item)}
                data-testid={`nav-${item.id}`}
                className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all ${
                  isActive
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </button>

              {hasSubmenu && isSubmenuOpen && (
                <SubmenuFlyout
                  isOpen={isSubmenuOpen}
                  onClose={() => setOpenSubmenu(null)}
                  title={item.label}
                  triggerRef={{ current: menuRefs.current[item.id] } as React.RefObject<HTMLElement>}
                >
                  {item.submenu?.map((subItem) => (
                    <SubmenuItem
                      key={subItem.path}
                      href={subItem.path}
                      label={subItem.label}
                      isActive={location === subItem.path}
                      onClick={() => {
                        setOpenSubmenu(null);
                        setLocation(subItem.path);
                      }}
                    />
                  ))}
                </SubmenuFlyout>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-700 py-4 flex justify-center">
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
