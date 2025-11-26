import { useEffect, useRef, type ReactNode } from "react";

interface SubmenuFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  triggerRef: React.RefObject<HTMLElement>;
}

export default function SubmenuFlyout({ 
  isOpen, 
  onClose, 
  title, 
  children,
  triggerRef 
}: SubmenuFlyoutProps) {
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideFlyout = flyoutRef.current && !flyoutRef.current.contains(target);
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      
      if (isOutsideFlyout && isOutsideTrigger) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={flyoutRef}
      className="absolute left-full top-0 ml-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
      data-testid="submenu-flyout"
    >
      <div className="px-4 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

interface SubmenuItemProps {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function SubmenuItem({ href, label, isActive, onClick }: SubmenuItemProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        window.location.href = href;
      }}
      data-testid={`submenu-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`block px-4 py-2 text-sm transition-colors ${
        isActive 
          ? "bg-amber-50 text-amber-800 font-medium" 
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </a>
  );
}
