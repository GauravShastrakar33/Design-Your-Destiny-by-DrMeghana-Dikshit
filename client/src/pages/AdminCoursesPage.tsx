import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, ChevronUp, ChevronDown, GripVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { CmsCourse } from "@shared/schema";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminContentPanel from "@/components/AdminContentPanel";
import { format } from "date-fns";

export default function AdminCoursesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CmsCourse | null>(null);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: courses = [], isLoading } = useQuery<CmsCourse[]>({
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
    const matchesProgram = programFilter === "all" || course.programCode === programFilter;
    return matchesSearch && matchesProgram;
  });

  const uniqueProgramCodes = [...new Set(courses.map((c) => c.programCode))];

  const handleDelete = (course: CmsCourse) => {
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
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Courses" />
        <AdminContentPanel>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-white">Course Management</CardTitle>
              <Button
                onClick={() => setLocation("/admin/courses/create/step1")}
                data-testid="button-new-course"
                className="bg-brand hover:bg-brand/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Course
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="input-search-courses"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white" data-testid="select-program-filter">
                    <SelectValue placeholder="Filter by Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {uniqueProgramCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  data-testid="button-sort-order"
                  className="border-gray-700 text-gray-300"
                >
                  {sortOrder === "asc" ? "ASC" : "DESC"}
                  {sortOrder === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading courses...</div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {search || programFilter !== "all" ? "No courses match your filters." : "No courses yet. Create your first course!"}
                </div>
              ) : (
                <div className="rounded-md border border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 bg-gray-800/50">
                        <TableHead className="text-gray-400 w-12"></TableHead>
                        <TableHead className="text-gray-400">Thumbnail</TableHead>
                        <TableHead className="text-gray-400">Name</TableHead>
                        <TableHead className="text-gray-400">Program Code</TableHead>
                        <TableHead className="text-gray-400">Created</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course, index) => (
                        <TableRow key={course.id} className="border-gray-800" data-testid={`row-course-${course.id}`}>
                          <TableCell className="w-12">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                                data-testid={`button-move-up-${course.id}`}
                              >
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === filteredCourses.length - 1}
                                className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                                data-testid={`button-move-down-${course.id}`}
                              >
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-16 h-9 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-9 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
                                No image
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            {course.title}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {course.programCode}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {course.createdAt ? format(new Date(course.createdAt), "dd MMM yy") : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={course.isPublished ? "default" : "secondary"}
                              className={course.isPublished ? "bg-green-600" : "bg-gray-600"}
                            >
                              {course.isPublished ? "Published" : "Unpublished"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePublishMutation.mutate({ id: course.id, isPublished: !course.isPublished })}
                                data-testid={`button-toggle-publish-${course.id}`}
                                className="text-gray-400 hover:text-white"
                              >
                                {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLocation(`/admin/courses/${course.id}`)}
                                data-testid={`button-edit-${course.id}`}
                                className="text-gray-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(course)}
                                data-testid={`button-delete-${course.id}`}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </AdminContentPanel>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Course</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{courseToDelete?.title}"? This will also delete all modules, folders, lessons, and files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
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
