import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  AlertCircle,
  Filter,
  Image as ImageIcon,
} from "lucide-react";
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
  const [courseToDelete, setCourseToDelete] =
    useState<CourseWithSignedUrl | null>(null);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  const programMap = new Map(programs.map((p) => [p.id, p]));
  const getProgramName = (programId: number | null) => {
    if (!programId) return "-";
    return programMap.get(programId)?.name || "-";
  };

  const getProgramCode = (programId: number | null) => {
    if (!programId) return "-";
    return programMap.get(programId)?.code || "-";
  };

  const { data: courses = [], isLoading } = useQuery<CourseWithSignedUrl[]>({
    queryKey: ["/api/admin/v1/cms/courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/cms/courses", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
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
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses"],
      });
      toast({ title: "Course deleted successfully" });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete course", variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({
      id,
      isPublished,
    }: {
      id: number;
      isPublished: boolean;
    }) => {
      await apiRequest("PATCH", `/api/admin/v1/cms/courses/${id}/publish`, {
        isPublished,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses"],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/cms/courses"],
      });
    },
  });

  const sortedCourses = [...courses].sort((a, b) => {
    return sortOrder === "asc"
      ? a.position - b.position
      : b.position - a.position;
  });

  const filteredCourses = sortedCourses.filter((course) => {
    const matchesSearch =
      !search || course.title.toLowerCase().includes(search.toLowerCase());
    const matchesProgram =
      programFilter === "all" || course.programId === parseInt(programFilter);
    return matchesSearch && matchesProgram;
  });

  const uniqueProgramIds = Array.from(
    new Set(courses.map((c) => c.programId).filter(Boolean))
  ) as number[];

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
    <div
      className="min-h-screen bg-[#f8f9fa] p-8"
      data-testid="admin-courses-page"
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 tracking-tight"
              data-testid="text-page-title"
            >
              Courses
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Manage course content and curriculum hierarchy.
            </p>
          </div>
          <Button
            onClick={() => setLocation("/admin/courses/create")}
            data-testid="button-new-course"
            className="bg-brand hover:bg-brand/90 text-white font-bold h-11 px-6 rounded-lg shadow-sm gap-2"
          >
            <Plus className="w-5 h-5" />
            New Course
          </Button>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-courses"
              className="pl-10 h-11 border-gray-200 focus:border-brand focus:ring-brand/20 rounded-lg shadow-sm bg-white"
            />
          </div>
          <div className="flex gap-3">
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger
                className="w-[180px] h-11 border-gray-200 focus:border-brand focus:ring-brand/20 rounded-lg shadow-sm bg-white"
                data-testid="select-program-filter"
              >
                <div className="flex items-center gap-2 text-gray-600">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by Program" />
                </div>
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
              className="h-11 px-4 border-gray-200 hover:bg-gray-50 hover:text-brand text-gray-600 rounded-lg shadow-sm bg-white"
            >
              {sortOrder === "asc" ? "ASC" : "DESC"}
              {sortOrder === "asc" ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>

        <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
          <div className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
                <p className="text-sm font-medium text-gray-500">
                  Loading courses...
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left border-collapse"
                  data-testid="table-courses"
                >
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 w-[4%]"></th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 w-[9%]">
                        Thumbnail
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 w-[20%]">
                        Course Name
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 w-[20%]">
                        Program
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 w-[14%]">
                        Program Code
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 w-[10%]">
                        Created
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 text-center w-[10%]">
                        Status
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-600 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center opacity-40">
                            <BookOpen className="w-12 h-12 mb-4 text-gray-400" />
                            <p className="text-sm font-bold text-gray-600">
                              No courses found
                            </p>
                            <p className="text-xs text-gray-500 mt-1 italic">
                              Click "New Course" to create your first content
                              module.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course, index) => (
                        <tr
                          key={course.id}
                          className="group transition-colors hover:bg-gray-50/50"
                          data-testid={`row-course-${course.id}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1 text-gray-400">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="hover:text-brand disabled:opacity-30 transition-colors"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === filteredCourses.length - 1}
                                className="hover:text-brand disabled:opacity-30 transition-colors"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {course.thumbnailSignedUrl ? (
                              <div className="w-16 h-10 rounded-lg overflow-hidden shadow-sm border border-gray-100 relative group/thumb">
                                <img
                                  src={course.thumbnailSignedUrl}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-gray-900">
                              {course.title}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium text-gray-900">
                              {getProgramName(course.programId)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs uppercase bg-gray-50 text-gray-600 border-gray-200"
                            >
                              {getProgramCode(course.programId)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500 font-medium">
                              {course.createdAt
                                ? format(
                                    new Date(course.createdAt),
                                    "dd MMM yy"
                                  )
                                : "-"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge
                              className={`
                                uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 border-none
                                ${
                                  course.isPublished
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }
                              `}
                            >
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  togglePublishMutation.mutate({
                                    id: course.id,
                                    isPublished: !course.isPublished,
                                  })
                                }
                                className={`h-8 w-8 p-0 ${
                                  course.isPublished
                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                                title={
                                  course.isPublished ? "Unpublish" : "Publish"
                                }
                              >
                                {course.isPublished ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setLocation(
                                    `/admin/courses/${course.id}/edit`
                                  )
                                }
                                className="h-8 w-8 p-0 text-gray-400 hover:text-brand hover:bg-brand/5"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(course)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="border-none shadow-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <AlertDialogTitle className="text-xl font-bold">
                  Delete Course?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-gray-600 font-medium">
                Are you sure you want to delete{" "}
                <span className="text-gray-900 font-bold">
                  "{courseToDelete?.title}"
                </span>
                ? This will permanently delete all modules, lessons, and files.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="font-bold border-gray-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 font-bold shadow-md"
                data-testid="button-confirm-delete"
              >
                Delete Course
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
