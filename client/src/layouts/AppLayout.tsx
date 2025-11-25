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
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {children}
      <BottomNav />
    </div>
  );
}
