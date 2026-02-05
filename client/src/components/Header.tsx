import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import { Capacitor } from "@capacitor/core";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  titleIcon?: ReactNode;
  hasBackButton?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Header({
  title = "",
  subtitle,
  titleIcon,
  hasBackButton = false,
  onBack,
  rightContent,
  children,
  className = "",
}: HeaderProps) {
  const isNative = Capacitor.isNativePlatform();

  return (
    <div
      className={`sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 transition-all duration-300 ${
        isNative ? "pt-[calc(env(safe-area-inset-top)+1rem)]" : ""
      } ${className}`}
    >
      <div
        className={`max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center ${
          !hasBackButton && !rightContent ? "justify-center" : "justify-between"
        } gap-4`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {hasBackButton && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-md hover:text-brand transition-all active:scale-95 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate"
              title={title}
            >
              {title}
              {titleIcon}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base font-medium text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightContent && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>

      {children && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          {children}
        </>
      )}
    </div>
  );
}
