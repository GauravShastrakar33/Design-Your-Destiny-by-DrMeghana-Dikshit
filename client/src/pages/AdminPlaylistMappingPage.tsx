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
import { Loader2, List, X, Music, Settings2, Sparkles } from "lucide-react";
import type {
  CmsCourse,
  CmsModule,
  FrontendFeature,
  FeatureCourseMap,
} from "@shared/schema";
import { cn } from "@/lib/utils";

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

  const { data: courses = [], isLoading: coursesLoading } = useQuery<
    CmsCourse[]
  >({
    queryKey: ["/api/admin/v1/cms/courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/cms/courses", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
  });

  const { data: mappingData, isLoading: mappingLoading } =
    useQuery<MappingResponse>({
      queryKey: ["/admin/v1/frontend-mapping/features", "PLAYLIST", "courses"],
      queryFn: async () => {
        const response = await fetch(
          `/admin/v1/frontend-mapping/features/PLAYLIST/courses`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch mappings");
        return response.json();
      },
    });

  const selectedCourse = mappingData?.mappings?.[0];
  const selectedCourseId = selectedCourse?.courseId;

  const { data: modules = [], isLoading: modulesLoading } = useQuery<
    ModuleWithLessons[]
  >({
    queryKey: [
      "/api/admin/v1/cms/courses",
      selectedCourseId,
      "modules-with-lessons",
    ],
    enabled: !!selectedCourseId,
    queryFn: async () => {
      const modulesResponse = await fetch(
        `/api/admin/v1/cms/courses/${selectedCourseId}/modules`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!modulesResponse.ok) throw new Error("Failed to fetch modules");
      const modulesData: CmsModule[] = await modulesResponse.json();

      const modulesWithCounts = await Promise.all(
        modulesData.map(async (module) => {
          try {
            const lessonsResponse = await fetch(
              `/api/admin/v1/cms/modules/${module.id}/lessons`,
              {
                headers: { Authorization: `Bearer ${adminToken}` },
              }
            );
            if (!lessonsResponse.ok) {
              return { ...module, lessonCount: 0, audioLessonCount: 0 };
            }
            const lessons = await lessonsResponse.json();

            let audioLessonCount = 0;
            for (const lesson of lessons) {
              const filesResponse = await fetch(
                `/api/admin/v1/cms/lessons/${lesson.id}/files`,
                {
                  headers: { Authorization: `Bearer ${adminToken}` },
                }
              );
              if (filesResponse.ok) {
                const files = await filesResponse.json();
                const hasAudio = files.some((f: any) => f.fileType === "audio");
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
      await apiRequest(
        "POST",
        `/admin/v1/frontend-mapping/features/PLAYLIST/courses`,
        { courseId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/admin/v1/frontend-mapping/features",
          "PLAYLIST",
          "courses",
        ],
      });
      toast({ title: "Success", description: "Course mapped successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to map course",
        variant: "destructive",
      });
    },
  });

  const clearMappingMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest(
        "DELETE",
        `/admin/v1/frontend-mapping/features/PLAYLIST/courses/${courseId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/admin/v1/frontend-mapping/features",
          "PLAYLIST",
          "courses",
        ],
      });
      toast({ title: "Success", description: "Mapping cleared" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear mapping",
        variant: "destructive",
      });
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

  const totalAudioLessons = modules.reduce(
    (sum, m) => sum + (m.audioLessonCount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="text-xl font-bold text-gray-900 leading-none"
              data-testid="text-page-title"
            >
              My Playlist Mapping
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-400">
            Map a CMS course to power the user playlist builder feature.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Configuration Card */}
            <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-brand" />
                  </div>
                  <h2 className="text-md font-bold text-gray-900">
                    Source Configuration
                  </h2>
                </div>
                <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                  Select the CMS course that contains the audio tracks for
                  player playlists. Only modules with audio content will be
                  utilized.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-[400px]">
                    <Select
                      value={selectedCourseId?.toString() || ""}
                      onValueChange={handleCourseChange}
                      disabled={mapCourseMutation.isPending}
                    >
                      <SelectTrigger
                        className="bg-gray-50 border-gray-100 focus:bg-white h-10 rounded-lg text-sm"
                        data-testid="select-playlist-course"
                      >
                        <SelectValue placeholder="Select a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem
                            key={course.id}
                            value={course.id.toString()}
                          >
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCourse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={clearMappingMutation.isPending}
                      className="h-10 text-gray-400 hover:text-destructive transition-colors font-bold text-xs gap-1"
                      data-testid="button-clear-playlist-selection"
                    >
                      <X className="w-4 h-4" />
                      Clear Selection
                    </Button>
                  )}

                  {mapCourseMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  )}
                </div>
              </div>
            </Card>

            {/* Content Preview Card */}
            {selectedCourse && (
              <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                        <List className="w-4 h-4 text-teal-500" />
                      </div>
                      <h2 className="text-md font-bold text-gray-900">
                        Available Audio Content
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                      <Music className="w-4 h-4 text-brand" />
                      <span className="text-sm font-bold text-gray-700">
                        {totalAudioLessons} Tracks Total
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 font-medium mb-6">
                    Preview of modules and audio tracks that will be visible in
                    the user's playlist builder.
                  </p>

                  {modulesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-brand/30" />
                    </div>
                  ) : modules.length === 0 ? (
                    <p className="text-sm text-gray-500 font-medium italic">
                      No modules found in this course.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {modules.map((module, index) => (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg group transition-colors hover:bg-white"
                          data-testid={`module-item-${module.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center bg-white border border-gray-100 text-gray-400 text-[10px] font-bold rounded">
                              {(index + 1).toString().padStart(2, "0")}
                            </div>
                            <span className="text-sm font-bold text-gray-700">
                              {module.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {module.lessonCount || 0} Lessons
                            </span>
                            <div className="flex items-center gap-1.5 bg-brand/5 px-2 py-1 rounded-md">
                              <Music className="w-3 h-3 text-brand" />
                              <span className="text-xs font-black text-brand">
                                {module.audioLessonCount || 0} Audio
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
