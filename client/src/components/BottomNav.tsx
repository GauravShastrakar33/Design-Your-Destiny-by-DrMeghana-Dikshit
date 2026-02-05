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
    <nav className="fixed bottom-2 left-0 right-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="mx-4 w-full max-w-lg pointer-events-auto">
        <div className="bg-[#F8F7FF]/95 backdrop-blur-2xl border border-brand/10 shadow-[0_4px_20px_-4px_rgba(112,61,250,0.15)] rounded-2xl px-1 py-1.5 flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const isDrM = item.label === "Dr.M";

            return (
              <Link
                key={item.path}
                href={item.path}
                className="relative group flex-1"
                data-testid={`nav-${item.label
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <button className="relative flex flex-col items-center justify-center w-full rounded-xl py-1.5 transition-all duration-300 active:scale-95">
                  {/* Active Background Pill */}
                  {isActive && (
                    <div className="absolute inset-x-2 inset-y-0.5 bg-brand/10 rounded-xl -z-10 animate-in zoom-in-50 duration-300" />
                  )}

                  <div
                    className={`h-7 flex items-center justify-center transition-all duration-300 ${
                      isActive ? "-translate-y-0.5" : ""
                    }`}
                  >
                    {isDrM ? (
                      <img
                        src={chatIcon}
                        alt="Dr.M"
                        className={`w-6 h-6 object-contain transition-all duration-300 ${
                          isActive
                            ? "drop-shadow-sm scale-110"
                            : "opacity-70 group-hover:opacity-100 grayscale-[0.5] group-hover:grayscale-0"
                        }`}
                      />
                    ) : (
                      <Icon
                        className={`w-5 h-5 transition-all duration-300 ${
                          isActive
                            ? "text-brand fill-brand/20 scale-110"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-medium tracking-wide transition-all duration-300 ${
                      isActive
                        ? "text-brand font-bold"
                        : "text-slate-400 group-hover:text-slate-600"
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
