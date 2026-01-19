import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Play,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  CmsModule,
  CmsCourse,
  FrontendFeature,
  CmsLesson,
} from "@shared/schema";

interface FeatureResponse {
  feature: FrontendFeature;
  course: CmsCourse | null;
  modules: CmsModule[];
}

interface ModuleLessonsResponse {
  module: CmsModule;
  lessons: CmsLesson[];
}

function ModuleAccordion({
  module,
  index,
  isOpen,
  onToggle,
}: {
  module: CmsModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<ModuleLessonsResponse>({
    queryKey: ["/api/public/v1/modules", module.id],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/modules/${module.id}`);
      if (!response.ok) throw new Error("Failed to fetch module");
      return response.json();
    },
    enabled: isOpen,
  });

  const lessons = data?.lessons || [];

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card
        className="overflow-hidden"
        data-testid={`card-module-${module.id}`}
      >
        <CollapsibleTrigger asChild>
          <div className="py-3 px-4 hover-elevate active-elevate-2 cursor-pointer flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border border-brand/30 text-brand text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {module.title}
              </h3>
            </div>
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No content available yet
              </div>
            ) : (
              <div className="py-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
                    onClick={() =>
                      setLocation(
                        `/processes/lesson/${lesson.id}?moduleId=${module.id}`,
                      )
                    }
                    data-testid={`lesson-item-${lesson.id}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-brand/15 text-brand text-[11px] font-medium flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">
                        {lesson.title}
                      </p>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                      <Play className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function ModulesList({
  modules,
  isLoading,
  error,
  featureLabel,
}: {
  modules: CmsModule[];
  isLoading: boolean;
  error: Error | null;
  featureLabel: string;
}) {
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load {featureLabel} content
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-brand" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Content Yet
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          {featureLabel} content is being prepared. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, index) => (
        <ModuleAccordion
          key={module.id}
          module={module}
          index={index}
          isOpen={openModuleId === module.id}
          onToggle={() =>
            setOpenModuleId(openModuleId === module.id ? null : module.id)
          }
        />
      ))}
    </div>
  );
}

export default function ProcessesPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("DYD");

  const {
    data: dydData,
    isLoading: dydLoading,
    error: dydError,
  } = useQuery<FeatureResponse>({
    queryKey: ["/api/public/v1/features", "DYD"],
    queryFn: async () => {
      const response = await fetch("/api/public/v1/features/DYD");
      if (!response.ok) throw new Error("Failed to fetch DYD content");
      return response.json();
    },
  });

  const {
    data: usmData,
    isLoading: usmLoading,
    error: usmError,
  } = useQuery<FeatureResponse>({
    queryKey: ["/api/public/v1/features", "USM"],
    queryFn: async () => {
      const response = await fetch("/api/public/v1/features/USM");
      if (!response.ok) throw new Error("Failed to fetch USM content");
      return response.json();
    },
  });

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

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase whitespace-nowrap">
              PROCESSES
            </h1>
          </div>
        </div>

        <div className="px-4 pt-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList
              className="w-full grid grid-cols-2 mb-4"
              data-testid="tabs-processes"
            >
              <TabsTrigger
                value="DYD"
                className="data-[state=active]:bg-brand data-[state=active]:text-white"
                data-testid="tab-dyd"
              >
                DYD Processes
              </TabsTrigger>
              <TabsTrigger
                value="USM"
                className="data-[state=active]:bg-brand data-[state=active]:text-white"
                data-testid="tab-usm"
              >
                USM Processes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="DYD" className="mt-0">
              <ModulesList
                modules={dydData?.modules || []}
                isLoading={dydLoading}
                error={dydError as Error | null}
                featureLabel="DYD Processes"
              />
            </TabsContent>

            <TabsContent value="USM" className="mt-0">
              <ModulesList
                modules={usmData?.modules || []}
                isLoading={usmLoading}
                error={usmError as Error | null}
                featureLabel="USM Processes"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
