import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Zap,
  Link2,
  Heart,
  Waves,
  Users,
  Laugh,
  Baby,
  BookHeart,
  DollarSign,
  AlertCircle,
  Smile,
  Flame,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "wouter";
import PracticeCard from "@/components/PracticeCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getPracticeMedia } from "@/lib/practiceMedia";

const usmPractices = [
  { id: 1, title: "Growth Activation", icon: Brain },
  { id: 2, title: "Release Processes", icon: Brain },
  { id: 3, title: "Neuro-Coupling", icon: Link2 },
  { id: 4, title: "CAB Processes", icon: Heart },
  { id: 5, title: "OTB", icon: Waves },
  { id: 6, title: "Soul Connection", icon: Users },
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
      { id: 14, title: "Clearing the Birth Energy", icon: Baby },
      { id: 15, title: "ADOPTION.mp3", icon: Heart },
      { id: 16, title: "ATTEMPTED_ABORTION_OR_MISCARRIAGE", icon: Heart },
      { id: 17, title: "CESAREAN_SECTION", icon: AlertCircle },
      { id: 18, title: "DRUGS", icon: Zap },
      { id: 34, title: "FORCEPS", icon: Baby },
      { id: 36, title: "INDUCED_BIRTH", icon: Baby },
      { id: 35, title: "PASSED_YOUR_DUE_DATE_LATE.mp3", icon: Baby },
      { id: 27, title: "SLOW_AND_LONG_LABOUR", icon: Baby },
      { id: 28, title: "TOO_SOON_OR_TOO_FAST", icon: Baby },
      {
        id: 29,
        title: "TRANSVERSE_OR_BREACH_BIRTH_AND_POSTERIOR_BIRTH",
        icon: Baby,
      },
      { id: 30, title: "TRAUMA_OR_EMERGENCY_SITUATION", icon: Baby },
      { id: 31, title: "TWINS", icon: Baby },
      { id: 32, title: "UNWANTED_UNPLANNED_ILLEGITIMATE", icon: Baby },
      { id: 33, title: "WRONG_SEX", icon: Baby },
      { id: 19, title: "Pre-BirthStory-RashmiMam", icon: Baby },
      { id: 26, title: "Pre-BirthStory", icon: Baby },
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
    title: "Kaya Kalp Kriya",
    icon: Smile,
  },
  {
    type: "practice" as const,
    id: 25,
    title: "Masculaline Feminine Energy Balance",
    icon: Smile,
  },
];

export default function ProcessesPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"DYD" | "USM">(
    "DYD",
  );
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
    <div className="min-h-screen pb-20 bg-page-bg">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="py-4 relative flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="absolute left-4 hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase">
              PROCESSES
            </h1>
          </div>

          <div className="px-4 pb-4">
            <div
              className="bg-white border border-gray-200 p-1 rounded-lg inline-flex w-full max-w-xs mx-auto"
              data-testid="category-selector"
            >
              {["DYD", "USM"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedCategory(option as "DYD" | "USM")}
                  className={`flex-1 px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === option
                      ? "bg-brand text-brand-foreground"
                      : "text-gray-600 hover-elevate"
                  }`}
                  data-testid={`segment-${option.toLowerCase()}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-3" key={selectedCategory}>
          {selectedCategory === "USM"
            ? usmPractices.map((practice) => {
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
                    testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                );
              })
            : dydPracticesData.map((item) => {
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
                          data-testid={`category-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-6 h-6 flex-shrink-0 text-brand" />
                            <span className="font-semibold text-gray-900">
                              {item.title}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-brand transition-transform duration-200 ${
                              isOpen ? "rotate-180" : "rotate-0"
                            }`}
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
                              testId={`practice-${practice.title.toLowerCase().replace(/\s+/g, "-")}`}
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
                      testId={`practice-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    />
                  );
                }
              })}
        </div>
      </div>
    </div>
  );
}
