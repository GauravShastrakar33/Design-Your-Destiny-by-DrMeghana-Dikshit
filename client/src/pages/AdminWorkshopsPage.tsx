import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course, CourseSection, SectionVideo, Masterclass, WorkshopVideo } from "@shared/schema";

// Form schemas
const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  thumbnail: z.string().min(1, "Thumbnail URL is required"),
  year: z.string().min(1, "Year is required"),
  type: z.string().min(1, "Type is required"),
  displayOrder: z.number().min(0).default(0),
});

const courseSectionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  courseId: z.number().min(1, "Course is required"),
  displayOrder: z.number().min(0).default(0),
});

const sectionVideoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  duration: z.string().min(1, "Duration is required"),
  videoUrl: z.string().min(1, "Video URL is required"),
  sectionId: z.number().min(1, "Section is required"),
  displayOrder: z.number().min(0).default(0),
});

const masterclassFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  zoomLink: z.string().min(1, "Zoom link is required"),
  thumbnail: z.string().min(1, "Thumbnail URL is required"),
  isLive: z.boolean().default(false),
  displayOrder: z.number().min(0).default(0),
});

const workshopVideoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  thumbnail: z.string().min(1, "Thumbnail URL is required"),
  uploadDate: z.string().min(1, "Upload date is required"),
  videoUrl: z.string().min(1, "Video URL is required"),
  author: z.string().default("Dr. Meghana Dikshit"),
  description: z.string().min(1, "Description is required"),
  displayOrder: z.number().min(0).default(0),
});

export default function AdminWorkshopsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("courses");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch all data
  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: courseSections = [] } = useQuery<CourseSection[]>({ queryKey: ["/api/course-sections"] });
  const { data: sectionVideos = [] } = useQuery<SectionVideo[]>({ queryKey: ["/api/section-videos"] });
  const { data: masterclasses = [] } = useQuery<Masterclass[]>({ queryKey: ["/api/masterclasses"] });
  const { data: workshopVideos = [] } = useQuery<WorkshopVideo[]>({ queryKey: ["/api/workshop-videos"] });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
  };

  const handleDelete = (item: any) => {
    setDeleteItem(item);
  };

  const handleFileUpload = async (file: File, fileType: string): Promise<string> => {
    const token = localStorage.getItem("@app:admin_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    const response = await fetch("/api/admin/upload/workshop-media", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  return (
    <div className="p-8" data-testid="admin-workshops-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">Workshops</h1>
        <p className="text-gray-600 mt-2">Manage workshops, courses, and masterclasses</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-list">
          <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
          <TabsTrigger value="sections" data-testid="tab-sections">Course Sections</TabsTrigger>
          <TabsTrigger value="videos" data-testid="tab-videos">Section Videos</TabsTrigger>
          <TabsTrigger value="masterclasses" data-testid="tab-masterclasses">Masterclasses</TabsTrigger>
          <TabsTrigger value="workshop-videos" data-testid="tab-workshop-videos">Workshop Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <CoursesTab
            courses={courses}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="sections">
          <CourseSectionsTab
            sections={courseSections}
            courses={courses}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="videos">
          <SectionVideosTab
            videos={sectionVideos}
            sections={courseSections}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="masterclasses">
          <MasterclassesTab
            masterclasses={masterclasses}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="workshop-videos">
          <WorkshopVideosTab
            videos={workshopVideos}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      {showDialog && (
        <FormDialog
          type={activeTab}
          item={editingItem}
          courses={courses}
          sections={courseSections}
          onClose={handleCloseDialog}
          onFileUpload={handleFileUpload}
        />
      )}

      {deleteItem && (
        <DeleteDialog
          type={activeTab}
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}

// Courses Tab
function CoursesTab({
  courses,
  onEdit,
  onAdd,
  onDelete,
}: {
  courses: Course[];
  onEdit: (item: Course) => void;
  onAdd: () => void;
  onDelete: (item: Course) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Courses</h2>
        <Button onClick={onAdd} data-testid="button-add-course">
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No courses yet. Add your first course to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Year</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Order</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course) => (
                <tr key={course.id} data-testid={`course-row-${course.id}`}>
                  <td className="px-4 py-3 text-sm">{course.title}</td>
                  <td className="px-4 py-3 text-sm">{course.year}</td>
                  <td className="px-4 py-3 text-sm">{course.type}</td>
                  <td className="px-4 py-3 text-sm">{course.displayOrder}</td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(course)}
                      data-testid={`button-edit-course-${course.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(course)}
                      data-testid={`button-delete-course-${course.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Course Sections Tab
function CourseSectionsTab({
  sections,
  courses,
  onEdit,
  onAdd,
  onDelete,
}: {
  sections: CourseSection[];
  courses: Course[];
  onEdit: (item: CourseSection) => void;
  onAdd: () => void;
  onDelete: (item: CourseSection) => void;
}) {
  const getCourseName = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.title || "Unknown";
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Course Sections</h2>
        <Button onClick={onAdd} data-testid="button-add-section">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No sections yet. Add your first section to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Course</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Order</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sections.map((section) => (
                <tr key={section.id} data-testid={`section-row-${section.id}`}>
                  <td className="px-4 py-3 text-sm">{section.title}</td>
                  <td className="px-4 py-3 text-sm">{getCourseName(section.courseId)}</td>
                  <td className="px-4 py-3 text-sm">{section.displayOrder}</td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(section)}
                      data-testid={`button-edit-section-${section.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(section)}
                      data-testid={`button-delete-section-${section.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Section Videos Tab
function SectionVideosTab({
  videos,
  sections,
  onEdit,
  onAdd,
  onDelete,
}: {
  videos: SectionVideo[];
  sections: CourseSection[];
  onEdit: (item: SectionVideo) => void;
  onAdd: () => void;
  onDelete: (item: SectionVideo) => void;
}) {
  const getSectionName = (sectionId: number) => {
    return sections.find((s) => s.id === sectionId)?.title || "Unknown";
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Section Videos</h2>
        <Button onClick={onAdd} data-testid="button-add-video">
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No videos yet. Add your first video to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Section</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Duration</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Order</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {videos.map((video) => (
                <tr key={video.id} data-testid={`video-row-${video.id}`}>
                  <td className="px-4 py-3 text-sm">{video.title}</td>
                  <td className="px-4 py-3 text-sm">{getSectionName(video.sectionId)}</td>
                  <td className="px-4 py-3 text-sm">{video.duration}</td>
                  <td className="px-4 py-3 text-sm">{video.displayOrder}</td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(video)}
                      data-testid={`button-edit-video-${video.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(video)}
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Masterclasses Tab
function MasterclassesTab({
  masterclasses,
  onEdit,
  onAdd,
  onDelete,
}: {
  masterclasses: Masterclass[];
  onEdit: (item: Masterclass) => void;
  onAdd: () => void;
  onDelete: (item: Masterclass) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Masterclasses</h2>
        <Button onClick={onAdd} data-testid="button-add-masterclass">
          <Plus className="w-4 h-4 mr-2" />
          Add Masterclass
        </Button>
      </div>

      {masterclasses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No masterclasses yet. Add your first masterclass to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Time</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">Live</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {masterclasses.map((masterclass) => (
                <tr key={masterclass.id} data-testid={`masterclass-row-${masterclass.id}`}>
                  <td className="px-4 py-3 text-sm">{masterclass.title}</td>
                  <td className="px-4 py-3 text-sm">{masterclass.date}</td>
                  <td className="px-4 py-3 text-sm">{masterclass.time}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {masterclass.isLive ? "✓" : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(masterclass)}
                      data-testid={`button-edit-masterclass-${masterclass.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(masterclass)}
                      data-testid={`button-delete-masterclass-${masterclass.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Workshop Videos Tab
function WorkshopVideosTab({
  videos,
  onEdit,
  onAdd,
  onDelete,
}: {
  videos: WorkshopVideo[];
  onEdit: (item: WorkshopVideo) => void;
  onAdd: () => void;
  onDelete: (item: WorkshopVideo) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Workshop Videos</h2>
        <Button onClick={onAdd} data-testid="button-add-workshop-video">
          <Plus className="w-4 h-4 mr-2" />
          Add Workshop Video
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No workshop videos yet. Add your first video to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Upload Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Author</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {videos.map((video) => (
                <tr key={video.id} data-testid={`workshop-video-row-${video.id}`}>
                  <td className="px-4 py-3 text-sm">{video.title}</td>
                  <td className="px-4 py-3 text-sm">{video.uploadDate}</td>
                  <td className="px-4 py-3 text-sm">{video.author}</td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(video)}
                      data-testid={`button-edit-workshop-video-${video.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(video)}
                      data-testid={`button-delete-workshop-video-${video.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// Form Dialog (handles all entity types)
function FormDialog({
  type,
  item,
  courses,
  sections,
  onClose,
  onFileUpload,
}: {
  type: string;
  item: any | null;
  courses: Course[];
  sections: CourseSection[];
  onClose: () => void;
  onFileUpload: (file: File, fileType: string) => Promise<string>;
}) {
  const { toast } = useToast();
  const isEditing = !!item;

  // Determine which schema and mutation to use based on type
  const getFormConfig = () => {
    switch (type) {
      case "courses":
        return {
          schema: courseFormSchema,
          endpoint: "/api/admin/courses",
          invalidateKey: "/api/courses",
          title: "Course",
        };
      case "sections":
        return {
          schema: courseSectionFormSchema,
          endpoint: "/api/admin/course-sections",
          invalidateKey: "/api/course-sections",
          title: "Course Section",
        };
      case "videos":
        return {
          schema: sectionVideoFormSchema,
          endpoint: "/api/admin/section-videos",
          invalidateKey: "/api/section-videos",
          title: "Section Video",
        };
      case "masterclasses":
        return {
          schema: masterclassFormSchema,
          endpoint: "/api/admin/masterclasses",
          invalidateKey: "/api/masterclasses",
          title: "Masterclass",
        };
      case "workshop-videos":
        return {
          schema: workshopVideoFormSchema,
          endpoint: "/api/admin/workshop-videos",
          invalidateKey: "/api/workshop-videos",
          title: "Workshop Video",
        };
      default:
        return {
          schema: courseFormSchema,
          endpoint: "/api/admin/courses",
          invalidateKey: "/api/courses",
          title: "Item",
        };
    }
  };

  const config = getFormConfig();

  const form = useForm({
    resolver: zodResolver(config.schema),
    defaultValues: item || {
      displayOrder: 0,
      isLive: false,
      author: "Dr. Meghana Dikshit",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `${config.endpoint}/${item.id}` : config.endpoint;
      const method = isEditing ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.invalidateKey] });
      toast({
        title: `${config.title} ${isEditing ? "updated" : "created"}`,
        description: `The ${config.title.toLowerCase()} has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} ${config.title.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Add"} {config.title}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update" : "Create a new"} {config.title.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {type === "courses" && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Designing Your Destiny 2021" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., 2021" data-testid="input-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., DYD, USM, USC, USB" data-testid="input-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Image URL" data-testid="input-thumbnail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {type === "sections" && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Wealth Code Activation" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-course">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {type === "videos" && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Week 1" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-section">
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., 45 min" data-testid="input-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Video URL" data-testid="input-video-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {type === "masterclasses" && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masterclass title" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masterclass subtitle" data-testid="input-subtitle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Dec 20" data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Display</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., 7:00 PM IST" data-testid="input-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="19:00" data-testid="input-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="20:30" data-testid="input-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledStart"
                    render={({ field }) => {
                      const formatDateTimeLocal = (val: any) => {
                        if (!val) return '';
                        const date = val instanceof Date ? val : new Date(val);
                        if (isNaN(date.getTime())) return '';
                        return date.toISOString().slice(0, 16);
                      };
                      
                      return (
                        <FormItem>
                          <FormLabel>Scheduled Start</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={formatDateTimeLocal(field.value)}
                              onChange={(e) => field.onChange(e.target.value)}
                              data-testid="input-scheduled-start"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledEnd"
                    render={({ field }) => {
                      const formatDateTimeLocal = (val: any) => {
                        if (!val) return '';
                        const date = val instanceof Date ? val : new Date(val);
                        if (isNaN(date.getTime())) return '';
                        return date.toISOString().slice(0, 16);
                      };
                      
                      return (
                        <FormItem>
                          <FormLabel>Scheduled End</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={formatDateTimeLocal(field.value)}
                              onChange={(e) => field.onChange(e.target.value)}
                              data-testid="input-scheduled-end"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="zoomLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zoom Link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Zoom meeting URL" data-testid="input-zoom-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Image URL" data-testid="input-thumbnail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isLive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-live"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Is Live</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {type === "workshop-videos" && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Video title" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Video description" data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-author" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uploadDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Date</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Nov 15, 2024" data-testid="input-upload-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Video URL" data-testid="input-video-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Image URL" data-testid="input-thumbnail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-display-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save">
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Dialog
function DeleteDialog({
  type,
  item,
  onClose,
}: {
  type: string;
  item: any;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const getConfig = () => {
    switch (type) {
      case "courses":
        return { endpoint: "/api/admin/courses", invalidateKey: "/api/courses", title: "Course" };
      case "sections":
        return { endpoint: "/api/admin/course-sections", invalidateKey: "/api/course-sections", title: "Course Section" };
      case "videos":
        return { endpoint: "/api/admin/section-videos", invalidateKey: "/api/section-videos", title: "Section Video" };
      case "masterclasses":
        return { endpoint: "/api/admin/masterclasses", invalidateKey: "/api/masterclasses", title: "Masterclass" };
      case "workshop-videos":
        return { endpoint: "/api/admin/workshop-videos", invalidateKey: "/api/workshop-videos", title: "Workshop Video" };
      default:
        return { endpoint: "", invalidateKey: "", title: "Item" };
    }
  };

  const config = getConfig();

  const mutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `${config.endpoint}/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.invalidateKey] });
      toast({
        title: `${config.title} deleted`,
        description: `The ${config.title.toLowerCase()} has been deleted successfully.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to delete ${config.title.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this {config.title.toLowerCase()}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            data-testid="button-confirm-delete"
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
