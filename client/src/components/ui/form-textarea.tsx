import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  required?: boolean;
}

export function FormTextarea({
  name,
  label,
  required,
  className,
  ...props
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        {...register(name)}
        {...props}
        className={cn(
          error &&
            "!border-destructive focus-visible:!border-destructive focus-visible:ring-destructive"
        )}
      />
      {error && (
        <p className="text-xs font-medium text-destructive">
          {error.message?.toString()}
        </p>
      )}
    </div>
  );
}
