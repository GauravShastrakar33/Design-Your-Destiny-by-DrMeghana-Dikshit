import { useState, useEffect } from "react";
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
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  GraduationCap,
  Settings2,
  List,
} from "lucide-react";
import type {
  CmsCourse,
  FrontendFeature,
  FeatureCourseMap,
} from "@shared/schema";
import { cn } from "@/lib/utils";

interface MappingWithCourse extends FeatureCourseMap {
  course: { id: number; title: string };
}

interface MappingResponse {
  feature: FrontendFeature;
  mappings: MappingWithCourse[];
}

export default function AdminMasterclassesPage() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("@app:admin_token") || "";
  const code = "MASTERCLASS";
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [localOrder, setLocalOrder] = useState<MappingWithCourse[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
      queryFn: async () => {
        const response = await fetch(
          `/admin/v1/frontend-mapping/features/${code}/courses`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch mappings");
        return response.json();
      },
    });

  useEffect(() => {
    if (mappingData?.mappings) {
      setLocalOrder(mappingData.mappings);
    }
  }, [mappingData?.mappings]);

  const mappedCourseIds = new Set(localOrder.map((m) => m.courseId));
  const availableCourses = courses.filter((c) => !mappedCourseIds.has(c.id));

  const addCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest(
        "POST",
        `/admin/v1/frontend-mapping/features/${code}/courses`,
        { courseId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/public/v1/features/MASTERCLASS"],
      });
      setSelectedCourseId("");
      toast({ title: "Success", description: "Course added successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      });
    },
  });

  const removeCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest(
        "DELETE",
        `/admin/v1/frontend-mapping/features/${code}/courses/${courseId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/public/v1/features/MASTERCLASS"],
      });
      toast({ title: "Success", description: "Course removed" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove course",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (courseIds: number[]) => {
      await apiRequest(
        "PATCH",
        `/admin/v1/frontend-mapping/features/${code}/courses/reorder`,
        { courseIds }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/public/v1/features/MASTERCLASS"],
      });
      toast({ title: "Success", description: "Order updated" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder",
        variant: "destructive",
      });
      if (mappingData?.mappings) {
        setLocalOrder(mappingData.mappings);
      }
    },
  });

  const handleAddCourse = () => {
    if (selectedCourseId) {
      addCourseMutation.mutate(parseInt(selectedCourseId));
    }
  };

  const handleRemoveCourse = (courseId: number) => {
    removeCourseMutation.mutate(courseId);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...localOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setLocalOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      const courseIds = localOrder.map((m) => m.courseId);
      reorderMutation.mutate(courseIds);
    }
    setDraggedIndex(null);
  };

  const isLoading = coursesLoading || mappingLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="text-xl font-bold text-gray-900 leading-none"
              data-testid="text-page-title"
            >
              Masterclasses
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-400">
            Select CMS courses to show under Masterclasses in the app.
          </p>
        </header>

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
                  Add CMS Course
                </h2>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                Add CMS courses to display in the Masterclasses section. You can
                drag to reorder below.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-[400px]">
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                  >
                    <SelectTrigger
                      className="bg-gray-50 border-gray-100 focus:bg-white h-10 rounded-lg text-sm"
                      data-testid="select-masterclass-course"
                    >
                      <SelectValue placeholder="Select a course to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
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

                <Button
                  onClick={handleAddCourse}
                  disabled={!selectedCourseId || addCourseMutation.isPending}
                  className="bg-brand hover:bg-brand/90 font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2"
                  data-testid="button-add-masterclass-course"
                >
                  {addCourseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Course
                </Button>
              </div>
            </div>
          </Card>

          {/* Mapped Courses Card */}
          {localOrder.length > 0 ? (
            <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <List className="w-4 h-4 text-teal-500" />
                  </div>
                  <h2 className="text-md font-bold text-gray-900">
                    Mapped Masterclasses
                  </h2>
                </div>
                <p className="text-sm text-gray-400 font-medium mb-6">
                  Drag items to reorder. These will appear in the Masterclasses
                  section of the app.
                </p>

                <div className="space-y-2">
                  {localOrder.map((mapping, index) => (
                    <div
                      key={mapping.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg cursor-move transition-all group",
                        draggedIndex === index
                          ? "ring-2 ring-brand border-transparent opacity-50"
                          : "hover:bg-white hover:shadow-md hover:border-brand/10"
                      )}
                      data-testid={`mapped-masterclass-course-${mapping.courseId}`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" />
                      <div className="w-6 h-6 flex items-center justify-center bg-white border border-gray-100 text-gray-400 text-[10px] font-bold rounded">
                        {(index + 1).toString().padStart(2, "0")}
                      </div>
                      <span className="text-sm font-bold text-gray-700 flex-1 truncate">
                        {mapping.course.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCourse(mapping.courseId)}
                        disabled={removeCourseMutation.isPending}
                        className="h-9 w-9 text-gray-300 hover:text-red-500 bg-gray-50/50 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        data-testid={`button-remove-masterclass-course-${mapping.courseId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">
                  No courses mapped yet
                </p>
                <p className="text-xs text-gray-400">
                  Add a CMS course from the section above to begin.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
