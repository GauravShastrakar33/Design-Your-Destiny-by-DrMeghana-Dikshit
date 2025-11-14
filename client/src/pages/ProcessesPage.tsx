import { useState } from "react";
import { ArrowLeft, Brain, Zap, Link2, Heart, Waves, Users, Laugh, Baby, BookHeart, DollarSign, AlertCircle, Smile, Flame, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import SegmentedControl from "@/components/SegmentedControl";
import PracticeCard from "@/components/PracticeCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const dydPracticesData = [
  {
    type: "category" as const,
    title: "Wealth Code Activation",
    icon: DollarSign,
    practices: [
      { id: 10, title: "Wealth Code Activation 1", icon: DollarSign },
      { id: 11, title: "Wealth Code Activation 2", icon: DollarSign },
      { id: 12, title: "Wealth Code Activation 3", icon: DollarSign },
      { id: 13, title: "Wealth Code Activation 4", icon: DollarSign },
    ],
  },
  {
    type: "category" as const,
    title: "Birth story-Specialisation",
    icon: Baby,
    practices: [
      { id: 14, title: "Birth Story Healing", icon: Baby },
      { id: 15, title: "Adoption", icon: Heart },
      { id: 16, title: "Miscarriage", icon: Heart },
      { id: 17, title: "Cesarean", icon: AlertCircle },
      { id: 18, title: "Clearing the Birth Energy", icon: Zap },
      { id: 19, title: "Pre-Birth Story Process", icon: Baby },
    ],
  },
  {
    type: "category" as const,
    title: "Anxiety Relief Code",
    icon: Waves,
    practices: [
      { id: 20, title: "Anxiety Relief Code 1", icon: Waves },
      { id: 21, title: "Anxiety Relief Code 2", icon: Waves },
    ],
  },
  {
    type: "category" as const,
    title: "Happiness Code Activation",
    icon: Smile,
    practices: [
      { id: 22, title: "Happiness Code Activation 1", icon: Smile },
      { id: 23, title: "Happiness Code Activation 2", icon: Smile },
    ],
  },
  {
    type: "practice" as const,
    id: 24,
    title: "Story Burning",
    icon: Flame,
  },
];

export default function ProcessesPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"DYD" | "USM">("DYD");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (title: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

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

        <div className="px-4 py-6 space-y-3" key={selectedCategory}>
          {selectedCategory === "USM" ? (
            usmPractices.map((practice) => (
              <PracticeCard
                key={practice.id}
                title={practice.title}
                icon={practice.icon}
                practiceId={practice.id}
                testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))
          ) : (
            dydPracticesData.map((item, index) => {
              if (item.type === "category") {
                const isOpen = openCategories.has(item.title);
                const Icon = item.icon;
                return (
                  <Collapsible
                    key={item.title}
                    open={isOpen}
                    onOpenChange={() => toggleCategory(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className="bg-card border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover-elevate active-elevate-2"
                        data-testid={`category-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5" style={{ color: "#703DFA" }} />
                          </div>
                          <span className="font-semibold text-foreground">{item.title}</span>
                        </div>
                        <ChevronDown
                          className="w-5 h-5 text-muted-foreground transition-transform duration-200"
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2 ml-4">
                      {item.practices.map((practice) => (
                        <PracticeCard
                          key={practice.id}
                          title={practice.title}
                          icon={practice.icon}
                          practiceId={practice.id}
                          testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              } else {
                return (
                  <PracticeCard
                    key={item.id}
                    title={item.title}
                    icon={item.icon}
                    practiceId={item.id}
                    testId={`practice-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                );
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}
