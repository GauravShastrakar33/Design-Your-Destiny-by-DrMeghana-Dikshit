import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";

export interface SubmenuItem {
  path: string;
  label: string;
}

export interface MenuItem {
  id: string;
  path?: string;
  label: string;
  icon?: string; // Keeping it flexible
  submenu?: SubmenuItem[];
}

interface AdminSidebarContextType {
  selectedMenuId: string;
  setSelectedMenuId: (id: string) => void;
  menuItems: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    path: "/admin",
    label: "Dashboard",
  },
  {
    id: "users",
    path: "/admin/users/students",
    label: "User Management",
    submenu: [
      { path: "/admin/users/students", label: "Students" },
      { path: "/admin/users/admins", label: "Admins" },
    ],
  },
  {
    id: "banner",
    path: "/admin/session-banner/banners",
    label: "Session Banner",
    submenu: [{ path: "/admin/session-banner/banners", label: "All Banners" }],
  },
  {
    id: "events",
    path: "/admin/events",
    label: "Event Calendar",
    submenu: [{ path: "/admin/events", label: "All Events" }],
  },
  {
    id: "sessions",
    path: "/admin/sessions",
    label: "Community Practices",
  },
  {
    id: "courses",
    path: "/admin/courses",
    label: "Courses",
    submenu: [
      { path: "/admin/courses", label: "All Courses" },
      { path: "/admin/programs", label: "Programs" },
    ],
  },
  {
    id: "process",
    path: "/admin/processes",
    label: "Process Library",
    submenu: [
      { path: "/admin/processes", label: "Processes" },
      // { path: "/admin/spiritual-breaths", label: "Spiritual Breaths" },
      { path: "/admin/abundance-mastery", label: "Abundance Mastery" },
      { path: "/admin/masterclasses", label: "Masterclasses" },
      { path: "/admin/my-processes", label: "My Playlist" },
    ],
  },
  {
    id: "project",
    path: "/admin/project-heart",
    label: "Project of Heart",
  },
  {
    id: "quotes",
    path: "/admin/quotes",
    label: "Daily Quotes",
  },
  {
    id: "notifications",
    path: "/admin/notifications",
    label: "Push Notifications",
  },
  {
    id: "drm-questions",
    path: "/admin/drm-questions",
    label: "Dr.M Questions",
  },
];

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(
  undefined
);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [selectedMenuId, setSelectedMenuId] = useState("dashboard");

  useEffect(() => {
    const matchedItem = menuItems.find((item) => {
      if (item.path) {
        if (item.path === "/admin") {
          return location === "/admin";
        }
        return location.startsWith(item.path);
      }
      if (item.submenu) {
        return item.submenu.some((sub) => location.startsWith(sub.path));
      }
      return false;
    });

    if (matchedItem) {
      setSelectedMenuId(matchedItem.id);
    }
  }, [location]);

  return (
    <AdminSidebarContext.Provider
      value={{ selectedMenuId, setSelectedMenuId, menuItems }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (context === undefined) {
    throw new Error(
      "useAdminSidebar must be used within an AdminSidebarProvider"
    );
  }
  return context;
}

export { menuItems };
