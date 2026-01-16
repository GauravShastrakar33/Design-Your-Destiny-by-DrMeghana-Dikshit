import { Search, Bell, ChevronRight, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { FrontendFeature } from "@shared/schema";

interface MasterclassCourse {
  id: number;
  title: string;
  description: string | null;
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
  position: number;
  isBuiltIn: boolean;
}

interface MasterclassResponse {
  feature: FrontendFeature;
  builtIns: never[];
  courses: MasterclassCourse[];
}

export default function MasterclassesPage() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<MasterclassResponse>({
    queryKey: ["/api/public/v1/features/MASTERCLASS"],
  });

  const courses = data?.courses || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1
              className="text-xl font-bold text-gray-500 tracking-wider"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              data-testid="text-page-title"
            >
              Masterclasses
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation("/search")}
                className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
              </button>
              <button
                onClick={() => setLocation("/notifications")}
                className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center hover-elevate active-elevate-2"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5 text-[#703DFA]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Masterclasses Yet</h3>
              <p className="text-gray-500 text-sm">
                Check back later for new masterclasses!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => setLocation(`/masterclasses/course/${course.id}`)}
                    data-testid={`card-masterclass-course-${course.id}`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {course.thumbnailUrl ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#703DFA]/10 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-8 h-8 text-[#703DFA]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {course.title}
                        </h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
