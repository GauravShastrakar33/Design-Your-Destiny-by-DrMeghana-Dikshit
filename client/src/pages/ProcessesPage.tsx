import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Zap,
  Link2,
  Heart,
  Waves,
  Users,
  Baby,
  DollarSign,
  AlertCircle,
  Smile,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PracticeCard from "@/components/PracticeCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Comprehensive icon mapping from string names to Lucide components
// Import all common Lucide icons for flexibility
import {
  Sparkles,
  Feather,
  BookHeart as BookHeartIcon,
  Laugh as LaughIcon,
  Flame,
  Target,
  Shield,
  Star,
  Crown,
  Gift,
  Lightbulb,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Brain,
  Zap,
  Link2,
  Heart,
  Waves,
  Users,
  Baby,
  DollarSign,
  AlertCircle,
  Smile,
  Sparkles,
  Feather,
  BookHeart: BookHeartIcon,
  Laugh: LaughIcon,
  Flame,
  Target,
  Shield,
  Star,
  Crown,
  Gift,
  Lightbulb,
};

interface Process {
  id: number;
  title: string;
  description: string | null;
  folderId: number;
  subfolderId: number | null;
  videoUrl: string | null;
  audioUrl: string | null;
  scriptUrl: string | null;
  iconName: string;
  displayOrder: number;
}

interface ProcessSubfolder {
  id: number;
  name: string;
  folderId: number;
  displayOrder: number;
  processes: Process[];
}

interface ProcessFolder {
  id: number;
  name: string;
  type: string;
  displayOrder: number;
  subfolders: ProcessSubfolder[];
  processes: Process[];
}

interface ProcessLibrary {
  [type: string]: ProcessFolder[];
}

export default function ProcessesPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"DYD" | "USM">("DYD");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const { data: library, isLoading } = useQuery<ProcessLibrary>({
    queryKey: ["/api/process-library"],
  });

  const toggleCategory = (key: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Brain;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-page-bg flex items-center justify-center">
        <div className="text-gray-500">Loading processes...</div>
      </div>
    );
  }

  const currentFolders = library?.[selectedCategory] || [];

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
          {selectedCategory === "USM" ? (
            currentFolders.flatMap((folder) => {
              const folderProcesses = folder.processes.map((process) => (
                <PracticeCard
                  key={process.id}
                  title={process.title}
                  icon={getIcon(process.iconName)}
                  practiceId={process.id}
                  videoUrl={process.videoUrl || undefined}
                  audioUrl={process.audioUrl || undefined}
                  script={process.scriptUrl || undefined}
                  testId={`practice-${process.title.toLowerCase().replace(/\s+/g, "-")}`}
                />
              ));
              
              const subfolderProcesses = folder.subfolders.flatMap((subfolder) =>
                subfolder.processes.map((process) => (
                  <PracticeCard
                    key={process.id}
                    title={process.title}
                    icon={getIcon(process.iconName)}
                    practiceId={process.id}
                    videoUrl={process.videoUrl || undefined}
                    audioUrl={process.audioUrl || undefined}
                    script={process.scriptUrl || undefined}
                    testId={`practice-${process.title.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                ))
              );
              
              return [...folderProcesses, ...subfolderProcesses];
            })
          ) : (
            currentFolders.flatMap((folder) => {
              const hasSubfolders = folder.subfolders.length > 0;
              const hasProcesses = folder.processes.length > 0;
              
              // Skip empty folders
              if (!hasSubfolders && !hasProcesses) {
                return [];
              }
              
              // If folder has content (processes and/or subfolders), wrap in folder header
              const folderKey = `folder-${folder.id}`;
              const isOpen = openCategories.has(folderKey);
              const Icon = getIcon(
                folder.processes[0]?.iconName || 
                folder.subfolders[0]?.processes[0]?.iconName || 
                "Brain"
              );
              
              return (
                <Collapsible
                  key={folder.id}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(folderKey)}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover-elevate active-elevate-2"
                      data-testid={`category-${folder.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 flex-shrink-0 text-brand" />
                        <span className="font-semibold text-gray-900">
                          {folder.name}
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
                    {/* Render folder-level processes first */}
                    {folder.processes.map((process) => (
                      <PracticeCard
                        key={`process-${process.id}`}
                        title={process.title}
                        icon={getIcon(process.iconName)}
                        practiceId={process.id}
                        videoUrl={process.videoUrl || undefined}
                        audioUrl={process.audioUrl || undefined}
                        script={process.scriptUrl || undefined}
                        testId={`practice-${process.title.toLowerCase().replace(/\s+/g, "-")}`}
                        hideIcon={true}
                      />
                    ))}
                    
                    {/* Render subfolders as nested collapsibles */}
                    {folder.subfolders.map((subfolder) => {
                      const subfolderKey = `subfolder-${subfolder.id}`;
                      const subfolderIsOpen = openCategories.has(subfolderKey);
                      const SubfolderIcon = getIcon(subfolder.processes[0]?.iconName || "Brain");
                      
                      return (
                        <Collapsible
                          key={`subfolder-${subfolder.id}`}
                          open={subfolderIsOpen}
                          onOpenChange={() => toggleCategory(subfolderKey)}
                        >
                          <CollapsibleTrigger asChild>
                            <div
                              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover-elevate active-elevate-2"
                              data-testid={`category-${subfolder.name.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              <div className="flex items-center gap-3">
                                <SubfolderIcon className="w-6 h-6 flex-shrink-0 text-brand" />
                                <span className="font-semibold text-gray-900">
                                  {subfolder.name}
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 text-brand transition-transform duration-200 ${
                                  subfolderIsOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2 mt-2 ml-4">
                            {subfolder.processes.map((process) => (
                              <PracticeCard
                                key={`subfolder-${subfolder.id}-process-${process.id}`}
                                title={process.title}
                                icon={getIcon(process.iconName)}
                                practiceId={process.id}
                                videoUrl={process.videoUrl || undefined}
                                audioUrl={process.audioUrl || undefined}
                                script={process.scriptUrl || undefined}
                                testId={`practice-${process.title.toLowerCase().replace(/\s+/g, "-")}`}
                                hideIcon={true}
                              />
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
