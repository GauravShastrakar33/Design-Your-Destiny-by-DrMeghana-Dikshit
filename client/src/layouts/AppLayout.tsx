import { type ReactNode } from "react";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-[calc(env(safe-area-inset-top)+4.5rem)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
