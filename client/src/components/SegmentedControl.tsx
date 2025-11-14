import { motion } from "framer-motion";

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  testId?: string;
}

export default function SegmentedControl({ options, selected, onChange, testId }: SegmentedControlProps) {
  return (
    <div className="bg-muted p-1 rounded-full inline-flex w-full max-w-xs mx-auto" data-testid={testId}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex-1 relative px-6 py-2 text-sm font-medium transition-colors rounded-full ${
            selected === option
              ? "text-brand-foreground"
              : "text-muted-foreground hover-elevate"
          }`}
          data-testid={`segment-${option.toLowerCase()}`}
        >
          {selected === option && (
            <motion.div
              layoutId="segmented-control"
              className="absolute inset-0 bg-brand rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{option}</span>
        </button>
      ))}
    </div>
  );
}
