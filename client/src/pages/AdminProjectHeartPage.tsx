import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Heart,
  Briefcase,
  HeartPulse,
  Users2,
  Wallet,
  CheckCircle,
  Settings2,
  List,
  Music,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface UsageData {
  total_users: number;
  users_with_poh: number;
  active: number;
  next: number;
  north_star: number;
}

interface DailyCheckinsData {
  today: {
    date: string;
    users_checked_in: number;
    percent_of_active_users: number;
  };
  last_30_days: Array<{ date: string; users_checked_in: number }>;
}

interface ProgressSignalsData {
  completed_poh: number;
  milestones_achieved_30_days: number;
  avg_days_to_first_milestone: number;
}

interface DropOffsData {
  closed_early: number;
  active_with_no_milestones: number;
  avg_active_duration_days: number;
}

interface LifeAreasData {
  career: number;
  health: number;
  relationships: number;
  wealth: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  career: "#40C1D0",
  health: "#10B981",
  relationships: "#EC4899",
  wealth: "#F59E0B",
};

const CATEGORY_LABELS: Record<string, string> = {
  career: "Career",
  health: "Health",
  relationships: "Relationships",
  wealth: "Wealth",
};

const CATEGORY_ICONS: Record<string, typeof Briefcase> = {
  career: Briefcase,
  health: HeartPulse,
  relationships: Users2,
  wealth: Wallet,
};

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
  icon?: typeof Users;
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
  icon: typeof List;
  markerColor?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
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
          <h2 className="text-md font-bold text-gray-900">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-gray-500 font-medium mb-8 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
    </Card>
  );
}

export default function AdminProjectHeartPage() {
  const { data: usage, isLoading: loadingUsage } = useQuery<UsageData>({
    queryKey: ["/admin/api/poh/usage"],
  });

  const { data: checkins, isLoading: loadingCheckins } =
    useQuery<DailyCheckinsData>({
      queryKey: ["/admin/api/poh/daily-checkins"],
    });

  const { data: progress, isLoading: loadingProgress } =
    useQuery<ProgressSignalsData>({
      queryKey: ["/admin/api/poh/progress-signals"],
    });

  const { data: dropoffs, isLoading: loadingDropoffs } = useQuery<DropOffsData>(
    {
      queryKey: ["/admin/api/poh/drop-offs"],
    }
  );

  const { data: lifeAreas, isLoading: loadingLifeAreas } =
    useQuery<LifeAreasData>({
      queryKey: ["/admin/api/poh/life-areas"],
    });

  const isLoading =
    loadingUsage ||
    loadingCheckins ||
    loadingProgress ||
    loadingDropoffs ||
    loadingLifeAreas;

  const pieChartData = lifeAreas
    ? [
        {
          name: "Career",
          value: lifeAreas.career,
          color: CATEGORY_COLORS.career,
        },
        {
          name: "Health",
          value: lifeAreas.health,
          color: CATEGORY_COLORS.health,
        },
        {
          name: "Relationships",
          value: lifeAreas.relationships,
          color: CATEGORY_COLORS.relationships,
        },
        {
          name: "Wealth",
          value: lifeAreas.wealth,
          color: CATEGORY_COLORS.wealth,
        },
      ].filter((d) => d.value > 0)
    : [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="text-xl font-bold text-gray-900 leading-none"
              data-testid="text-page-title"
            >
              Project of Heart
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-500">
            Analytics and overall engagement for the spiritual journey tracker.
          </p>
        </header>

        <div className="space-y-8">
          {/* 1. USAGE SECTION */}
          <section
            data-testid="section-usage"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <StatCard
              title="Total Users"
              value={usage?.total_users || 0}
              icon={Users}
              markerColor="bg-brand"
            />
            <StatCard
              title="Users with POH"
              value={usage?.users_with_poh || 0}
              subtitle={
                usage && usage.total_users > 0
                  ? `${Math.round(
                      (usage.users_with_poh / usage.total_users) * 100
                    )}% adoption rate`
                  : undefined
              }
              icon={Heart}
              markerColor="bg-brand"
            />
            <StatCard
              title="Active Projects"
              value={usage?.active || 0}
              icon={Target}
              markerColor="bg-brand"
            />
            <StatCard
              title="Next Steps"
              value={usage?.next || 0}
              icon={TrendingUp}
              markerColor="bg-brand"
            />
            <StatCard
              title="North Star Goals"
              value={usage?.north_star || 0}
              icon={Sparkles}
              markerColor="bg-brand"
            />
          </section>

          {/* 2. DAILY CHECK-INS SECTION */}
          <section data-testid="section-daily-checkins">
            <SectionWrapper
              title="Daily Engagement Flow"
              description="Real-time monitoring of user self-ratings (scale 1-10). This highlights current active participation."
              icon={BarChart3}
              markerColor="bg-brand"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-500 tracking-wide mb-2">
                    Today's Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">
                    {checkins?.today.users_checked_in || 0}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    <p className="text-xs font-bold text-gray-500">
                      {checkins?.today.percent_of_active_users || 0}% of active
                      users present
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <p className="text-sm font-bold text-gray-500 tracking-wide mb-6">
                    Activity Trend (Last 30 Days)
                  </p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={checkins?.last_30_days || []}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{
                            fontSize: 10,
                            fontWeight: 700,
                            fill: "#9CA3AF",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fontWeight: 700,
                            fill: "#9CA3AF",
                          }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          labelFormatter={formatDate}
                          formatter={(value: number) => [value, "Users"]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="users_checked_in"
                          stroke="#703DFA"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: "#703DFA",
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </SectionWrapper>
          </section>

          {/* 3 & 4. COMBINED METRICS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section data-testid="section-progress-signals">
              <SectionWrapper
                title="Progress & Success"
                description="Tracking milestone completion rates and average time to success."
                icon={CheckCircle}
                markerColor="bg-teal-500"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 tracking-wide">
                      Completed POH
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {progress?.completed_poh || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 tracking-wide">
                      Milestones (30d)
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {progress?.milestones_achieved_30_days || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg sm:col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 tracking-wide">
                        Avg Speed to First Milestone
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {progress?.avg_days_to_first_milestone || 0} Days
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-teal-500/60" />
                  </div>
                </div>
              </SectionWrapper>
            </section>

            <section data-testid="section-drop-offs">
              <SectionWrapper
                title="Attrition Analysis"
                description="Identifying where users disengage or pause their project journey."
                icon={AlertTriangle}
                markerColor="bg-amber-500"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 tracking-wide">
                      Closed Early
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {dropoffs?.closed_early || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 tracking-wide">
                      Dormant High-Active
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {dropoffs?.active_with_no_milestones || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg sm:col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 tracking-wide">
                        Avg Project Lifespan
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {dropoffs?.avg_active_duration_days || 0} Days
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-amber-500/60" />
                  </div>
                </div>
              </SectionWrapper>
            </section>
          </div>

          {/* 5. LIFE AREAS SECTION */}
          <section data-testid="section-life-areas">
            <SectionWrapper
              title="Category Distribution"
              description="Which life categories are users currently prioritizing in their Active POH journeys?"
              icon={PieIcon}
              markerColor="bg-brand"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  {pieChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              fontWeight: "500",
                            }}
                            formatter={(value: number) => [value, "Projects"]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => (
                              <span className="text-xs font-bold tracking-wider text-gray-500">
                                {value}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Target className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm font-bold opacity-50 tracking-wide">
                        No active projects data
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center space-y-6">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const Icon = CATEGORY_ICONS[key];
                    const value = lifeAreas?.[key as keyof LifeAreasData] || 0;
                    const total = lifeAreas
                      ? Object.values(lifeAreas).reduce((a, b) => a + b, 0)
                      : 0;
                    const percent =
                      total > 0 ? Math.round((value / total) * 100) : 0;

                    return (
                      <div
                        key={key}
                        className="flex items-center gap-4 group"
                        data-testid={`row-category-${key}`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[key]}08`,
                            borderColor: `${CATEGORY_COLORS[key]}20`,
                          }}
                        >
                          <Icon
                            className="w-5 h-5 transition-transform"
                            style={{ color: CATEGORY_COLORS[key] }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold tracking-wide text-gray-900">
                              {label}
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                              {value} Projects
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: CATEGORY_COLORS[key],
                                boxShadow: `0 0 10px ${CATEGORY_COLORS[key]}40`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-8 text-right">
                          <span className="text-xs font-bold text-gray-500 group-hover:text-brand transition-colors">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionWrapper>
          </section>
        </div>
      </div>
    </div>
  );
}
