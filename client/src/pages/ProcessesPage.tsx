import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import type { CmsModule, CmsCourse, FrontendFeature } from "@shared/schema";

interface FeatureResponse {
  feature: FrontendFeature;
  course: CmsCourse | null;
  modules: CmsModule[];
}

function ModulesList({ 
  modules, 
  isLoading, 
  error,
  featureLabel 
}: { 
  modules: CmsModule[]; 
  isLoading: boolean; 
  error: Error | null;
  featureLabel: string;
}) {
  const [, setLocation] = useLocation();

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
        <h3 className="text-lg font-semibold text-foreground mb-2">No Modules Yet</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          {featureLabel} content is being prepared. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, index) => (
        <Card
          key={module.id}
          className="p-4 hover-elevate active-elevate-2 cursor-pointer"
          onClick={() => setLocation(`/processes/module/${module.id}`)}
          data-testid={`card-module-${module.id}`}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#F3F0FF" }}
            >
              <BookOpen className="w-6 h-6" style={{ color: "#703DFA" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{module.title}</h3>
              {module.description && (
                <p className="text-sm text-muted-foreground truncate">{module.description}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ProcessesPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("DYD");

  const { data: dydData, isLoading: dydLoading, error: dydError } = useQuery<FeatureResponse>({
    queryKey: ["/api/public/v1/features", "DYD"],
    queryFn: async () => {
      const response = await fetch("/api/public/v1/features/DYD");
      if (!response.ok) throw new Error("Failed to fetch DYD content");
      return response.json();
    },
  });

  const { data: usmData, isLoading: usmLoading, error: usmError } = useQuery<FeatureResponse>({
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4" data-testid="tabs-processes">
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
