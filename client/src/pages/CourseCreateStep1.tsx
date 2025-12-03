import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-600 mt-1">Step 1: Basic Information</p>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="bg-brand text-white px-3 py-1 rounded-full font-medium">1</span>
            <span className="text-gray-900 font-medium">Basic Info</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full">2</span>
            <span className="text-gray-500">Thumbnail</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded-full">3</span>
            <span className="text-gray-500">Curriculum</span>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Course Basic Information</h2>
          <p className="text-gray-600 text-sm mb-6">Enter the basic details for your new course.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter course title"
                        data-testid="input-title"
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
                    <FormLabel>Program Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., MMB, USP, ENG"
                        data-testid="input-program-code"
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter course description"
                        data-testid="input-description"
                        className="min-h-[100px]"
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
        </Card>
      </div>
    </div>
  );
}
