import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="space-y-2" data-testid="progress-section">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {label || "Today's Practice"}
        </span>
        <span className="text-sm font-semibold text-primary" data-testid="progress-text">
          {current}/{total} min
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-wellness rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
