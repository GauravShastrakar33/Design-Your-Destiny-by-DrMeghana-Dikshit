import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, FileText, Activity } from "lucide-react";
import { useLocation } from "wouter";
import type { CommunitySession } from "@shared/schema";

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();

  const { data: sessions = [] } = useQuery<CommunitySession[]>({
    queryKey: ["/api/sessions"],
  });

  const activeSessions = sessions.filter(s => s.isActive).length;
  const totalSessions = sessions.length;
  const totalParticipants = sessions.reduce((sum, s) => sum + (s.participants || 0), 0);

  const quickActions = [
    {
      title: "Add Session",
      description: "Create new community practice",
      icon: Plus,
      action: () => setLocation("/admin/sessions"),
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Manage Content",
      description: "Edit articles and resources",
      icon: FileText,
      action: () => setLocation("/admin/articles"),
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "View Activity",
      description: "Check recent updates",
      icon: Activity,
      action: () => {},
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your wellness platform</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Sessions
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSessions}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activeSessions} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Participants
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalParticipants}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across all sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Practices
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeSessions}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-4 py-4 border-b last:border-b-0 border-gray-100"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.time} • {session.participants} participants
                  </p>
                </div>
                {session.isActive && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                    Active
                  </span>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
