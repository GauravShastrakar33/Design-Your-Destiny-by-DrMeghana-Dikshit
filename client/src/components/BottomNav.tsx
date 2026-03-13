import { Home, Calendar, Bot, Heart, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import chatIcon from "@assets/chat icon_1763078697186.png";
import { prefetchPage, pathToPageMap } from "@/lib/prefetch";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/drm", label: "Dr.M", icon: Bot },
  { path: "/heart", label: "Project", icon: Heart },
  { path: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();

  const handlePrefetch = (path: string) => {
    const pageName = pathToPageMap[path];
    if (pageName) {
      prefetchPage(pageName);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F7FF]/90 backdrop-blur-2xl border-t border-brand/10 shadow-[0_-12px_40px_-12px_rgba(112,61,250,0.2)] pb-[env(safe-area-inset-bottom)] transition-all duration-500">
      <div className="mx-auto w-full max-w-lg px-2 py-2 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.path ||
            (item.path !== "/" && location.startsWith(item.path));
          const isDrM = item.label === "Dr.M";

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative group flex-1"
              onMouseEnter={() => handlePrefetch(item.path)}
              data-testid={`nav-${item.label
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              <button className="relative flex flex-col items-center justify-center w-full rounded-xl py-1.5 transition-all duration-300 active:scale-90">
                {/* Soft Ambient Glow */}
                <div
                  className={`absolute top-0 aspect-square w-12 rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10 blur-xl ${
                    isActive
                      ? "bg-brand/15 scale-100 opacity-100 translate-y-0"
                      : "bg-brand/0 scale-50 opacity-0 translate-y-2"
                  }`}
                />

                {/* Bottom Dock Dot Indicator */}
                <div
                  className={`absolute bottom-0.5 h-1 rounded-full bg-brand/40 transition-all duration-500 ease-out ${
                    isActive ? "w-4 opacity-100" : "w-0 opacity-0"
                  }`}
                />

                <div
                  className={`h-7 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isActive
                      ? "-translate-y-2 scale-110"
                      : "group-hover:-translate-y-0.5"
                  }`}
                >
                  {isDrM ? (
                    <img
                      src={chatIcon}
                      alt="Dr.M"
                      className={`w-6 h-6 object-contain transition-all duration-500 ${
                        isActive
                          ? "drop-shadow-[0_0_15px_rgba(112,61,250,0.5)]"
                          : "opacity-80 group-hover:opacity-100 grayscale-[0.1] group-hover:grayscale-0"
                      }`}
                    />
                  ) : (
                    <Icon
                      className={`w-5 h-5 transition-all duration-500 ${
                        isActive
                          ? "text-brand fill-brand/20"
                          : "text-slate-500 group-hover:text-slate-700"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight transition-all duration-500 ${
                    isActive
                      ? "text-brand font-bold -translate-y-1"
                      : "text-slate-500 font-medium group-hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
