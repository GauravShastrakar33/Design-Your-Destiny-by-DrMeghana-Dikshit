import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    rangeClassName?: string;
    trackClassName?: string;
    thumbClassName?: string;
    orientation?: "horizontal" | "vertical";
  }
>(
  (
    {
      className,
      rangeClassName,
      trackClassName,
      thumbClassName,
      orientation = "horizontal",
      ...props
    },
    ref
  ) => (
    <SliderPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        "relative flex touch-none select-none items-center",
        orientation === "horizontal" ? "w-full h-5" : "flex-col h-full w-5",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative overflow-hidden rounded-full bg-gray-200",
          orientation === "horizontal" ? "h-2 w-full grow" : "w-2 h-full grow",
          trackClassName
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute bg-primary",
            orientation === "horizontal" ? "h-full" : "w-full",
            rangeClassName
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          thumbClassName
        )}
      />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
