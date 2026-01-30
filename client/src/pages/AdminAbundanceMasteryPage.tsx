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
import { Loader2, Plus, Trash2, GripVertical, DollarSign, Calendar, Brain } from "lucide-react";
import type { CmsCourse, FrontendFeature, FeatureCourseMap } from "@shared/schema";

interface MappingWithCourse extends FeatureCourseMap {
  course: { id: number; title: string };
}

interface MappingResponse {
  feature: FrontendFeature;
  mappings: MappingWithCourse[];
}

export default function AdminAbundanceMasteryPage() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("@app:admin_token") || "";
  const code = "ABUNDANCE";
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [localOrder, setLocalOrder] = useState<MappingWithCourse[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  useEffect(() => {
    if (mappingData?.mappings) {
      setLocalOrder(mappingData.mappings);
    }
  }, [mappingData?.mappings]);

  const mappedCourseIds = new Set(localOrder.map((m) => m.courseId));
  const availableCourses = courses.filter((c) => !mappedCourseIds.has(c.id));

  const addCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", `/admin/v1/frontend-mapping/features/${code}/courses`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"] });
      setSelectedCourseId("");
      toast({ title: "Course added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add course", variant: "destructive" });
    },
  });

  const removeCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/admin/v1/frontend-mapping/features/${code}/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"] });
      toast({ title: "Course removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove course", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (courseIds: number[]) => {
      await apiRequest("PATCH", `/admin/v1/frontend-mapping/features/${code}/courses/reorder`, { courseIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"] });
      toast({ title: "Order updated" });
    },
    onError: () => {
      toast({ title: "Failed to reorder", variant: "destructive" });
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
          <DollarSign className="w-6 h-6 text-brand" />
          <h1
            className="text-2xl font-bold text-gray-900"
            data-testid="text-page-title"
          >
            Abundance Mastery
          </h1>
        </div>
        <p className="text-gray-600 mt-1">
          Manage the Abundance Mastery course list with built-in items and CMS
          courses.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Built-in Items</h3>
          <p className="text-gray-600 text-sm mb-4">
            These items are always shown first and cannot be removed or
            reordered.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-gray-900 font-medium">Money Calendar</span>
              <span className="ml-auto text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                Built-in
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="text-gray-900 font-medium">Rewiring Belief</span>
              <span className="ml-auto text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                Built-in
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add CMS Course</h3>
          <p className="text-gray-600 text-sm mb-4">
            Add CMS courses to appear after the built-in items. You can drag to
            reorder.
          </p>

          <div className="flex items-center gap-4">
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
            >
              <SelectTrigger
                className="w-[300px]"
                data-testid="select-abundance-course"
              >
                <SelectValue placeholder="Select a course to add" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAddCourse}
              disabled={!selectedCourseId || addCourseMutation.isPending}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-add-abundance-course"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Course
            </Button>
          </div>
        </Card>

        {localOrder.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mapped Courses</h3>
            <p className="text-gray-600 text-sm mb-4">
              Drag to reorder. These courses appear after the built-in items.
            </p>

            <div className="space-y-2">
              {localOrder.map((mapping, index) => (
                <div
                  key={mapping.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move transition-colors ${
                    draggedIndex === index
                      ? "bg-brand/10 border-2 border-brand"
                      : "hover:bg-gray-100"
                  }`}
                  data-testid={`mapped-course-${mapping.courseId}`}
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="w-6 h-6 flex items-center justify-center bg-brand/10 text-brand text-sm font-medium rounded">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 flex-1">
                    {mapping.course.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCourse(mapping.courseId)}
                    disabled={removeCourseMutation.isPending}
                    data-testid={`button-remove-course-${mapping.courseId}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
