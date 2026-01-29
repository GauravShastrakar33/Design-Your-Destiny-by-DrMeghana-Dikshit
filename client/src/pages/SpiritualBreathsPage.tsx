import { ArrowLeft, Wind, Loader2, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface Lesson {
  id: number;
  title: string;
  moduleId: number;
  folderId: number | null;
  position: number;
}

interface BreathFeatureResponse {
  feature: {
    id: number;
    code: string;
    displayMode: string;
  };
  course: {
    id: number;
    title: string;
  } | null;
  lessons: Lesson[];
}

export default function SpiritualBreathsPage() {
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<BreathFeatureResponse>({
    queryKey: ["/api/public/v1/features", "BREATH"],
    queryFn: async () => {
      const response = await fetch("/api/public/v1/features/BREATH");
      if (!response.ok)
        throw new Error("Failed to fetch Spiritual Breaths content");
      return response.json();
    },
  });

  const lessons = data?.lessons || [];

  return (
    <div className="min-h-screen pb-20 bg-page-bg">
      <div className="max-w-md mx-auto">
        <Header
          title="Spiritual Breaths"
          hasBackButton={true}
          onBack={() => setLocation("/")}
        />

        <div className="px-4 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load Spiritual Breaths content
            </div>
          )}

          {!isLoading && !error && lessons.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                <Wind className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Breaths Yet
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Spiritual Breaths content is being prepared. Check back soon!
              </p>
            </div>
          )}

          {!isLoading && !error && lessons.length > 0 && (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="p-4 hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() =>
                    setLocation(`/spiritual-breaths/lesson/${lesson.id}`)
                  }
                  data-testid={`card-lesson-${lesson.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#E8F5E9" }}
                    >
                      <Wind className="w-6 h-6" style={{ color: "#4CAF50" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {lesson.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
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
