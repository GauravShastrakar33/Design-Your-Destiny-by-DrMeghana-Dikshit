import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch, useParams } from "wouter";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Play,
  Layers,
  BookOpen,
  FolderOpen,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
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
  CmsModuleFolder,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureResponse {
  feature: FrontendFeature;
  course: CmsCourse | null;
  modules: CmsModule[];
}

interface ModuleLessonsResponse {
  module: CmsModule;
  folders: CmsModuleFolder[];
  lessons: CmsLesson[];
}

function LessonItem({
  lesson,
  index,
  moduleId,
  onClick,
  isLast,
}: {
  lesson: CmsLesson;
  index: number;
  moduleId: number;
  onClick: (lessonId: number, moduleId: number) => void;
  isLast?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`px-5 py-3.5 flex items-center gap-4 cursor-pointer transition-all hover:bg-brand/5 group/lesson border-b border-gray-100 ${
        isLast ? "border-b-0" : ""
      } last:border-b-0`}
      onClick={() => onClick(lesson.id, moduleId)}
      data-testid={`lesson-item-${lesson.id}`}
    >
      <div className="w-6 text-sm font-black text-slate-300 group-hover/lesson:text-brand transition-colors flex-shrink-0 tabular-nums">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 group-hover/lesson:text-brand transition-colors truncate">
          {lesson.title}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover/lesson:text-brand transition-colors" />
    </motion.div>
  );
}

function FolderAccordion({
  folder,
  index,
  lessons,
  moduleId,
  onLessonClick,
}: {
  folder: CmsModuleFolder;
  index: number;
  lessons: CmsLesson[];
  moduleId: number;
  onLessonClick: (lessonId: number, moduleId: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <div className="px-5 py-4 hover:bg-amber-50/50 cursor-pointer transition-all flex items-center gap-4 group/folder">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover/folder:scale-110 transition-transform">
              <FolderOpen className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 group-hover/folder:text-amber-700 transition-colors truncate">
                {folder.title}
              </h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {lessons.length} {lessons.length === 1 ? "Lesson" : "Lessons"}
              </p>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isOpen ? "bg-amber-500 text-white" : "text-gray-300"
              }`}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-gray-50/30"
              >
                {lessons.map((lesson, lessonIndex) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    index={lessonIndex}
                    moduleId={moduleId}
                    onClick={onLessonClick}
                    isLast={lessonIndex === lessons.length - 1}
                  />
                ))}
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </div>
  );
}

function ModuleAccordion({
  module,
  index,
  isOpen,
  onToggle,
  featureType,
}: {
  module: CmsModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  featureType: string;
}) {
  const params = useParams();
  const processType = params.type || "dyd";
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth(); // Imported from AuthContext

  const { data, isLoading } = useQuery<ModuleLessonsResponse>({
    queryKey: ["/api/public/v1/modules", module.id],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/public/v1/modules/${module.id}`
      );
      return response.json();
    },
    enabled: isOpen && isAuthenticated,
  });

  const folders = data?.folders || [];
  const allLessons = data?.lessons || [];

  const rootLessons = allLessons.filter((l) => !l.folderId);
  const getLessonsForFolder = (folderId: number) =>
    allLessons.filter((l) => l.folderId === folderId);

  const handleLessonClick = (lessonId: number, moduleId: number) => {
    setLocation(
      `/processes/${processType}/lesson/${lessonId}?moduleId=${moduleId}`
    );
  };

  const hasContent = folders.length > 0 || rootLessons.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card
          className={`overflow-hidden transition-all duration-300 border-0 shadow-lg shadow-black/[0.03] rounded-2xl group/module mb-3 ${
            isOpen
              ? "ring-2 ring-brand/10 bg-white"
              : "hover:shadow-xl hover:shadow-black/[0.04] bg-white"
          }`}
          data-testid={`card-module-${module.id}`}
        >
          <CollapsibleTrigger asChild>
            <div className="p-3 cursor-pointer flex items-center gap-4 active:scale-[0.99] transition-transform">
              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden group/icon">
                <span className="relative z-10">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`text-base font-bold transition-colors truncate ${
                    isOpen
                      ? "text-brand"
                      : "text-gray-900 group-hover/module:text-brand"
                  }`}
                  title={module.title}
                >
                  {module.title}
                </h3>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isOpen
                    ? "bg-brand text-white"
                    : "bg-gray-50 text-muted-foreground group-hover/module:bg-brand/5 group-hover/module:text-brand"
                }`}
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <AnimatePresence>
            {isOpen && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-100 py-1">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                        <p className="text-[10px] font-bold text-muted-foreground animate-pulse uppercase tracking-[0.2em]">
                          Curating Content...
                        </p>
                      </div>
                    ) : !hasContent ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4 text-center px-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                          <BookOpen className="w-6 h-6 text-brand/20" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">
                          Coming Soon
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {rootLessons.map((lesson, lessonIndex) => (
                          <LessonItem
                            key={lesson.id}
                            lesson={lesson}
                            index={lessonIndex}
                            moduleId={module.id}
                            onClick={handleLessonClick}
                            isLast={
                              lessonIndex === rootLessons.length - 1 &&
                              folders.length === 0
                            }
                          />
                        ))}

                        {folders.map((folder, folderIndex) => (
                          <FolderAccordion
                            key={folder.id}
                            folder={folder}
                            index={folderIndex}
                            lessons={getLessonsForFolder(folder.id)}
                            moduleId={module.id}
                            onLessonClick={handleLessonClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </Collapsible>
    </motion.div>
  );
}

import { RowSkeleton } from "@/components/SkeletonLoaders";

function ModulesList({
  modules,
  isLoading,
  error,
  featureLabel,
  featureType,
}: {
  modules: CmsModule[];
  isLoading: boolean;
  error: Error | null;
  featureLabel: string;
  featureType: string;
}) {
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground text-md">
        Failed to load {featureLabel} content
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border-0 shadow-xl shadow-black/[0.02]"
      >
        <div className="w-20 h-20 bg-brand/5 rounded-3xl flex items-center justify-center mb-6 scale-110 rotate-3">
          <Sparkles className="w-10 h-10 text-brand" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Content Blossoming
        </h3>
        <p className="text-muted-foreground text-sm max-w-[240px] font-medium leading-relaxed">
          The {featureLabel} journey is being carefully prepared for you.
        </p>
      </motion.div>
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
          featureType={featureType}
        />
      ))}
    </div>
  );
}

export default function ProcessesPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const processTypeFromParam = params.type?.toUpperCase() || "DYD";

  const [activeTab, setActiveTab] = useState(
    processTypeFromParam === "USM" ? "USM" : "DYD"
  );
  const { isAuthenticated } = useAuth();

  // Update active tab when URL param changes
  useEffect(() => {
    if (params.type) {
      const type = params.type.toUpperCase();
      if (type === "DYD" || type === "USM") {
        setActiveTab(type);
      }
    }
  }, [params.type]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/processes/${value.toLowerCase()}`, { replace: true });
  };

  const {
    data: dydData,
    isLoading: dydLoading,
    error: dydError,
  } = useQuery<FeatureResponse>({
    queryKey: ["/api/public/v1/features", "DYD"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public/v1/features/DYD");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const {
    data: usmData,
    isLoading: usmLoading,
    error: usmError,
  } = useQuery<FeatureResponse>({
    queryKey: ["/api/public/v1/features", "USM"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public/v1/features/USM");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen pb-24 bg-[#F8F9FB]">
      <Header
        title="Processes"
        hasBackButton={true}
        onBack={() => setLocation("/home")}
        maxWidthClassName="max-w-3xl md:max-w-5xl"
      />

      <main className="max-w-3xl md:max-w-5xl mx-auto p-4 pt-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList
              className="
                w-full
                h-14
                grid grid-cols-2
                rounded-xl
                bg-white
                shadow-lg shadow-black/[0.03]
                p-1.5
                mb-4
              "
              data-testid="tabs-processes"
            >
              <TabsTrigger
                value="DYD"
                className="
                  h-full
                  rounded-lg
                  text-sm
                  font-bold
                  transition-all
                  data-[state=active]:bg-brand
                  data-[state=active]:text-white
                  data-[state=active]:shadow-lg
                  data-[state=active]:shadow-brand/20
                "
                data-testid="tab-dyd"
              >
                DYD
              </TabsTrigger>
              <TabsTrigger
                value="USM"
                className="
                  h-full
                  rounded-lg
                  text-sm
                  font-bold
                  transition-all
                  data-[state=active]:bg-brand
                  data-[state=active]:text-white
                  data-[state=active]:shadow-lg
                  data-[state=active]:shadow-brand/20
                "
                data-testid="tab-usm"
              >
                USM
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent
                  value="DYD"
                  className="mt-0 focus-visible:outline-none"
                >
                  <ModulesList
                    modules={dydData?.modules || []}
                    isLoading={dydLoading}
                    error={dydError as Error | null}
                    featureLabel="DYD"
                    featureType="DYD"
                  />
                </TabsContent>

                <TabsContent
                  value="USM"
                  className="mt-0 focus-visible:outline-none"
                >
                  <ModulesList
                    modules={usmData?.modules || []}
                    isLoading={usmLoading}
                    error={usmError as Error | null}
                    featureLabel="USM"
                    featureType="USM"
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
