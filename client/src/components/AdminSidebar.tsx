import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Image,
  UsersRound,
  GraduationCap,
  Heart,
  LogOut,
  BookOpen,
  Quote,
  Calendar,
  Bell,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useAdminSidebar, MenuItem } from "@/contexts/AdminSidebarContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  users: Users,
  banner: Image,
  events: Calendar,
  sessions: UsersRound,
  courses: GraduationCap,
  process: BookOpen,
  project: Heart,
  quotes: Quote,
  notifications: Bell,
  "drm-questions": MessageCircle,
};

export default function AdminSidebar({
  onMobileClose,
  isMobileDrawer = false,
}: {
  onMobileClose?: () => void;
  isMobileDrawer?: boolean;
}) {
  const [location, setLocation] = useLocation();
  const { menuItems, selectedMenuId, setSelectedMenuId } = useAdminSidebar();
  const { logout } = useAdminAuth();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use a derived state for collapse to force expansion on mobile drawer
  const effectivelyCollapsed = isCollapsed && !isMobileDrawer;

  // Auto-expand the accordion if a child route is active
  useEffect(() => {
    const parent = menuItems.find((item) =>
      item.submenu?.some((sub) => location.startsWith(sub.path))
    );
    if (parent && !openItems.includes(parent.id)) {
      setOpenItems((prev) => [...prev, parent.id]);
    }
  }, [location, menuItems]);

  const handleLogout = () => {
    logout();
    onMobileClose?.();
    setLocation("/admin/login");
  };

  const NavItem = ({
    item,
    isSubmenu = false,
  }: {
    item: MenuItem;
    isSubmenu?: boolean;
  }) => {
    const Icon = !isSubmenu ? iconMap[item.id] || LayoutDashboard : null;
    const isActive = isSubmenu
      ? location === item.path ||
        (item.path !== "/admin" && location.startsWith(item.path + "/"))
      : selectedMenuId === item.id;

    return (
      <Link href={item.path || "#"}>
        <div
          data-testid={
            isSubmenu
              ? `secondary-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`
              : `nav-${item.id}`
          }
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer group relative overflow-hidden",
            isSubmenu
              ? effectivelyCollapsed
                ? "hidden"
                : "ml-7 py-1.5 text-xs"
              : "mb-0.5 text-sm",
            isActive
              ? "bg-white/15 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md border border-white/10 font-semibold"
              : "text-white/80 hover:bg-white/10 hover:text-white",
            effectivelyCollapsed && !isSubmenu && "justify-center px-2"
          )}
          onClick={(e) => {
            if (!item.path) e.preventDefault();
            if (!isSubmenu) {
              setSelectedMenuId(item.id);
              onMobileClose?.();
            }
          }}
        >
          {isActive && (
            <div
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-lg shadow-[0_0_8px_white]",
                effectivelyCollapsed && "left-0.5"
              )}
            />
          )}
          {Icon && (
            <Icon
              className={cn(
                "w-5 h-5 shrink-0 transition-all duration-300",
                isActive ? "text-white" : "text-white/80"
              )}
            />
          )}
          {!effectivelyCollapsed && (
            <span className="flex-1 truncate tracking-wide transition-opacity duration-300">
              {item.label}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] h-screen flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out border-r border-white/10 shrink-0",
        effectivelyCollapsed ? "w-20" : "w-60"
      )}
    >
      <div
        className={cn(
          "p-4 mb-2 flex items-center justify-between",
          effectivelyCollapsed && "justify-center p-2 mb-4"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-white shadow-[0_8px_16px_rgba(0,0,0,0.1)] flex items-center justify-center duration-500 cursor-default">
            <span className="text-brand font-black text-xs">Dr.M</span>
          </div>
          {!effectivelyCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-white font-bold text-md tracking-tight leading-tight whitespace-nowrap">
                Design Destiny
              </span>
              <span className="text-white/40 text-xs uppercase tracking-[0.15em] font-bold font-mono whitespace-nowrap">
                Admin Panel
              </span>
            </div>
          )}
        </div>
        {!effectivelyCollapsed && !isMobileDrawer && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:block p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 custom-scrollbar">
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
          className="space-y-1 w-full"
        >
          {menuItems.map((item) => {
            const Icon = iconMap[item.id];
            if (item.submenu && item.submenu.length > 1) {
              return (
                <AccordionItem
                  value={item.id}
                  key={item.id}
                  className="border-none"
                >
                  <AccordionTrigger
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer group mb-0.5 hover:no-underline border border-transparent",
                      selectedMenuId === item.id
                        ? "bg-white/10 text-white border-white/5 shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                      effectivelyCollapsed && "justify-center px-2"
                    )}
                    onClick={() => {
                      if (effectivelyCollapsed) setIsCollapsed(false);
                      setSelectedMenuId(item.id);
                    }}
                  >
                    {Icon && (
                      <div
                        className={cn(
                          "w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                          selectedMenuId === item.id
                            ? "text-white"
                            : "text-white/80"
                        )}
                      >
                        <Icon className="w-5 h-5 transition-all duration-300" />
                      </div>
                    )}
                    {!effectivelyCollapsed && (
                      <span className="flex-1 text-left font-medium text-sm tracking-wide">
                        {item.label}
                      </span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pt-1 animate-none">
                    <div className="space-y-1 flex flex-col border-l-2 border-white/10 ml-6 pl-2">
                      {item.submenu.map((sub: any) => (
                        <NavItem key={sub.path} item={sub} isSubmenu={true} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }
            return <NavItem key={item.id} item={item} />;
          })}
        </Accordion>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 mt-auto">
        <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
          <button
            onClick={handleLogout}
            data-testid="button-logout"
            className={cn(
              "w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-all group",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-7 h-7 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Decorative Blur / Gradient Background */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-lg blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-light/10 rounded-lg blur-3xl pointer-events-none" />
    </div>
  );
}
