import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StreakCalendarProps {
  completedDays: boolean[];
}

const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

export default function StreakCalendar({ completedDays }: StreakCalendarProps) {
  const today = new Date().getDay();

  return (
    <div className="space-y-3" data-testid="streak-calendar">
      <h3 className="text-sm font-medium text-foreground">7-Day Streak</h3>
      <div className="flex justify-between gap-2">
        {daysOfWeek.map((day, index) => {
          const isCompleted = completedDays[index];
          const isToday = index === today;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex flex-col items-center gap-1"
              data-testid={`streak-day-${index}`}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {day}
              </span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isToday
                    ? "border-primary bg-background animate-pulse"
                    : "border-muted bg-background"
                }`}
              >
                {isCompleted && <Check className="w-5 h-5" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
