import { Link, useLocation } from "wouter";
import { useAdminSidebar, menuItems } from "@/contexts/AdminSidebarContext";
import {
  LayoutDashboard,
  Users,
  Image,
  BookOpen,
  UsersRound,
  FileText,
  GraduationCap,
  Heart,
  TrendingUp,
  Clock,
  BarChart3,
  Settings,
  Plus,
  List,
  Sparkles,
  Wind,
  DollarSign,
  Music,
} from "lucide-react";

const menuIcons: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  users: Users,
  banner: Image,
  sessions: UsersRound,
  articles: FileText,
  workshops: GraduationCap,
  courses: GraduationCap,
  process: BookOpen,
  project: Heart,
};

const menuContent: Record<
  string,
  {
    title: string;
    items: { path: string; label: string; icon?: React.ElementType; disableActiveHighlight?: boolean }[];
  }
> = {
  dashboard: {
    title: "Dashboard",
    items: [
      { path: "/admin", label: "Overview", icon: BarChart3 },
      { path: "/admin", label: "Analytics", icon: TrendingUp },
      { path: "/admin", label: "Recent Activity", icon: Clock },
    ],
  },
  users: {
    title: "User Management",
    items: [
      { path: "/admin/users/students", label: "Students", icon: Users },
      { path: "/admin/users/admins", label: "Admins", icon: Settings },
    ],
  },
  banner: {
    title: "Session Banner",
    items: [
      { path: "/admin/session-banner/banners", label: "All Banners", icon: List },
      { path: "/admin/session-banner/banners/new", label: "Add New", icon: Plus },
    ],
  },
  sessions: {
    title: "Community Practices",
    items: [
      { path: "/admin/sessions", label: "All Sessions", icon: List },
      { path: "/admin/sessions", label: "Schedule", icon: Clock },
      { path: "/admin/sessions", label: "Add New", icon: Plus },
    ],
  },
  articles: {
    title: "Articles",
    items: [
      { path: "/admin/articles", label: "All Articles", icon: List },
      { path: "/admin/articles", label: "Categories", icon: BookOpen },
      { path: "/admin/articles", label: "Add New", icon: Plus },
    ],
  },
  workshops: {
    title: "Masterclasses",
    items: [
      { path: "/admin/workshops", label: "All Masterclasses", icon: List },
      { path: "/admin/workshops", label: "Schedule", icon: Clock },
      { path: "/admin/workshops", label: "Add New", icon: Plus },
    ],
  },
  courses: {
    title: "Courses",
    items: [
      { path: "/admin/courses", label: "All Courses", icon: List },
      {
        path: "/admin/courses/create/step1",
        label: "Create Course",
        icon: Plus,
      },
      { path: "/admin/programs", label: "Programs", icon: BookOpen },
    ],
  },
  process: {
    title: "Process Library",
    items: [
      { path: "/admin/processes", label: "Processes", icon: Sparkles },
      { path: "/admin/spiritual-breaths", label: "Spiritual Breaths", icon: Wind },
      { path: "/admin/abundance-mastery", label: "Abundance Mastery", icon: DollarSign },
      { path: "/admin/my-processes", label: "My Processes", icon: Music },
    ],
  },
  project: {
    title: "Project of Heart",
    items: [
      { path: "/admin/project-heart", label: "Overview", icon: Heart },
      { path: "/admin/project-heart", label: "Submissions", icon: List },
      { path: "/admin/project-heart", label: "Settings", icon: Settings },
    ],
  },
};

export default function SecondarySidebar() {
  const { selectedMenuId } = useAdminSidebar();
  const [location] = useLocation();

  const content = menuContent[selectedMenuId] || menuContent.dashboard;
  const Icon = menuIcons[selectedMenuId] || LayoutDashboard;

  return (
    <div
      className="w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col"
      data-testid="secondary-sidebar"
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand" />
          </div>
          <h2 className="font-semibold text-gray-900 text-sm">
            {content.title}
          </h2>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {content.items.map((item, index) => {
            const ItemIcon = item.icon || List;
            const isActive =
              !item.disableActiveHighlight && (location === item.path || location.startsWith(item.path + "/"));

            return (
              <Link key={`${item.path}-${index}`} href={item.path}>
                <button
                  data-testid={`secondary-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                    isActive
                      ? "bg-brand/10 text-brand font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Dr.M Admin Panel</p>
      </div>
    </div>
  );
}
