import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Activity, 
  Award, 
  PlayCircle,
  Calendar,
  Bell,
  AlertTriangle,
  CheckCircle,
  BellOff,
  UsersRound,
  BookOpen,
  FileCheck,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface DashboardData {
  kpis: {
    totalUsers: number;
    activeToday: number;
    practisedToday: number;
    badgesEarnedToday: number;
  };
  events: {
    today: Array<{
      id: number;
      title: string;
      startDatetime: string;
      endDatetime: string;
      status: "upcoming" | "live" | "completed";
    }>;
    upcoming: Array<{
      id: number;
      title: string;
      startDatetime: string;
      endDatetime: string;
      status: "upcoming" | "live" | "completed";
    }>;
  };
  notifications: {
    failedLast24h: number;
    usersDisabled: number;
  };
  communityPractices: {
    total: number;
  };
  cmsHealth: {
    totalCourses: number;
    publishedCourses: number;
    lastUpdatedLesson: {
      title: string;
      updatedAt: string;
    } | null;
  };
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/admin/v1/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis ?? { totalUsers: 0, activeToday: 0, practisedToday: 0, badgesEarnedToday: 0 };
  const events = data?.events ?? { today: [], upcoming: [] };
  const notifications = data?.notifications ?? { failedLast24h: 0, usersDisabled: 0 };
  const communityPractices = data?.communityPractices ?? { total: 0 };
  const cmsHealth = data?.cmsHealth ?? { totalCourses: 0, publishedCourses: 0, lastUpdatedLesson: null };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Live
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Upcoming
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="card-kpi-users">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-users">{kpis.totalUsers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-active-today">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Today</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-active-today">{kpis.activeToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-practised-today">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Practised Today</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-practised-today">{kpis.practisedToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-badges-earned">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Badges Earned Today</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-badges-earned">{kpis.badgesEarnedToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card data-testid="card-events">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Events Today</p>
              {events.today.length === 0 ? (
                <p className="text-sm text-gray-500" data-testid="text-no-events-today">No events scheduled for today</p>
              ) : (
                <div className="space-y-2">
                  {events.today.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0" data-testid={`event-today-${event.id}`}>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDatetime), "h:mm a")}
                        </p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Upcoming Events (Next 7 Days)</p>
              {events.upcoming.length === 0 ? (
                <p className="text-sm text-gray-500" data-testid="text-no-upcoming-events">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {events.upcoming.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0" data-testid={`event-upcoming-${event.id}`}>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDatetime), "EEE, MMM d 'at' h:mm a")}
                        </p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-notifications">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              {notifications.failedLast24h === 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm" data-testid="text-notification-health-ok">All notifications sent successfully (last 24h)</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <p className="text-sm" data-testid="text-notification-health-failed">
                    {notifications.failedLast24h} notification(s) failed (last 24h)
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 py-2">
              <BellOff className="w-5 h-5 text-gray-400" />
              <p className="text-sm" data-testid="text-users-notifications-disabled">
                {notifications.usersDisabled} users have notifications disabled
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-community-practices">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UsersRound className="w-4 h-4" />
              Community Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Community Practices</p>
              <p className="text-xl font-bold" data-testid="text-total-community-practices">{communityPractices.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cms-health">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              CMS Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Courses</p>
              <p className="font-semibold" data-testid="text-total-courses">{cmsHealth.totalCourses}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Published Courses</p>
              </div>
              <p className="font-semibold" data-testid="text-published-courses">{cmsHealth.publishedCourses}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Last Updated Lesson</p>
              </div>
              {cmsHealth.lastUpdatedLesson ? (
                <div className="text-right">
                  <p className="text-sm font-medium truncate max-w-[180px]" title={cmsHealth.lastUpdatedLesson.title} data-testid="text-last-updated-lesson-title">
                    {cmsHealth.lastUpdatedLesson.title}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-last-updated-lesson-time">
                    {formatDistanceToNow(new Date(cmsHealth.lastUpdatedLesson.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500" data-testid="text-no-lessons">No lessons yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
