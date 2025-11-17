import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Users, 
  FileText, 
  Music, 
  Calendar, 
  Heart,
  LogOut 
} from "lucide-react";

const menuItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/interventions", label: "Interventions", icon: Target },
  { path: "/admin/process-library", label: "Process Library", icon: BookOpen },
  { path: "/admin/sessions", label: "Community Practices", icon: Users },
  { path: "/admin/articles", label: "Articles", icon: FileText },
  { path: "/admin/music-journaling", label: "Music Journaling", icon: Music },
  { path: "/admin/workshops", label: "Workshops", icon: Calendar },
  { path: "/admin/project-heart", label: "Project of Heart", icon: Heart },
];

export default function AdminSidebar() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("@app:admin_auth");
    setLocation("/admin/login");
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Dr.M Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <button
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-[#703DFA] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
