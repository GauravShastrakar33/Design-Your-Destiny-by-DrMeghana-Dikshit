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
import { useForm, FormProvider, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

const adminSchema = yup.object().shape({
  name: yup
    .string()
    .required("Full name is required")
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name must be at most 50 characters long"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: yup
    .string()
    .test(
      "is-phone",
      "Enter a valid phone number (digits and '+' allowed, max 15)",
      (value) => {
        if (!value) return true;
        return /^\+?\d{1,14}$/.test(value) && value.length <= 15;
      }
    )
    .nullable()
    .optional(),
  password: yup.string().optional(),
  role: yup.string().required("Role is required"),
  status: yup.string().required("Status is required"),
});

type AdminFormValues = yup.InferType<typeof adminSchema>;

interface AdminsResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export default function AdminsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null);
  const [statusAdmin, setStatusAdmin] = useState<{
    admin: User;
    newStatus: string;
  } | null>(null);

  const methods = useForm<AdminFormValues>({
    resolver: yupResolver(adminSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "COACH",
      status: "active",
    },
  });

  const { reset, handleSubmit: handleSubmitRHF, control } = methods;

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";
  const adminUserStr = localStorage.getItem("@app:admin_user");
  const currentAdmin = adminUserStr ? JSON.parse(adminUserStr) : null;
  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";

  const { data: adminsData, isLoading } = useQuery<AdminsResponse>({
    queryKey: ["/admin/v1/admins", search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);

      const response = await fetch(`/admin/v1/admins?${params}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch admins");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AdminFormValues) => {
      const response = await fetch("/admin/v1/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create admin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/admins"] });
      toast({ title: "Admin added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AdminFormValues>;
    }) => {
      const response = await fetch(`/admin/v1/admins/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update admin");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/admins"] });
      toast({ title: "Admin updated successfully" });
      setEditingAdmin(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/admin/v1/admins/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/admins"] });
      toast({ title: "Status updated successfully" });
      setStatusAdmin(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/admin/v1/admins/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete admin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/v1/admins"] });
      toast({ title: "Admin deleted successfully" });
      setDeletingAdmin(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "COACH",
      status: "active",
    });
  };

  const handleEdit = (admin: User) => {
    setEditingAdmin(admin);
    reset({
      name: admin.name,
      email: admin.email,
      phone: admin.phone || "",
      password: "",
      role: admin.role,
      status: admin.status,
    });
  };

  const onSubmit = (data: AdminFormValues) => {
    if (editingAdmin) {
      updateMutation.mutate({
        id: editingAdmin.id,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          role: data.role,
          status: data.status,
        },
      });
    } else {
      createMutation.mutate(data);
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

  const getRoleBadge = (role: string) => {
    if (role === "SUPER_ADMIN") {
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-blue-100 text-blue-700 hover:bg-blue-100"
      >
        <UserCog className="w-3 h-3 mr-1" />
        Coach
      </Badge>
    );
  };

  const admins = adminsData?.data || [];
  const pagination = adminsData?.pagination || { total: 0, page: 1, pages: 1 };
  const startItem = (pagination.page - 1) * limit + 1;
  const endItem = Math.min(pagination.page * limit, pagination.total);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-gray-900 leading-none"
            data-testid="text-page-title"
          >
            Admins
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            Manage administrator accounts and roles
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-brand hover:bg-brand/90 font-bold text-xs h-10 px-6 rounded-lg shadow-sm gap-2"
            data-testid="button-add-admin"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </Button>
        )}
      </div>

      <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
        <div className="p-6">
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
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-500">Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No admins found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: "fixed" }}
                  data-testid="table-admins"
                >
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th
                        className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                        style={{ width: "20%" }}
                      >
                        Name
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                        style={{ width: "25%" }}
                      >
                        Email
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                        style={{ width: "12%" }}
                      >
                        Role
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                        style={{ width: "10%" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                        style={{ width: "12%" }}
                      >
                        Last Login
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                        style={{ width: "12%" }}
                      >
                        Created
                      </th>
                      {isSuperAdmin && (
                        <th
                          className="text-right py-3 px-4 text-sm font-medium text-gray-600"
                          style={{ width: "80px" }}
                        >
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                        data-testid={`row-admin-${admin.id}`}
                      >
                        <td className="py-2 px-4 max-w-0">
                          <div className="flex items-center gap-3 w-full text-left truncate">
                            <Avatar className="h-8 w-8 text-[10px] font-bold shrink-0">
                              <AvatarFallback className="bg-brand/5 text-brand/80 transition-colors">
                                {admin.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-gray-900 truncate text-sm">
                              {admin.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="py-3 px-4 text-gray-600 truncate"
                          title={admin.email}
                        >
                          {admin.email}
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(admin.role)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              admin.status === "active"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              admin.status === "active"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : ""
                            }
                            data-testid={`badge-status-${admin.id}`}
                          >
                            {admin.status === "active" ? "Active" : "Blocked"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {formatDate(admin.lastLogin)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {formatDate(admin.createdAt)}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-4 text-right">
                            {currentAdmin?.id !== admin.id ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid={`button-actions-${admin.id}`}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(admin)}
                                    data-testid={`button-edit-${admin.id}`}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {admin.status === "active" ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setStatusAdmin({
                                          admin,
                                          newStatus: "blocked",
                                        })
                                      }
                                      className="text-orange-600"
                                      data-testid={`button-block-${admin.id}`}
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Block
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setStatusAdmin({
                                          admin,
                                          newStatus: "active",
                                        })
                                      }
                                      className="text-green-600"
                                      data-testid={`button-unblock-${admin.id}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Unblock
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => setDeletingAdmin(admin)}
                                    className="text-red-600"
                                    data-testid={`button-delete-${admin.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                You
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <p
                  className="text-sm text-gray-600"
                  data-testid="text-pagination-info"
                >
                  Showing {startItem}-{endItem} of {pagination.total} admins
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
                    onClick={() =>
                      setPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    disabled={page === pagination.pages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <Dialog
        open={isAddDialogOpen || !!editingAdmin}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingAdmin(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md" data-testid="dialog-admin-form">
          <FormProvider {...methods}>
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormInput
                name="name"
                label="Full Name"
                required
                placeholder="Enter full name"
                data-testid="input-name"
              />
              <FormInput
                name="email"
                label="Email"
                type="email"
                required
                placeholder="Enter email address"
                data-testid="input-email"
              />
              <FormInput
                name="phone"
                label="Phone"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(
                    /[^0-9+]/g,
                    ""
                  );
                }}
                placeholder="Enter phone number"
                data-testid="input-phone"
              />

              {!editingAdmin && (
                <FormInput
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Leave empty for default (Admin@123)"
                  data-testid="input-password"
                />
              )}

              <div className="space-y-3">
                <Label>
                  Role <span className="text-red-600">*</span>
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col gap-3"
                    >
                      <div
                        onClick={() => field.onChange("SUPER_ADMIN")}
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
                          field.value === "SUPER_ADMIN"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200"
                        )}
                      >
                        <RadioGroupItem
                          value="SUPER_ADMIN"
                          id="role-super-admin"
                          data-testid="radio-super-admin"
                        />
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <Label
                            htmlFor="role-super-admin"
                            className="cursor-pointer font-medium"
                          >
                            Super Admin
                          </Label>
                        </div>
                        <span className="text-xs text-gray-500 ml-auto font-normal">
                          Full access to all features
                        </span>
                      </div>
                      <div
                        onClick={() => field.onChange("COACH")}
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
                          field.value === "COACH"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200"
                        )}
                      >
                        <RadioGroupItem
                          value="COACH"
                          id="role-coach"
                          data-testid="radio-coach"
                        />
                        <div className="flex items-center gap-2">
                          <UserCog className="w-4 h-4 text-blue-600" />
                          <Label
                            htmlFor="role-coach"
                            className="cursor-pointer font-medium"
                          >
                            Coach
                          </Label>
                        </div>
                        <span className="text-xs text-gray-500 ml-auto font-normal">
                          Limited admin access
                        </span>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {editingAdmin && (
                <FormSelect
                  name="status"
                  label="Status"
                  required
                  placeholder="Select status"
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Blocked", value: "blocked" },
                  ]}
                  data-testid="select-status"
                />
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingAdmin(null);
                  resetForm();
                  methods.clearErrors();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRHF(onSubmit)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-brand hover:bg-brand/90"
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingAdmin
                  ? "Update"
                  : "Add Admin"}
              </Button>
            </DialogFooter>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!statusAdmin}
        onOpenChange={(open) => !open && setStatusAdmin(null)}
      >
        <AlertDialogContent data-testid="dialog-status-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAdmin?.newStatus === "blocked"
                ? "Block Admin"
                : "Unblock Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAdmin?.newStatus === "blocked"
                ? `Are you sure you want to block ${statusAdmin?.admin.name}? They will not be able to access the admin panel.`
                : `Are you sure you want to unblock ${statusAdmin?.admin.name}? They will be able to access the admin panel again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-status-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusAdmin) {
                  statusMutation.mutate({
                    id: statusAdmin.admin.id,
                    status: statusAdmin.newStatus,
                  });
                }
              }}
              className={
                statusAdmin?.newStatus === "blocked"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }
              data-testid="button-status-confirm"
            >
              {statusAdmin?.newStatus === "blocked" ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingAdmin}
        onOpenChange={(open) => !open && setDeletingAdmin(null)}
      >
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingAdmin?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingAdmin) {
                  deleteMutation.mutate(deletingAdmin.id);
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
