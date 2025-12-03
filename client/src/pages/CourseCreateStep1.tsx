import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminContentPanel from "@/components/AdminContentPanel";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  programCode: z.string().min(1, "Program code is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CourseCreateStep1() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      programCode: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/admin/v1/cms/courses", data);
      return response.json();
    },
    onSuccess: (course) => {
      toast({ title: "Course created successfully" });
      setLocation(`/admin/courses/create/step2/${course.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create course", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Create Course - Step 1" />
        <AdminContentPanel>
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span className="bg-brand text-white px-3 py-1 rounded-full">1</span>
                <span className="text-white">Basic Info</span>
                <span className="mx-2">-</span>
                <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full">2</span>
                <span>Thumbnail</span>
                <span className="mx-2">-</span>
                <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-full">3</span>
                <span>Curriculum</span>
              </div>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Course Basic Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter the basic details for your new course.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Course Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter course title"
                              data-testid="input-title"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="programCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Program Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., MMB, USP, ENG"
                              data-testid="input-program-code"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
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
                          <FormLabel className="text-gray-300">Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter course description"
                              data-testid="input-description"
                              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/admin/courses")}
                        className="border-gray-700 text-gray-300"
                        data-testid="button-back"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="bg-brand hover:bg-brand/90"
                        data-testid="button-continue"
                      >
                        {createMutation.isPending ? "Creating..." : "Continue"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </AdminContentPanel>
      </div>
    </div>
  );
}
