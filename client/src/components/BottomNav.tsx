import { Home, BookOpen, ListMusic, Heart, User } from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/workshops", label: "Workshops", icon: BookOpen },
  { path: "/playlist", label: "My Playlist", icon: ListMusic },
  { path: "/heart", label: "Project", icon: Heart },
  { path: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 safe-area-bottom">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <button className="flex flex-col items-center justify-center min-w-[60px] py-1 hover-elevate active-elevate-2 rounded-lg px-2">
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    fill={isActive ? "currentColor" : "none"}
                  />
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
