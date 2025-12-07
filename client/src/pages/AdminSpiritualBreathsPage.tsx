import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, List, X, Wind } from "lucide-react";
import type { CmsCourse, CmsLesson, FrontendFeature, FeatureCourseMap } from "@shared/schema";

interface MappingResponse {
  feature: FrontendFeature;
  mappings: (FeatureCourseMap & { course: { id: number; title: string } })[];
}

export default function AdminSpiritualBreathsPage() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("@app:admin_token") || "";
  const code = "BREATH";

  const { data: courses = [], isLoading: coursesLoading } = useQuery<CmsCourse[]>({
    queryKey: ["/api/admin/v1/cms/courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/cms/courses", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
  });

  const { data: mappingData, isLoading: mappingLoading } = useQuery<MappingResponse>({
    queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
    queryFn: async () => {
      const response = await fetch(`/admin/v1/frontend-mapping/features/${code}/courses`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch mappings");
      return response.json();
    },
  });

  const selectedCourse = mappingData?.mappings?.[0];

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery<{ lessons: CmsLesson[] }>({
    queryKey: ["/api/public/v1/features", code],
    enabled: !!selectedCourse?.courseId,
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/features/${code}`);
      if (!response.ok) throw new Error("Failed to fetch lessons");
      return response.json();
    },
  });

  const lessons = lessonsData?.lessons || [];

  const mapCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", `/admin/v1/frontend-mapping/features/${code}/courses`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/features", code] });
      toast({ title: "Course mapped successfully" });
    },
    onError: () => {
      toast({ title: "Failed to map course", variant: "destructive" });
    },
  });

  const clearMappingMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/admin/v1/frontend-mapping/features/${code}/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/features", code] });
      toast({ title: "Mapping cleared" });
    },
    onError: () => {
      toast({ title: "Failed to clear mapping", variant: "destructive" });
    },
  });

  const handleCourseChange = (courseId: string) => {
    if (courseId) {
      mapCourseMutation.mutate(parseInt(courseId));
    }
  };

  const handleClearSelection = () => {
    if (selectedCourse) {
      clearMappingMutation.mutate(selectedCourse.courseId);
    }
  };

  const isLoading = coursesLoading || mappingLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Wind className="w-6 h-6 text-brand" />
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            Spiritual Breaths
          </h1>
        </div>
        <p className="text-gray-600 mt-1">
          Map a CMS course to the Spiritual Breaths feature. Lessons will be displayed directly.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Course Selection</h3>
          <p className="text-gray-600 text-sm mb-4">
            Select a CMS course. All lessons from this course will be shown in the Spiritual Breaths section.
          </p>

          <div className="flex items-center gap-4">
            <Select
              value={selectedCourse?.courseId?.toString() || ""}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="w-[300px]" data-testid="select-breath-course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCourse && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={clearMappingMutation.isPending}
                data-testid="button-clear-breath-selection"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Selection
              </Button>
            )}
          </div>
        </Card>

        {selectedCourse && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-semibold">Lesson Preview</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              These lessons will be shown to users in the Spiritual Breaths section.
            </p>

            {lessonsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No lessons found in this course.</p>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    data-testid={`lesson-item-${lesson.id}`}
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-brand/10 text-brand text-sm font-medium rounded">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{lesson.title}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
