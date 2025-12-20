import { Home, Calendar, Bot, Heart, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import chatIcon from "@assets/chat icon_1763078697186.png";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/drm", label: "Dr.M", icon: Bot },
  { path: "/heart", label: "Project", icon: Heart },
  { path: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-white border-t border-gray-200 dark:border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <button className="flex flex-col items-center justify-center min-w-[60px] py-1 hover-elevate active-elevate-2 rounded-lg px-2">
                  {item.label === "Dr.M" ? (
                    <img
                      src={chatIcon}
                      alt="Dr.M"
                      className={`w-6 h-6 ${
                        isActive ? "opacity-100" : "opacity-50"
                      }`}
                    />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${
                        isActive
                          ? "text-[#703DFA]"
                          : "text-[#703DFA] opacity-50"
                      }`}
                      fill={isActive ? "currentColor" : "none"}
                    />
                  )}
                  <span
                    className={`text-xs mt-1 ${
                      isActive
                        ? "font-semibold text-gray-900"
                        : "font-medium text-gray-600"
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
