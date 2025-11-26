import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Edit, Trash2, Ban, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { UserWithPrograms, Program } from "@shared/schema";

interface StudentsResponse {
  data: UserWithPrograms[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export default function AdminStudentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserWithPrograms | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<UserWithPrograms | null>(null);
  const [statusStudent, setStatusStudent] = useState<{ student: UserWithPrograms; newStatus: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    programCode: "",
    status: "active",
  });

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: programsData = [] } = useQuery<Program[]>({
    queryKey: ["/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/admin/v1/programs", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  const { data: studentsData, isLoading } = useQuery<StudentsResponse>({
    queryKey: ["/admin/v1/students", search, programFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);
      if (programFilter && programFilter !== "ALL") params.set("program", programFilter);

      const response = await fetch(`/admin/v1/students?${params}`, {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/admin/v1/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create student");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/students"] });
      toast({ title: "Student added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await fetch(`/admin/v1/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update student");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/students"] });
      toast({ title: "Student updated successfully" });
      setEditingStudent(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update student", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/admin/v1/students/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/students"] });
      toast({ title: "Status updated successfully" });
      setStatusStudent(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/v1/students/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete student");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/students"] });
      toast({ title: "Student deleted successfully" });
      setDeletingStudent(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete student", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      programCode: "",
      status: "active",
    });
  };

  const handleEdit = (student: UserWithPrograms) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      password: "",
      programCode: student.programs[0] || "",
      status: student.status,
    });
  };

  const handleSubmit = () => {
    if (editingStudent) {
      updateMutation.mutate({
        id: editingStudent.id,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          programCode: formData.programCode,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const students = studentsData?.data || [];
  const pagination = studentsData?.pagination || { total: 0, page: 1, pages: 1 };
  const startItem = (pagination.page - 1) * limit + 1;
  const endItem = Math.min(pagination.page * limit, pagination.total);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Students</h1>
          <p className="text-gray-600 mt-1">Manage student accounts and programs</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-brand hover:bg-brand/90"
          data-testid="button-add-student"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={programFilter} onValueChange={(value) => {
            setProgramFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[180px]" data-testid="select-program-filter">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Programs</SelectItem>
              {programsData.map((program) => (
                <SelectItem key={program.id} value={program.code}>
                  {program.code} - {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-500">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-students">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Program</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last Login</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr 
                      key={student.id} 
                      className="border-b border-gray-100 hover:bg-gray-50"
                      data-testid={`row-student-${student.id}`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900" data-testid={`text-student-name-${student.id}`}>
                          {student.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.email}</td>
                      <td className="py-3 px-4 text-gray-600">{student.phone || "-"}</td>
                      <td className="py-3 px-4">
                        {student.programs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {student.programs.map((prog) => (
                              <Badge key={prog} variant="secondary" className="text-xs">
                                {prog}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={student.status === "active" ? "default" : "destructive"}
                          className={student.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                          data-testid={`badge-status-${student.id}`}
                        >
                          {student.status === "active" ? "Active" : "Blocked"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(student.lastLogin)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(student.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${student.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(student)}
                              data-testid={`button-edit-${student.id}`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {student.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => setStatusStudent({ student, newStatus: "blocked" })}
                                className="text-orange-600"
                                data-testid={`button-block-${student.id}`}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Block
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setStatusStudent({ student, newStatus: "active" })}
                                className="text-green-600"
                                data-testid={`button-unblock-${student.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Unblock
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeletingStudent(student)}
                              className="text-red-600"
                              data-testid={`button-delete-${student.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600" data-testid="text-pagination-info">
                Showing {startItem}-{endItem} of {pagination.total} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={isAddDialogOpen || !!editingStudent} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingStudent(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-student-form">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                data-testid="input-phone"
              />
            </div>
            {!editingStudent && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for default (User@123)"
                  data-testid="input-password"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select 
                value={formData.programCode} 
                onValueChange={(value) => setFormData({ ...formData, programCode: value })}
              >
                <SelectTrigger data-testid="select-program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programsData.map((program) => (
                    <SelectItem key={program.id} value={program.code}>
                      {program.code} - {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingStudent && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingStudent(null);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email || createMutation.isPending || updateMutation.isPending}
              className="bg-brand hover:bg-brand/90"
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingStudent ? "Update" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!statusStudent} onOpenChange={(open) => !open && setStatusStudent(null)}>
        <AlertDialogContent data-testid="dialog-status-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusStudent?.newStatus === "blocked" ? "Block Student" : "Unblock Student"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusStudent?.newStatus === "blocked"
                ? `Are you sure you want to block ${statusStudent?.student.name}? They will not be able to log in.`
                : `Are you sure you want to unblock ${statusStudent?.student.name}? They will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-status-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusStudent) {
                  statusMutation.mutate({ id: statusStudent.student.id, status: statusStudent.newStatus });
                }
              }}
              className={statusStudent?.newStatus === "blocked" ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
              data-testid="button-status-confirm"
            >
              {statusStudent?.newStatus === "blocked" ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingStudent} onOpenChange={(open) => !open && setDeletingStudent(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingStudent?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStudent) {
                  deleteMutation.mutate(deletingStudent.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
