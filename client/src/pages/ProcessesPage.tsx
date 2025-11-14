import { useState } from "react";
import { ArrowLeft, Brain, Zap, Link2, Heart, Waves, Users, Laugh, Baby, BookHeart, DollarSign, AlertCircle, Smile, Flame, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import PracticeCard from "@/components/PracticeCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPracticeMedia } from "@/lib/practiceMedia";

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
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>
            <h1 className="text-xl font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase">
              PROCESSES
            </h1>
          </div>
          <div className="px-4 pb-4">
            <div className="bg-white border border-gray-200 p-1 rounded-lg inline-flex w-full max-w-xs mx-auto" data-testid="category-selector">
              {["DYD", "USM"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedCategory(option as "DYD" | "USM")}
                  className={`flex-1 px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === option
                      ? "text-white"
                      : "text-gray-600 hover-elevate"
                  }`}
                  style={{
                    backgroundColor: selectedCategory === option ? "#703DFA" : "transparent",
                  }}
                  data-testid={`segment-${option.toLowerCase()}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-3" key={selectedCategory}>
          {selectedCategory === "USM" ? (
            usmPractices.map((practice) => {
              const media = getPracticeMedia(practice.id);
              return (
                <PracticeCard
                  key={practice.id}
                  title={practice.title}
                  icon={practice.icon}
                  practiceId={practice.id}
                  videoUrl={media?.videoUrl}
                  audioUrl={media?.audioUrl}
                  script={media?.script}
                  testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, '-')}`}
                />
              );
            })
          ) : (
            dydPracticesData.map((item) => {
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
                        className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover-elevate active-elevate-2"
                        data-testid={`category-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 flex-shrink-0" style={{ color: "#703DFA" }} />
                          <span className="font-semibold text-gray-900">{item.title}</span>
                        </div>
                        <ChevronDown
                          className="w-5 h-5 transition-transform duration-200"
                          style={{
                            color: "#703DFA",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2 ml-4">
                      {item.practices.map((practice) => {
                        const media = getPracticeMedia(practice.id);
                        return (
                          <PracticeCard
                            key={practice.id}
                            title={practice.title}
                            icon={practice.icon}
                            practiceId={practice.id}
                            videoUrl={media?.videoUrl}
                            audioUrl={media?.audioUrl}
                            script={media?.script}
                            testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              } else {
                const media = getPracticeMedia(item.id);
                return (
                  <PracticeCard
                    key={item.id}
                    title={item.title}
                    icon={item.icon}
                    practiceId={item.id}
                    videoUrl={media?.videoUrl}
                    audioUrl={media?.audioUrl}
                    script={media?.script}
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
