import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface HeaderProps {
  title?: string;
  hasBackButton?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Header({
  title = "",
  hasBackButton = false,
  onBack,
  rightContent,
  children,
  className = "",
}: HeaderProps) {
  return (
    <div
      className={`sticky top-0 bg-white border-b border-border z-10 max-w-md mx-auto ${className}`}
    >
      <div
        className={`px-6 py-4 flex items-center ${
          !hasBackButton && !rightContent ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasBackButton && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
            </button>
          )}
          <h1
            className="font-bold text-gray-500 tracking-wider truncate"
            title={title}
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {title}
          </h1>
        </div>
        {rightContent && (
          <div className="flex items-center gap-2">{rightContent}</div>
        )}
      </div>

      {children && (
        <>
          <div className="border-t border-gray-200" />
          {children}
        </>
      )}
    </div>
  );
}
