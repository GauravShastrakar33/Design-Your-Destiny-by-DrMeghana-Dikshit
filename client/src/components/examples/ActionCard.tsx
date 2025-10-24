import ActionCard from '../ActionCard';
import { Sparkles } from 'lucide-react';

export default function ActionCardExample() {
  return (
    <ActionCard
      title="Processes"
      icon={Sparkles}
      gradient="bg-gradient-wellness"
      onClick={() => console.log('Card clicked')}
    />
  );
}
