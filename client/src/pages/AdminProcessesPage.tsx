import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, List, X } from "lucide-react";
import type { CmsCourse, CmsModule, FrontendFeature, FeatureCourseMap } from "@shared/schema";

interface MappingResponse {
  feature: FrontendFeature;
  mappings: (FeatureCourseMap & { course: { id: number; title: string } })[];
}

function FeatureTab({ code, label }: { code: string; label: string }) {
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
  const selectedCourseId = selectedCourse?.courseId;

  const { data: modules = [], isLoading: modulesLoading } = useQuery<CmsModule[]>({
    queryKey: ["/api/admin/v1/cms/courses", selectedCourseId, "modules"],
    enabled: !!selectedCourseId,
    queryFn: async () => {
      const response = await fetch(`/api/admin/v1/cms/courses/${selectedCourseId}/modules`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
  });

  const mapCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", `/admin/v1/frontend-mapping/features/${code}/courses`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"] });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{label} Course Selection</h3>
        <p className="text-gray-600 text-sm mb-4">
          Select a CMS course to use for {label}. The modules from this course will be displayed.
        </p>

        <div className="flex items-center gap-4">
          <Select
            value={selectedCourseId?.toString() || ""}
            onValueChange={handleCourseChange}
            disabled={mapCourseMutation.isPending}
          >
            <SelectTrigger className="w-[300px]" data-testid={`select-${code.toLowerCase()}-course`}>
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
              data-testid={`button-clear-${code.toLowerCase()}-selection`}
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
          <div className="flex items-center gap-2 mb-4">
            <List className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-semibold">Module Preview</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            These modules will be shown to users in the {label} section.
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  data-testid={`module-item-${module.id}`}
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-brand/10 text-brand text-sm font-medium rounded">
                    {index + 1}
                  </span>
                  <span className="text-gray-900">{module.title}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function AdminProcessesPage() {
  const [activeTab, setActiveTab] = useState("DYD");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
          Processes
        </h1>
        <p className="text-gray-600 mt-1">
          Map CMS courses to DYD and USM process features
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="DYD" data-testid="tab-dyd">
            DYD
          </TabsTrigger>
          <TabsTrigger value="USM" data-testid="tab-usm">
            USM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="DYD">
          <FeatureTab code="DYD" label="DYD Processes" />
        </TabsContent>

        <TabsContent value="USM">
          <FeatureTab code="USM" label="USM Processes" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
