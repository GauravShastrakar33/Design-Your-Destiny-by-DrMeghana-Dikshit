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
  Clock,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  markerColor = "bg-brand",
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: any;
  markerColor?: string;
}) {
  return (
    <Card
      className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative h-full flex flex-col"
      data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className={cn("absolute top-0 left-0 w-1 h-full", markerColor)} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-semibold tracking-wide text-gray-500">
            {title}
          </p>
          {Icon && (
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center opacity-80",
                markerColor
                  .replace("bg-", "bg-")
                  .replace("-500", "-100")
                  .replace("bg-brand", "bg-brand/10")
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  markerColor
                    .replace("bg-", "text-")
                    .replace("bg-brand", "text-brand")
                )}
              />
            </div>
          )}
        </div>
        <div className="mt-auto flex justify-between items-center">
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs font-semibold text-gray-500 mt-2 italic">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function SectionWrapper({
  title,
  description,
  icon: Icon,
  markerColor = "bg-brand",
  children,
}: {
  title: string;
  description?: string;
  icon: any;
  markerColor?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative h-full">
      <div className={cn("absolute top-0 left-0 w-1 h-full", markerColor)} />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              markerColor
                .replace("bg-", "bg-")
                .replace("-500", "-50")
                .replace("bg-brand", "bg-brand/10")
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                markerColor
                  .replace("bg-", "text-")
                  .replace("bg-brand", "text-brand")
              )}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs font-medium text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </Card>
  );
}

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
    lastUpdatedCourse: {
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
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const kpis = data?.kpis ?? {
    totalUsers: 0,
    activeToday: 0,
    practisedToday: 0,
    badgesEarnedToday: 0,
  };
  const events = data?.events ?? { today: [], upcoming: [] };
  const notifications = data?.notifications ?? {
    failedLast24h: 0,
    usersDisabled: 0,
  };
  const communityPractices = data?.communityPractices ?? { total: 0 };
  const cmsHealth = data?.cmsHealth ?? {
    totalCourses: 0,
    publishedCourses: 0,
    lastUpdatedCourse: null,
  };

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
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <header className="mb-8">
        <h1
          className="text-xl font-bold text-gray-900 leading-none"
          data-testid="text-dashboard-title"
        >
          Dashboard
        </h1>
        <p className="text-sm font-semibold text-gray-500 mt-1">
          Overview of platform activity, events, and health metrics.
        </p>
      </header>

      <div className="space-y-8">
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={kpis.totalUsers}
            icon={Users}
            markerColor="bg-brand"
          />
          <StatCard
            title="Active Today"
            value={kpis.activeToday}
            icon={Activity}
            markerColor="bg-brand"
          />
          <StatCard
            title="Practised Today"
            value={kpis.practisedToday}
            icon={PlayCircle}
            markerColor="bg-brand"
          />
          <StatCard
            title="Badges Earned"
            value={kpis.badgesEarnedToday}
            icon={Award}
            markerColor="bg-brand"
          />
        </div>

        {/* Content Section 1: Events & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionWrapper
            title="Events"
            description="Scheduled community events and sessions"
            icon={Calendar}
            markerColor="bg-blue-500"
          >
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Events Today
                </p>
                {events.today.length === 0 ? (
                  <p
                    className="text-sm text-gray-500 italic"
                    data-testid="text-no-events-today"
                  >
                    No events scheduled for today
                  </p>
                ) : (
                  <div className="space-y-3">
                    {events.today.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        data-testid={`event-today-${event.id}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Upcoming (Next 7 Days)
                </p>
                {events.upcoming.length === 0 ? (
                  <p
                    className="text-sm text-gray-500 italic"
                    data-testid="text-no-upcoming-events"
                  >
                    No upcoming events
                  </p>
                ) : (
                  <div className="space-y-3">
                    {events.upcoming.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        data-testid={`event-upcoming-${event.id}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(
                              new Date(event.startDatetime),
                              "EEE, MMM d 'at' h:mm a"
                            )}
                          </p>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper
            title="Notifications"
            description="System notification status and failures"
            icon={Bell}
            markerColor="bg-amber-500"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                {notifications.failedLast24h === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Delivery Status (Last 24h)
                  </p>
                  {notifications.failedLast24h === 0 ? (
                    <p
                      className="text-xs text-gray-500 mt-1"
                      data-testid="text-notification-health-ok"
                    >
                      All notifications sent successfully
                    </p>
                  ) : (
                    <p
                      className="text-xs text-amber-600 font-medium mt-1"
                      data-testid="text-notification-health-failed"
                    >
                      {notifications.failedLast24h} notification(s) failed to
                      send
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <BellOff className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Opt-out Status
                  </p>
                  <p
                    className="text-xs text-gray-500 mt-1"
                    data-testid="text-users-notifications-disabled"
                  >
                    {notifications.usersDisabled} users have disabled
                    notifications
                  </p>
                </div>
              </div>
            </div>
          </SectionWrapper>
        </div>

        {/* Content Section 2: Community & CMS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionWrapper
            title="Community Practices"
            description="Engagement metrics for community sessions"
            icon={UsersRound}
            markerColor="bg-pink-500"
          >
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm font-medium text-gray-500">
                Total Community Practices
              </p>
              <p
                className="text-3xl font-bold text-gray-900"
                data-testid="text-total-community-practices"
              >
                {communityPractices.total}
              </p>
            </div>
          </SectionWrapper>

          <SectionWrapper
            title="CMS Health"
            description="Content management system overview"
            icon={BookOpen}
            markerColor="bg-green-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Total Courses
                </p>
                <p
                  className="text-2xl font-bold text-gray-900"
                  data-testid="text-total-courses"
                >
                  {cmsHealth.totalCourses}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Published
                  </p>
                  <FileCheck className="w-3 h-3 text-green-500" />
                </div>
                <p
                  className="text-2xl font-bold text-gray-900"
                  data-testid="text-published-courses"
                >
                  {cmsHealth.publishedCourses}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-gray-900">
                  Last Updated Course
                </p>
              </div>
              {cmsHealth.lastUpdatedCourse ? (
                <div>
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    title={cmsHealth.lastUpdatedCourse.title}
                    data-testid="text-last-updated-course-title"
                  >
                    {cmsHealth.lastUpdatedCourse.title}
                  </p>
                  <p
                    className="text-xs text-gray-500 mt-1"
                    data-testid="text-last-updated-course-time"
                  >
                    Updated{" "}
                    {formatDistanceToNow(
                      new Date(cmsHealth.lastUpdatedCourse.updatedAt),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              ) : (
                <p
                  className="text-sm text-gray-500 italic"
                  data-testid="text-no-courses"
                >
                  No courses found
                </p>
              )}
            </div>
          </SectionWrapper>
        </div>
      </div>
    </div>
  );
}
