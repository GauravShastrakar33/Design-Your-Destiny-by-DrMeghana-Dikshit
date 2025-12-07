import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, FileText, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CmsModule, CmsLesson } from "@shared/schema";

interface ModuleResponse {
  module: CmsModule;
  lessons: CmsLesson[];
}

export default function ProcessModulePage() {
  const params = useParams();
  const moduleId = params.moduleId;
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<ModuleResponse>({
    queryKey: ["/api/public/v1/modules", moduleId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/modules/${moduleId}`);
      if (!response.ok) throw new Error("Failed to fetch module");
      return response.json();
    },
    enabled: !!moduleId,
  });

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
            onClick={() => setLocation("/")}
            className="hover-elevate active-elevate-2 rounded-lg p-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="text-center py-12 text-muted-foreground" data-testid="text-error">
            Module not found
          </div>
        </div>
      </div>
    );
  }

  const { module, lessons } = data;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setLocation("/search")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate" data-testid="text-module-title">
              {module.title}
            </h1>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Lessons ({lessons.length})
            </h2>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lessons in this module yet
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <Card
                  key={lesson.id}
                  className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => setLocation(`/processes/lesson/${lesson.id}`)}
                  data-testid={`lesson-card-${lesson.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
                      )}
                    </div>
                    <Play className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
