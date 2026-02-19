import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant = "default",
        ...props
      }) {
        const Icon = {
          default: <Info className="h-5 w-5 text-white/80" />,
          success: <CheckCircle2 className="h-5 w-5 text-white" />,
          destructive: <XCircle className="h-5 w-5 text-white" />,
        }[variant as string] || <Info className="h-5 w-5 text-white/80" />;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex w-full items-start gap-4">
              <div className="mt-1 flex-shrink-0">{Icon}</div>
              <div className="grid gap-1.5 overflow-hidden pr-2">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
