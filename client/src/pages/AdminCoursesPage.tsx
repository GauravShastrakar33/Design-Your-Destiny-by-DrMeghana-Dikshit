import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, ChevronUp, ChevronDown, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { CmsCourse, Program } from "@shared/schema";
import { format } from "date-fns";

type CourseWithSignedUrl = CmsCourse & { thumbnailSignedUrl?: string | null };

export default function AdminCoursesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseWithSignedUrl | null>(null);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  const programMap = new Map(programs.map(p => [p.id, p]));
  const getProgramName = (programId: number | null) => {
    if (!programId) return "-";
    return programMap.get(programId)?.name || "-";
  };

  const { data: courses = [], isLoading } = useQuery<CourseWithSignedUrl[]>({
    queryKey: ["/api/admin/v1/cms/courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/cms/courses", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/v1/cms/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses"] });
      toast({ title: "Course deleted successfully" });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete course", variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      await apiRequest("PATCH", `/api/admin/v1/cms/courses/${id}/publish`, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses"] });
      toast({ title: "Course updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update course", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; position: number }[]) => {
      await apiRequest("PATCH", "/api/admin/v1/cms/courses/reorder", { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/v1/cms/courses"] });
    },
  });

  const sortedCourses = [...courses].sort((a, b) => {
    return sortOrder === "asc" ? a.position - b.position : b.position - a.position;
  });

  const filteredCourses = sortedCourses.filter((course) => {
    const matchesSearch = !search || course.title.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = programFilter === "all" || course.programId === parseInt(programFilter);
    return matchesSearch && matchesProgram;
  });

  const uniqueProgramIds = Array.from(new Set(courses.map((c) => c.programId).filter(Boolean))) as number[];

  const handleDelete = (course: CourseWithSignedUrl) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCourses = [...filteredCourses];
    const items = [
      { id: newCourses[index].id, position: newCourses[index - 1].position },
      { id: newCourses[index - 1].id, position: newCourses[index].position },
    ];
    reorderMutation.mutate(items);
  };

  const handleMoveDown = (index: number) => {
    if (index === filteredCourses.length - 1) return;
    const newCourses = [...filteredCourses];
    const items = [
      { id: newCourses[index].id, position: newCourses[index + 1].position },
      { id: newCourses[index + 1].id, position: newCourses[index].position },
    ];
    reorderMutation.mutate(items);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            data-testid="text-page-title"
          >
            Courses
          </h1>
          <p className="text-gray-600 mt-1">
            Manage course content and curriculum
          </p>
        </div>
        <Button
          onClick={() => setLocation("/admin/courses/create/step1")}
          data-testid="button-new-course"
          className="bg-brand hover:bg-brand/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      <Card className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-courses"
              className="pl-10"
            />
          </div>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger
              className="w-[180px]"
              data-testid="select-program-filter"
            >
              <SelectValue placeholder="Filter by Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {uniqueProgramIds.map((pid) => (
                <SelectItem key={pid} value={String(pid)}>
                  {getProgramName(pid)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            data-testid="button-sort-order"
          >
            {sortOrder === "asc" ? "ASC" : "DESC"}
            {sortOrder === "asc" ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-500">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {search || programFilter !== "all"
                ? "No courses match your filters."
                : "No courses yet. Create your first course!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-courses">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-12"></th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Thumbnail
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Program Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Created
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course, index) => (
                  <tr
                    key={course.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    data-testid={`row-course-${course.id}`}
                  >
                    <td className="py-3 px-4 w-12">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          data-testid={`button-move-up-${course.id}`}
                        >
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === filteredCourses.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          data-testid={`button-move-down-${course.id}`}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {course.thumbnailSignedUrl ? (
                        <img
                          src={course.thumbnailSignedUrl}
                          alt={course.title}
                          className="w-16 h-9 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-9 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {course.title}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {getProgramName(course.programId)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {course.createdAt
                        ? format(new Date(course.createdAt), "dd MMM yy")
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                        className={
                          course.isPublished
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : ""
                        }
                      >
                        {course.isPublished ? "Published" : "Unpublished"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            togglePublishMutation.mutate({
                              id: course.id,
                              isPublished: !course.isPublished,
                            })
                          }
                          data-testid={`button-toggle-publish-${course.id}`}
                        >
                          {course.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setLocation(`/admin/courses/${course.id}`)
                          }
                          data-testid={`button-edit-${course.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course)}
                          data-testid={`button-delete-${course.id}`}
                          className="hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This
              will also delete all modules, folders, lessons, and files. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
