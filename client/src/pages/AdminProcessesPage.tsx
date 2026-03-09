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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  List,
  X,
  Settings2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
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

function FeatureTab({ code, label }: { code: string; label: string }) {
  const { toast } = useToast();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<number | null>(null);
  const [mappingLocked, setMappingLocked] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
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

  const selectedCourse = mappingData?.mappings?.[0];
  const selectedCourseId = selectedCourse?.courseId;

  // Update lock state when mapping data loads
  useEffect(() => {
    if (mappingData?.feature?.mappingLocked !== undefined) {
      setMappingLocked(mappingData.feature.mappingLocked);
    }
  }, [mappingData?.feature?.mappingLocked]);

  const { data: modules = [], isLoading: modulesLoading } = useQuery<
    CmsModule[]
  >({
    queryKey: ["/api/admin/v1/cms/courses", selectedCourseId, "modules"],
    enabled: !!selectedCourseId,
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/v1/cms/courses/${selectedCourseId}/modules`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
  });

  const mapCourseMutation = useMutation({
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
      toast({ title: "Success", description: "Course mapped successfully" });
      setChangeDialogOpen(false);
      setPendingCourseId(null);
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
        `/admin/v1/frontend-mapping/features/${code}/courses/${courseId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
      });
      toast({ title: "Success", description: "Mapping cleared" });
      setClearDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear mapping",
        variant: "destructive",
      });
    },
  });

  const toggleLockMutation = useMutation({
    mutationFn: async (locked: boolean) => {
      await apiRequest(
        "PATCH",
        `/admin/v1/frontend-mapping/features/${code}/lock`,
        { locked }
      );
    },
    onSuccess: (_, locked) => {
      queryClient.invalidateQueries({
        queryKey: ["/admin/v1/frontend-mapping/features", code, "courses"],
      });
      setMappingLocked(locked);
      setUnlockDialogOpen(false);
      toast({
        title: "Success",
        description: `Mapping ${locked ? "locked" : "unlocked"} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lock status",
        variant: "destructive",
      });
    },
  });

  const handleToggleLock = async (newLockedState: boolean) => {
    // Only show confirmation when UNLOCKING
    if (mappingLocked && newLockedState === false) {
      setUnlockDialogOpen(true);
      return;
    }
    toggleLockMutation.mutate(newLockedState);
  };

  const confirmUnlock = () => {
    toggleLockMutation.mutate(false);
  };

  const handleCourseChange = (courseId: string) => {
    if (!courseId) return;
    const newCourseId = parseInt(courseId);
    if (newCourseId === selectedCourseId) return;

    setPendingCourseId(newCourseId);
    setChangeDialogOpen(true);
  };

  const confirmCourseChange = () => {
    if (pendingCourseId !== null) {
      mapCourseMutation.mutate(pendingCourseId);
    }
  };

  const handleClearSelection = () => {
    setClearDialogOpen(true);
  };

  const confirmClearSelection = () => {
    if (selectedCourse) {
      clearMappingMutation.mutate(selectedCourse.courseId);
    }
  };

  const isLoading = coursesLoading || mappingLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-md font-bold text-gray-900">
              Course Configuration
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
            Select a CMS course to map to {label}. This determines the modules
            visible to users.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-[400px]">
              <Select
                value={selectedCourseId?.toString() || ""}
                onValueChange={handleCourseChange}
                disabled={mapCourseMutation.isPending || mappingLocked}
              >
                <SelectTrigger
                  className="bg-gray-50 border-gray-100 focus:bg-white h-10 rounded-lg text-sm"
                  data-testid={`select-${code.toLowerCase()}-course`}
                >
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
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
                disabled={clearMappingMutation.isPending || mappingLocked}
                className="h-10 text-gray-400 hover:text-destructive transition-colors font-bold text-xs gap-1"
                data-testid={`button-clear-${code.toLowerCase()}-selection`}
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

      {/* Lock Status Card */}
      <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {mappingLocked ? "🔒" : "🔓"}
              </span>
              <div>
                <h3 className="text-md font-bold text-gray-900">
                  {mappingLocked ? "Locked" : "Unlocked"}
                </h3>
                <p className="text-sm text-gray-500">
                  {mappingLocked
                    ? "Mapping is protected from accidental changes"
                    : "Mapping can be modified"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleToggleLock(!mappingLocked)}
              disabled={toggleLockMutation.isPending}
              className={mappingLocked ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {toggleLockMutation.isPending
                ? "Updating..."
                : mappingLocked
                ? "Unlock Mapping"
                : "Lock Mapping"}
            </Button>
          </div>
        </div>
      </Card>

      {selectedCourse && (
        <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <List className="w-4 h-4 text-teal-500" />
              </div>
              <h2 className="text-md font-bold text-gray-900">
                Module Preview
              </h2>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-6">
              Preview of modules that will be displayed in the {label} section.
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
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                    data-testid={`module-item-${module.id}`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center bg-white border border-gray-100 text-gray-400 text-[10px] font-bold rounded">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {module.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Clear Selection Confirmation */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Selection?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to clear the selection for {label}? This
                will remove the current course mapping, and users will no longer
                be able to see these processes in their application.
              </p>
              <strong className="text-red-600 mt-1">
                Please make sure to map the correct course and processes again.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearSelection}
              className="bg-red-600 hover:bg-red-700 font-bold"
              data-testid="button-confirm-clear"
            >
              {clearMappingMutation.isPending
                ? "Clearing..."
                : "Clear Selection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Course Confirmation */}
      <AlertDialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Course Mapping?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to change the course mapping for {label}?
                This will update the modules and processes visible to users in
                the application.
              </p>
              <p className="text-gray-600">
                The content preview below will update once you confirm the
                change.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCourseId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCourseChange}
              className="bg-brand hover:bg-brand/90 font-bold"
              data-testid="button-confirm-change"
            >
              {mapCourseMutation.isPending ? "Updating..." : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock Mapping?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Unlocking this will allow modification of the course mapping for
                this {label.toLowerCase()} feature.
              </p>
              <p className="text-gray-600">
                Make sure to lock the mapping again after making changes to
                protect it from accidental modifications.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlock}
              className="bg-amber-600 hover:bg-amber-700 font-bold"
              disabled={toggleLockMutation.isPending}
            >
              {toggleLockMutation.isPending ? "Unlocking..." : "Unlock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminProcessesPage() {
  const [activeTab, setActiveTab] = useState("DYD");

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="text-xl font-bold text-gray-900 leading-none"
              data-testid="text-page-title"
            >
              Processes Mapping
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-400">
            Map CMS courses to frontend feature journeys
          </p>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-6"
        >
          <TabsList className="bg-white border border-gray-100 shadow-sm p-1 h-12 rounded-lg">
            <TabsTrigger
              value="DYD"
              data-testid="tab-dyd"
              className="rounded-md px-8 h-full font-bold text-xs data-[state=active]:bg-brand data-[state=active]:text-white transition-all uppercase tracking-wider"
            >
              DYD
            </TabsTrigger>
            <TabsTrigger
              value="USM"
              data-testid="tab-usm"
              className="rounded-md px-8 h-full font-bold text-xs data-[state=active]:bg-brand data-[state=active]:text-white transition-all uppercase tracking-wider"
            >
              USM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="DYD" className="focus-visible:outline-none">
            <FeatureTab code="DYD" label="DYD Processes" />
          </TabsContent>

          <TabsContent value="USM" className="focus-visible:outline-none">
            <FeatureTab code="USM" label="USM Processes" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
