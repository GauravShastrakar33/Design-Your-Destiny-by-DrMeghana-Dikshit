import { Search, Bell, ChevronRight, GraduationCap } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
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

import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

// Skeleton component for loading state
const CourseCardSkeleton = () => (
  <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl bg-white">
    <Skeleton className="aspect-[16/9] w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  </Card>
);

export default function MasterclassesPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<MasterclassResponse>({
    queryKey: ["/api/public/v1/features/MASTERCLASS"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "/api/public/v1/features/MASTERCLASS"
      );
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const courses = data?.courses || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header
        title="Masterclasses"
        hasBackButton={true}
        onBack={() => setLocation("/")}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 pb-20 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
          >
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Masterclasses Yet
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              We're preparing something special for you. Check back later!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {courses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer border border-gray-100 shadow-md shadow-black/[0.05] rounded-2xl group transition-all duration-300 hover:shadow-2xl hover:shadow-brand/20 hover:-translate-y-2 hover:border-brand/30 active:scale-[0.98] bg-white relative"
                  onClick={() =>
                    setLocation(`/masterclasses/course/${course.id}`)
                  }
                  data-testid={`card-masterclass-course-${course.id}`}
                >
                  {/* Wide thumbnail */}
                  <div className="aspect-[16/9] w-full bg-gray-50 relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-brand opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest bg-brand/90 px-3 py-1.5 rounded-full shadow-lg">
                        View Course
                      </span>
                    </div>
                  </div>
                  {/* Title below thumbnail */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                      {course.title}
                    </h3>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
