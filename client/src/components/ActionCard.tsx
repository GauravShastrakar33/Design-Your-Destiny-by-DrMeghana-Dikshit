import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ActionCardProps {
  title: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
  testId?: string;
}

export default function ActionCard({ title, icon: Icon, gradient, onClick, testId }: ActionCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        className={`${gradient} p-6 min-h-[140px] flex flex-col items-center justify-center gap-3 cursor-pointer border-0 hover-elevate active-elevate-2`}
        onClick={onClick}
        data-testid={testId}
      >
        <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold text-white text-center leading-tight">
          {title}
        </h3>
      </Card>
    </motion.div>
  );
}
