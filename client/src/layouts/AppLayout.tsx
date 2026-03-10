import { type ReactNode, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { PullToRefresh } from "@/components/PullToRefresh";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const isLoginPage = location === "/login";

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location]);

  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FB]">
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8F9FB]"
      >
        <PullToRefresh containerRef={mainRef}>{children}</PullToRefresh>
      </main>
      <BottomNav />
    </div>
  );
}
