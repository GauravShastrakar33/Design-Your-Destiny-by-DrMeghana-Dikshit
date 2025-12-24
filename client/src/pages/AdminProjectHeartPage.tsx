import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, Users, Target, TrendingUp, AlertTriangle, Heart, Briefcase, HeartPulse, Users2, Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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
  milestones_achieved_7_days: number;
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
  career: "#4F46E5",
  health: "#10B981",
  relationships: "#EC4899",
  wealth: "#F59E0B"
};

const CATEGORY_LABELS: Record<string, string> = {
  career: "Career",
  health: "Health",
  relationships: "Relationships",
  wealth: "Wealth"
};

const CATEGORY_ICONS: Record<string, typeof Briefcase> = {
  career: Briefcase,
  health: HeartPulse,
  relationships: Users2,
  wealth: Wallet
};

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string; 
  value: number | string; 
  subtitle?: string;
  icon?: typeof Users;
}) {
  return (
    <Card className="p-5 border border-gray-200" data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

export default function AdminProjectHeartPage() {
  const { data: usage, isLoading: loadingUsage } = useQuery<UsageData>({
    queryKey: ['/admin/api/poh/usage']
  });

  const { data: checkins, isLoading: loadingCheckins } = useQuery<DailyCheckinsData>({
    queryKey: ['/admin/api/poh/daily-checkins']
  });

  const { data: progress, isLoading: loadingProgress } = useQuery<ProgressSignalsData>({
    queryKey: ['/admin/api/poh/progress-signals']
  });

  const { data: dropoffs, isLoading: loadingDropoffs } = useQuery<DropOffsData>({
    queryKey: ['/admin/api/poh/drop-offs']
  });

  const { data: lifeAreas, isLoading: loadingLifeAreas } = useQuery<LifeAreasData>({
    queryKey: ['/admin/api/poh/life-areas']
  });

  const isLoading = loadingUsage || loadingCheckins || loadingProgress || loadingDropoffs || loadingLifeAreas;

  const pieChartData = lifeAreas ? [
    { name: "Career", value: lifeAreas.career, color: CATEGORY_COLORS.career },
    { name: "Health", value: lifeAreas.health, color: CATEGORY_COLORS.health },
    { name: "Relationships", value: lifeAreas.relationships, color: CATEGORY_COLORS.relationships },
    { name: "Wealth", value: lifeAreas.wealth, color: CATEGORY_COLORS.wealth }
  ].filter(d => d.value > 0) : [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Project of Heart — Overview
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          This view shows engagement patterns, not individual performance.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64" data-testid="loading-indicator">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. USAGE SECTION */}
          <section data-testid="section-usage">
            <SectionHeader 
              title="Usage" 
              description="Are users creating Projects of Heart?" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard 
                title="Total Users" 
                value={usage?.total_users || 0} 
                icon={Users}
              />
              <StatCard 
                title="Users with POH" 
                value={usage?.users_with_poh || 0}
                subtitle={usage && usage.total_users > 0 
                  ? `${Math.round((usage.users_with_poh / usage.total_users) * 100)}% adoption`
                  : undefined}
                icon={Heart}
              />
              <StatCard 
                title="Active" 
                value={usage?.active || 0}
                icon={Target}
              />
              <StatCard 
                title="Next" 
                value={usage?.next || 0}
                icon={TrendingUp}
              />
              <StatCard 
                title="North Star" 
                value={usage?.north_star || 0}
                icon={Target}
              />
            </div>
          </section>

          {/* 2. DAILY CHECK-INS SECTION */}
          <section data-testid="section-daily-checkins">
            <SectionHeader 
              title="Daily Check-ins" 
              description="Are users reflecting daily?" 
            />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Card className="p-5 border border-gray-200 lg:col-span-1">
                <p className="text-sm font-medium text-gray-500">Today's Check-ins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {checkins?.today.users_checked_in || 0}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {checkins?.today.percent_of_active_users || 0}% of active users
                </p>
              </Card>
              <Card className="p-5 border border-gray-200 lg:col-span-3">
                <p className="text-sm font-medium text-gray-500 mb-4">Last 30 Days</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={checkins?.last_30_days || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value: number) => [value, "Users"]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users_checked_in" 
                        stroke="#703DFA" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </section>

          {/* 3. PROGRESS SIGNALS SECTION */}
          <section data-testid="section-progress-signals">
            <SectionHeader 
              title="Progress Signals" 
              description="Are milestones being achieved?" 
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Milestones Achieved (7 days)" 
                value={progress?.milestones_achieved_7_days || 0}
                icon={Target}
              />
              <StatCard 
                title="Milestones Achieved (30 days)" 
                value={progress?.milestones_achieved_30_days || 0}
                icon={Target}
              />
              <StatCard 
                title="Avg Days to First Milestone" 
                value={progress?.avg_days_to_first_milestone || 0}
                subtitle="days"
                icon={TrendingUp}
              />
            </div>
          </section>

          {/* 4. DROP-OFFS SECTION */}
          <section data-testid="section-drop-offs">
            <SectionHeader 
              title="Drop-offs" 
              description="Where do users disengage?" 
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Closed Early" 
                value={dropoffs?.closed_early || 0}
                subtitle="Projects ended before completion"
                icon={AlertTriangle}
              />
              <StatCard 
                title="Active with No Milestones" 
                value={dropoffs?.active_with_no_milestones || 0}
                subtitle="May need engagement nudge"
                icon={AlertTriangle}
              />
              <StatCard 
                title="Avg Project Duration" 
                value={`${dropoffs?.avg_active_duration_days || 0} days`}
                subtitle="For completed/closed projects"
                icon={TrendingUp}
              />
            </div>
          </section>

          {/* 5. LIFE AREAS SECTION */}
          <section data-testid="section-life-areas">
            <SectionHeader 
              title="Life Areas" 
              description="Which life categories are users focusing on?" 
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5 border border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-4">Category Distribution</p>
                {pieChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, "Projects"]} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No active projects yet
                  </div>
                )}
              </Card>
              <Card className="p-5 border border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-4">By Category</p>
                <div className="space-y-4">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const Icon = CATEGORY_ICONS[key];
                    const value = lifeAreas?.[key as keyof LifeAreasData] || 0;
                    const total = lifeAreas 
                      ? Object.values(lifeAreas).reduce((a, b) => a + b, 0) 
                      : 0;
                    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                    
                    return (
                      <div key={key} className="flex items-center gap-4" data-testid={`row-category-${key}`}>
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${CATEGORY_COLORS[key]}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: CATEGORY_COLORS[key] }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <span className="text-sm text-gray-500">{value} projects</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percent}%`,
                                backgroundColor: CATEGORY_COLORS[key]
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
