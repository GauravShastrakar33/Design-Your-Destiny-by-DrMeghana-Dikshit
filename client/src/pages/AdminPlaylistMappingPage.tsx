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
import { Loader2, List, X, Music } from "lucide-react";
import type { CmsCourse, CmsModule, FrontendFeature, FeatureCourseMap } from "@shared/schema";

interface MappingResponse {
  feature: FrontendFeature;
  mappings: (FeatureCourseMap & { course: { id: number; title: string } })[];
}

interface ModuleWithLessons extends CmsModule {
  lessonCount?: number;
  audioLessonCount?: number;
}

export default function AdminPlaylistMappingPage() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("@app:admin_token") || "";

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
    queryKey: ["/admin/v1/frontend-mapping/features", "PLAYLIST", "courses"],
    queryFn: async () => {
      const response = await fetch(`/admin/v1/frontend-mapping/features/PLAYLIST/courses`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch mappings");
      return response.json();
    },
  });

  const selectedCourse = mappingData?.mappings?.[0];
  const selectedCourseId = selectedCourse?.courseId;

  const { data: modules = [], isLoading: modulesLoading } = useQuery<ModuleWithLessons[]>({
    queryKey: ["/api/admin/v1/cms/courses", selectedCourseId, "modules-with-lessons"],
    enabled: !!selectedCourseId,
    queryFn: async () => {
      const modulesResponse = await fetch(`/api/admin/v1/cms/courses/${selectedCourseId}/modules`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!modulesResponse.ok) throw new Error("Failed to fetch modules");
      const modulesData: CmsModule[] = await modulesResponse.json();

      const modulesWithCounts = await Promise.all(
        modulesData.map(async (module) => {
          try {
            const lessonsResponse = await fetch(`/api/admin/v1/cms/modules/${module.id}/lessons`, {
              headers: { Authorization: `Bearer ${adminToken}` },
            });
            if (!lessonsResponse.ok) {
              return { ...module, lessonCount: 0, audioLessonCount: 0 };
            }
            const lessons = await lessonsResponse.json();
            
            let audioLessonCount = 0;
            for (const lesson of lessons) {
              const filesResponse = await fetch(`/api/admin/v1/cms/lessons/${lesson.id}/files`, {
                headers: { Authorization: `Bearer ${adminToken}` },
              });
              if (filesResponse.ok) {
                const files = await filesResponse.json();
                const hasAudio = files.some((f: any) => f.fileType === 'audio');
                if (hasAudio) audioLessonCount++;
              }
            }

            return {
              ...module,
              lessonCount: lessons.length,
              audioLessonCount,
            };
          } catch {
            return { ...module, lessonCount: 0, audioLessonCount: 0 };
          }
        })
      );

      return modulesWithCounts;
    },
  });

  const mapCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", `/admin/v1/frontend-mapping/features/PLAYLIST/courses`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", "PLAYLIST", "courses"] });
      toast({ title: "Course mapped successfully" });
    },
    onError: () => {
      toast({ title: "Failed to map course", variant: "destructive" });
    },
  });

  const clearMappingMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/admin/v1/frontend-mapping/features/PLAYLIST/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", "PLAYLIST", "courses"] });
      toast({ title: "Mapping cleared" });
    },
    onError: () => {
      toast({ title: "Failed to clear mapping", variant: "destructive" });
    },
  });

  const handleCourseChange = (courseId: string) => {
    if (!courseId) return;
    const newCourseId = parseInt(courseId);
    if (newCourseId === selectedCourseId) return;
    mapCourseMutation.mutate(newCourseId);
  };

  const handleClearSelection = () => {
    if (selectedCourse) {
      clearMappingMutation.mutate(selectedCourse.courseId);
    }
  };

  const isLoading = coursesLoading || mappingLoading;

  const totalAudioLessons = modules.reduce((sum, m) => sum + (m.audioLessonCount || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
          My Playlist Mapping
        </h1>
        <p className="text-gray-600 mt-1">
          Select a CMS course to power the My Playlist feature. Users will see this course's modules with their audio lessons to build playlists.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Course Selection</h3>
            <p className="text-gray-600 text-sm mb-4">
              Select a CMS course to use for My Playlist. Only audio lessons from this course will be available for user playlists.
            </p>

            <div className="flex items-center gap-4">
              <Select
                value={selectedCourseId?.toString() || ""}
                onValueChange={handleCourseChange}
                disabled={mapCourseMutation.isPending}
              >
                <SelectTrigger className="w-[300px]" data-testid="select-playlist-course">
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
                  data-testid="button-clear-playlist-selection"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Selection
                </Button>
              )}

              {mapCourseMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
              )}
            </div>
          </Card>

          {selectedCourse && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-brand" />
                  <h3 className="text-lg font-semibold">Content Preview</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Music className="w-4 h-4" />
                  <span>{totalAudioLessons} audio lessons total</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                These modules and their audio lessons will be available in the My Playlist feature.
              </p>

              {modulesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand" />
                </div>
              ) : modules.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No modules found in this course.</p>
              ) : (
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      data-testid={`module-item-${module.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-brand/10 text-brand text-sm font-medium rounded">
                          {index + 1}
                        </span>
                        <span className="text-gray-900">{module.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{module.lessonCount || 0} lessons</span>
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {module.audioLessonCount || 0} audio
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
