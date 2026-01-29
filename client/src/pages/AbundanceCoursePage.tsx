import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, Play, DollarSign, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CmsCourse, CmsModule } from "@shared/schema";

interface CourseWithThumbnail extends CmsCourse {
  thumbnailUrl: string | null;
}

interface CourseResponse {
  course: CourseWithThumbnail;
  modules: CmsModule[];
}

export default function AbundanceCoursePage() {
  const params = useParams();
  const courseId = params.courseId;
  const [location, setLocation] = useLocation();

  // Determine back destination based on current URL path
  const backPath = location.startsWith("/masterclasses")
    ? "/masterclasses"
    : "/money-mastery";

  const { data, isLoading, error } = useQuery<CourseResponse>({
    queryKey: ["/api/public/v1/courses", courseId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/courses/${courseId}`);
      if (!response.ok) throw new Error("Failed to fetch course");
      return response.json();
    },
    enabled: !!courseId,
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
          <div
            className="text-center py-12 text-muted-foreground"
            data-testid="text-error"
          >
            Course not found
          </div>
        </div>
      </div>
    );
  }

  const { course, modules } = data;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title={course.title}
          hasBackButton={true}
          onBack={() => setLocation(backPath)}
        />

        <div className="p-4 space-y-6">
          {course.thumbnailUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
                data-testid="img-course-thumbnail"
              />
            </div>
          )}

          {course.description && (
            <p
              className="text-muted-foreground whitespace-pre-line"
              data-testid="text-course-description"
            >
              {course.description}
            </p>
          )}

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Modules ({modules.length})
            </h2>

            {modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No modules in this course yet
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((module, index) => (
                  <Card
                    key={module.id}
                    className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() =>
                      setLocation(
                        `/processes/module/${module.id}?from=abundance&courseId=${courseId}`
                      )
                    }
                    data-testid={`module-card-${module.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-medium text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">
                          {module.title}
                        </p>
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
    </div>
  );
}
