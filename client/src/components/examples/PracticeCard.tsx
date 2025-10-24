import PracticeCard from '../PracticeCard';
import { Brain } from 'lucide-react';

export default function PracticeCardExample() {
  return (
    <PracticeCard
      title="Recognition"
      icon={Brain}
      script="This is a sample recognition practice script."
    />
  );
}
