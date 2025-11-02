import { useState } from "react";
import { ArrowLeft, Brain, Zap, Link2, Heart, Waves, Users, Laugh, Baby, BookHeart, DollarSign, AlertCircle, Smile, Flame } from "lucide-react";
import { useLocation } from "wouter";
import SegmentedControl from "@/components/SegmentedControl";
import PracticeCard from "@/components/PracticeCard";

const usmPractices = [
  { id: 1, title: "Recognition", icon: Brain },
  { id: 2, title: "Vibration Elevation", icon: Zap },
  { id: 3, title: "Neurolinking", icon: Link2 },
  { id: 4, title: "EET", icon: Heart },
  { id: 5, title: "Hoponopono", icon: Waves },
  { id: 6, title: "Soul Connection", icon: Users },
  { id: 7, title: "Donald Duck", icon: Laugh },
  { id: 8, title: "Inner Child Healing", icon: Baby },
  { id: 9, title: "Journaling", icon: BookHeart },
];

const dydPractices = [
  { id: 10, title: "Wealth Code Activation 1", icon: DollarSign },
  { id: 11, title: "Wealth Code Activation 2", icon: DollarSign },
  { id: 12, title: "Wealth Code Activation 3", icon: DollarSign },
  { id: 13, title: "Wealth Code Activation 4", icon: DollarSign },
  { id: 14, title: "Birth Story Healing", icon: Baby },
  { id: 15, title: "Adoption", icon: Heart },
  { id: 16, title: "Miscarriage", icon: Heart },
  { id: 17, title: "Cesarean", icon: AlertCircle },
  { id: 18, title: "Clearing the Birth Energy", icon: Zap },
  { id: 19, title: "Pre-Birth Story Process", icon: Baby },
  { id: 20, title: "Anxiety Relief Code 1", icon: Waves },
  { id: 21, title: "Anxiety Relief Code 2", icon: Waves },
  { id: 22, title: "Happiness Code Activation 1", icon: Smile },
  { id: 23, title: "Happiness Code Activation 2", icon: Smile },
  { id: 24, title: "Story Burning", icon: Flame },
];

export default function ProcessesPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"DYD" | "USM">("DYD");

  const practices = selectedCategory === "USM" ? usmPractices : dydPractices;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Processes</h1>
          </div>
          <div className="px-4 pb-4">
            <SegmentedControl
              options={["DYD", "USM"]}
              selected={selectedCategory}
              onChange={(val) => setSelectedCategory(val as "DYD" | "USM")}
              testId="category-selector"
            />
          </div>
        </div>

        <div className="px-4 py-6 space-y-3">
          {practices.map((practice) => (
            <PracticeCard
              key={practice.id}
              title={practice.title}
              icon={practice.icon}
              practiceId={practice.id}
              testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
