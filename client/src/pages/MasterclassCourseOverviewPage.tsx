import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { CmsCourse, CmsModule, CmsLesson } from "@shared/schema";

interface ModuleWithLessons extends CmsModule {
  lessons: CmsLesson[];
}

interface CourseResponse {
  course: CmsCourse;
  modules: ModuleWithLessons[];
}

export default function MasterclassCourseOverviewPage() {
  const params = useParams();
  const courseId = params.courseId;
  const [, setLocation] = useLocation();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );

  const { data, isLoading, error } = useQuery<CourseResponse>({
    queryKey: ["/api/public/v1/courses", courseId, "full"],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/courses/${courseId}/full`);
      if (!response.ok) throw new Error("Failed to fetch course");
      return response.json();
    },
    enabled: !!courseId,
  });

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleLessonClick = (moduleId: number, lessonId: number) => {
    setLocation(
      `/masterclasses/lesson/${lessonId}?moduleId=${moduleId}&courseId=${courseId}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-gray-400 font-bold text-sm tracking-wide">
          Loading Course...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Header
          title="Course Not Found"
          hasBackButton={true}
          onBack={() => setLocation("/masterclasses")}
        />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Oops! Content not found
          </h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            The course you're looking for might have been moved or doesn't
            exist.
          </p>
          <Button
            onClick={() => setLocation("/masterclasses")}
            className="rounded-lg font-bold px-8 bg-brand hover:bg-brand/90"
          >
            Back to Masterclasses
          </Button>
        </main>
      </div>
    );
  }

  const { course, modules } = data;
  const isSingleModule = modules.length === 1;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header
        title={course.title}
        hasBackButton={true}
        onBack={() => setLocation("/masterclasses")}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {course.description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm shadow-black/[0.02]"
          >
            <p
              className="text-gray-600 whitespace-pre-line text-sm leading-relaxed"
              data-testid="text-course-description"
            >
              {course.description}
            </p>
          </motion.div>
        )}

        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">
                No content available yet
              </p>
            </div>
          ) : isSingleModule ? (
            <div className="space-y-3">
              {modules[0].lessons.map((lesson, idx) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-xl bg-white active:scale-[0.99]"
                    onClick={() => handleLessonClick(modules[0].id, lesson.id)}
                    data-testid={`lesson-card-${lesson.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand/5 text-brand flex items-center justify-center flex-shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-bold group-hover:text-brand transition-colors">
                          {lesson.title}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                  <div key={module.id} className="space-y-2">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                        isExpanded
                          ? "bg-brand/10 text-brand border-brand/10 shadow-sm"
                          : "bg-white text-gray-900 border-gray-100 shadow-sm hover:border-brand/30"
                      }`}
                      data-testid={`section-toggle-${module.id}`}
                    >
                      <span className="font-bold text-base">
                        {module.title}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-brand/70" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-2 pt-1"
                        >
                          {module.lessons.map((lesson) => (
                            <Card
                              key={lesson.id}
                              className="p-4 border-0 shadow-sm hover:shadow-gray-200 transition-all cursor-pointer group rounded-xl bg-white ml-2 sm:ml-4 active:scale-[0.99]"
                              onClick={() =>
                                handleLessonClick(module.id, lesson.id)
                              }
                              data-testid={`lesson-card-${lesson.id}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-lg bg-brand/5 text-brand flex items-center justify-center flex-shrink-0 group-hover:bg-brand group-hover:text-white transition-all">
                                  <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-800 text-sm font-bold group-hover:text-brand transition-colors">
                                    {lesson.title}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-brand transition-colors" />
                              </div>
                            </Card>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
