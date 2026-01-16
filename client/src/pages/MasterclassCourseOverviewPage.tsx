import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, Play, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

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
    setLocation(`/masterclasses/lesson/${lessonId}?moduleId=${moduleId}&courseId=${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto p-4">
          <button
            onClick={() => setLocation("/masterclasses")}
            className="hover-elevate active-elevate-2 rounded-lg p-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="text-center py-12 text-muted-foreground" data-testid="text-error">
            Content not found
          </div>
        </div>
      </div>
    );
  }

  const { course, modules } = data;
  const isSingleModule = modules.length === 1;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setLocation("/masterclasses")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <GraduationCap className="w-5 h-5 text-[#703DFA]" />
            <h1 className="text-lg font-semibold text-foreground truncate" data-testid="text-course-title">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {course.description && (
            <p className="text-muted-foreground whitespace-pre-line text-sm" data-testid="text-course-description">
              {course.description}
            </p>
          )}

          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content available yet
            </div>
          ) : isSingleModule ? (
            <div className="space-y-2">
              {modules[0].lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => handleLessonClick(modules[0].id, lesson.id)}
                  data-testid={`lesson-card-${lesson.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#703DFA]/10 flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-[#703DFA] ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{lesson.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                  <div key={module.id} className="space-y-2">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate active-elevate-2"
                      data-testid={`section-toggle-${module.id}`}
                    >
                      <span className="font-medium text-foreground">{module.title}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="space-y-2 pl-2">
                        {module.lessons.map((lesson) => (
                          <Card
                            key={lesson.id}
                            className="p-3 hover-elevate active-elevate-2 cursor-pointer"
                            onClick={() => handleLessonClick(module.id, lesson.id)}
                            data-testid={`lesson-card-${lesson.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#703DFA]/10 flex items-center justify-center flex-shrink-0">
                                <Play className="w-3 h-3 text-[#703DFA] ml-0.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-medium">{lesson.title}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
