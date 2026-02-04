import { useQuery } from "@tanstack/react-query";
import { BookOpen, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Program } from "@shared/schema";

export default function AdminProgramsPage() {
  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/admin/v1/programs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/programs", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
  });

  const sortedPrograms = [...programs].sort((a, b) => b.level - a.level);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50" data-testid="admin-programs-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Programs</h1>
        <p className="text-gray-500 text-sm mt-1">System-defined program hierarchy</p>
      </div>

      <div className="flex items-start gap-2 p-3 mb-4 bg-brand/10 border border-brand/20 rounded-lg">
        <Info className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
        <p className="text-sm text-brand">
          Higher-level programs automatically include access to all lower-level programs.
        </p>
      </div>

      <Card className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-programs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Level</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrograms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No programs found</p>
                  </td>
                </tr>
              ) : (
                sortedPrograms.map((program) => (
                  <tr key={program.id} className="border-b" data-testid={`row-program-${program.id}`}>
                    <td className="py-3 px-4">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`text-program-code-${program.id}`}>
                        {program.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900" data-testid={`text-program-name-${program.id}`}>
                      {program.name}
                    </td>
                    <td className="py-3 px-4 text-center" data-testid={`text-program-level-${program.id}`}>
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-brand/10 text-brand text-sm font-semibold rounded-full">
                        {program.level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
