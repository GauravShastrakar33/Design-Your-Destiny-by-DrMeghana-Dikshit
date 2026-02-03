import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  minDate = new Date(),
  maxDate,
  placeholder = "Pick a date",
  className,
  error,
}: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<
    Date | undefined
  >(date);

  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);
  const ampmRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (date) setSelectedDateTime(date);
  }, [date]);

  React.useEffect(() => {
    if (selectedDateTime) {
      const scrollToButton = (
        container: HTMLDivElement | null,
        index: number
      ) => {
        if (container) {
          const button = container.children[0]?.children[index] as HTMLElement;
          if (button) {
            button.scrollIntoView({ block: "center", behavior: "auto" });
          }
        }
      };

      const hours = selectedDateTime.getHours();
      // 12-hour format map: 0->12, 1..11->1..11, 12->12, 13..23->1..11
      // Index is value-1 (0-11)
      const displayHour = hours % 12 || 12;
      scrollToButton(hourRef.current, displayHour - 1);

      scrollToButton(minuteRef.current, selectedDateTime.getMinutes());

      const isPm = hours >= 12;
      scrollToButton(ampmRef.current, isPm ? 1 : 0);
    }
  }, [selectedDateTime]); // Trigger whenever selection changes

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    const newDate = new Date(day);
    if (selectedDateTime) {
      newDate.setHours(selectedDateTime.getHours());
      newDate.setMinutes(selectedDateTime.getMinutes());
    } else {
      const now = new Date();
      newDate.setHours(now.getHours());
      newDate.setMinutes(now.getMinutes());
    }
    setSelectedDateTime(newDate);
    setDate(newDate);
  };

  const setTime = (type: "hour" | "minute" | "ampm", value: number) => {
    if (!selectedDateTime) return;
    const newDate = new Date(selectedDateTime);
    const currentHours = newDate.getHours();

    if (type === "hour") {
      const isPm = currentHours >= 12;
      // value is 1-12
      if (isPm) {
        if (value === 12) newDate.setHours(12);
        else newDate.setHours(value + 12);
      } else {
        if (value === 12) newDate.setHours(0);
        else newDate.setHours(value);
      }
    } else if (type === "minute") {
      newDate.setMinutes(value);
    } else if (type === "ampm") {
      // 0=AM, 1=PM
      if (value === 0 && currentHours >= 12) {
        newDate.setHours(currentHours - 12);
      } else if (value === 1 && currentHours < 12) {
        newDate.setHours(currentHours + 12);
      }
    }

    // Safety check: if new time exceeds constraints, clamp it?
    // User might select Hour 5 PM which is valid, then switch date to a day where 5 PM is invalid.
    // Ideally we re-validate, but for now we rely on the user picking valid options from the UI.

    setSelectedDateTime(newDate);
    setDate(newDate);
  };

  const isSameDayAsMin =
    selectedDateTime &&
    minDate &&
    selectedDateTime.toDateString() === minDate.toDateString();

  const isSameDayAsMax =
    selectedDateTime &&
    maxDate &&
    selectedDateTime.toDateString() === maxDate.toDateString();

  // Generate 12 hours
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const ampmOptions = ["AM", "PM"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border-input bg-background shadow-xs hover:bg-background hover:text-foreground",
            error &&
              "!border-destructive focus-visible:!border-destructive focus-visible:ring-destructive",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {date ? format(date, "PPP p") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex items-start" align="start">
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={handleDateSelect}
          disabled={(day) => {
            const m = new Date(minDate);
            m.setHours(0, 0, 0, 0);

            let isDisabled = day < m;

            if (maxDate) {
              const mx = new Date(maxDate);
              mx.setHours(0, 0, 0, 0);
              if (day > mx) isDisabled = true;
            }

            return isDisabled;
          }}
          initialFocus
          className="border-r border-border"
        />

        {/* Time Selection Columns */}
        <div className="p-3 w-[260px]">
          <Label className="text-xs font-medium text-muted-foreground mb-3 block">
            Time
          </Label>
          <div className="flex h-[260px] border border-border rounded-md overflow-hidden bg-background">
            {/* Hours (12h) */}
            <div className="flex-1 border-r border-border">
              <div className="p-2 text-xs font-medium text-center bg-muted/30 border-b border-border">
                Hr
              </div>
              <ScrollArea className="h-[225px]">
                <div className="p-1 gap-1 flex flex-col" ref={hourRef}>
                  {hours12.map((hour) => {
                    const currentHours24 = selectedDateTime?.getHours() ?? 0;
                    const currentIsPm = currentHours24 >= 12;
                    // Convert 24h to 12h for comparison
                    const selectedHour12 = currentHours24 % 12 || 12;

                    // Calculate testing hour in 24h format based on current AM/PM selection
                    let testHour24 = hour;
                    if (currentIsPm) {
                      if (hour !== 12) testHour24 += 12;
                    } else {
                      if (hour === 12) testHour24 = 0;
                    }

                    let isDisabled =
                      isSameDayAsMin && testHour24 < minDate.getHours();
                    if (!isDisabled && isSameDayAsMax && maxDate) {
                      if (testHour24 > maxDate.getHours()) isDisabled = true;
                    }

                    const isSelected = selectedHour12 === hour;

                    return (
                      <button
                        key={hour}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setTime("hour", hour)}
                        className={cn(
                          "w-full text-center text-sm py-1.5 rounded-sm hover:bg-accent transition-colors",
                          isSelected &&
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                          isDisabled &&
                            "opacity-30 pointer-events-none cursor-not-allowed"
                        )}
                      >
                        {hour.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Minutes */}
            <div className="flex-1 border-r border-border">
              <div className="p-2 text-xs font-medium text-center bg-muted/30 border-b border-border">
                Min
              </div>
              <ScrollArea className="h-[225px]">
                <div className="p-1 gap-1 flex flex-col" ref={minuteRef}>
                  {minutes.map((minute) => {
                    const currentHour = selectedDateTime?.getHours() ?? 0;
                    const minHour = minDate.getHours();
                    const minMinute = minDate.getMinutes();

                    let isDisabled = false;
                    if (isSameDayAsMin) {
                      if (currentHour < minHour) {
                        isDisabled = true;
                      } else if (currentHour === minHour) {
                        isDisabled = minute < minMinute;
                      }
                    }

                    if (!isDisabled && isSameDayAsMax && maxDate) {
                      const maxHour = maxDate.getHours();
                      const maxMinute = maxDate.getMinutes();
                      if (currentHour > maxHour) {
                        isDisabled = true;
                      } else if (currentHour === maxHour) {
                        if (minute > maxMinute) isDisabled = true;
                      }
                    }

                    const isSelected =
                      selectedDateTime?.getMinutes() === minute;

                    return (
                      <button
                        key={minute}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setTime("minute", minute)}
                        className={cn(
                          "w-full text-center text-sm py-1.5 rounded-sm hover:bg-accent transition-colors",
                          isSelected &&
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                          isDisabled &&
                            "opacity-30 pointer-events-none cursor-not-allowed"
                        )}
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* AM/PM */}
            <div className="flex-1">
              <div className="p-2 text-xs font-medium text-center bg-muted/30 border-b border-border">
                Period
              </div>
              <ScrollArea className="h-[225px]">
                <div className="p-1 gap-1 flex flex-col" ref={ampmRef}>
                  {ampmOptions.map((opt, index) => {
                    // 0=AM, 1=PM
                    const minHour = minDate.getHours();
                    let isDisabled = false;
                    if (isSameDayAsMin) {
                      // If current min time is PM (>=12), then AM (index 0) is disabled
                      if (index === 0 && minHour >= 12) {
                        isDisabled = true;
                      }
                    }

                    if (!isDisabled && isSameDayAsMax && maxDate) {
                      const maxHour = maxDate.getHours();
                      // If max time is AM (<12), then PM (index 1) is disabled
                      if (index === 1 && maxHour < 12) {
                        isDisabled = true;
                      }
                    }

                    const currentHour = selectedDateTime?.getHours() ?? 0;
                    // Highlighting
                    const isSelected =
                      (index === 0 && currentHour < 12) ||
                      (index === 1 && currentHour >= 12);

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setTime("ampm", index)}
                        className={cn(
                          "w-full text-center text-sm py-1.5 rounded-sm hover:bg-accent transition-colors",
                          isSelected &&
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                          isDisabled &&
                            "opacity-30 pointer-events-none cursor-not-allowed"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
