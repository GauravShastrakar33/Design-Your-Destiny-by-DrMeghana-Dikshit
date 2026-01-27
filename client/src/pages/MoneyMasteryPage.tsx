import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RewiringBelief } from "@shared/schema";
import {
  useMoneyCalendar,
  useSaveMoneyEntry,
} from "@/hooks/use-money-calendar";
import { formatAmountCompact } from "@/utils/formatAmountCompact";

interface AbundanceCourse {
  id: number;
  title: string;
  description: string | null;
  thumbnailKey: string | null;
  position: number;
  isBuiltIn: boolean;
}

interface AbundanceFeatureResponse {
  feature: {
    id: number;
    code: string;
    displayMode: string;
  };
  builtIns: Array<{ id: string; title: string; isBuiltIn: boolean }>;
  courses: AbundanceCourse[];
}

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function MoneyMasteryPage() {
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [earningAmount, setEarningAmount] = useState("");

  const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;
  const { data: calendarData, isLoading: isLoadingCalendar } =
    useMoneyCalendar(monthKey);
  const saveEntryMutation = useSaveMoneyEntry();

  const earnings = calendarData?.days || {};

  const { data: abundanceData, isLoading: isLoadingCourses } =
    useQuery<AbundanceFeatureResponse>({
      queryKey: ["/api/public/v1/features", "ABUNDANCE"],
      queryFn: async () => {
        const response = await fetch("/api/public/v1/features/ABUNDANCE");
        if (!response.ok) throw new Error("Failed to fetch abundance courses");
        return response.json();
      },
    });

  const { data: beliefs = [], isLoading: isLoadingBeliefs } = useQuery<
    RewiringBelief[]
  >({
    queryKey: ["/api/v1/rewiring-beliefs"],
  });

  const mappedCourses = (abundanceData?.courses || []).sort(
    (a, b) => a.position - b.position,
  );

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay };
  };

  const { daysInMonth, firstDay } = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const formatDate = (day: number): string => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const handleDayClick = (day: number) => {
    const dateKey = formatDate(day);
    setSelectedDate(dateKey);
    setEarningAmount(earnings[dateKey]?.toString() || "");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;

    const amount = parseFloat(earningAmount);
    if (isNaN(amount)) {
      alert("Please enter a valid number");
      return;
    }
    if (amount < 0) {
      alert("Amount cannot be negative");
      return;
    }

    saveEntryMutation.mutate(
      { date: selectedDate, amount },
      {
        onSuccess: () => {
          setModalOpen(false);
          setEarningAmount("");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!selectedDate) return;

    saveEntryMutation.mutate(
      { date: selectedDate, amount: 0 },
      {
        onSuccess: () => {
          setModalOpen(false);
          setEarningAmount("");
        },
      },
    );
  };

  const previousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    );
  };

  const getEarningColor = (amount: number): string => {
    const maxEarning = Math.max(...Object.values(earnings), 1);
    const ratio = amount / maxEarning;

    // Highest day → filled
    if (ratio > 0.75) {
      return "bg-emerald-600 text-white";
    }

    // Normal money days → white with green border
    return "bg-white border border-gray-200";
  };

  const summary = calendarData?.summary || { total: 0, highest: 0, average: 0 };
  const today = new Date();
  const isToday = (day: number) => {
    return (
      selectedMonth.getFullYear() === today.getFullYear() &&
      selectedMonth.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1
              className="text-lg font-semibold text-gray-500 tracking-[0.2em]"
              style={{ fontFamily: "Montserrat" }}
            >
              DAILY ABUNDANCE
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Money Calendar */}
          <Card className="p-4 bg-white" data-testid="card-money-calendar">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" style={{ color: "#703DFA" }} />
              <h2 className="text-lg font-semibold text-foreground">
                Money Calendar
              </h2>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-foreground">
                {selectedMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={i} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dateKey = formatDate(day);
                const earning = earnings[dateKey];
                const hasEarning = earning !== undefined;
                const isHighestDay =
                  hasEarning &&
                  earning === summary.highest &&
                  summary.highest > 0;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2
                      transition-all duration-150
                      hover:scale-[1.03]
                      active:scale-[0.97]
                      ${
                        hasEarning
                          ? `${getEarningColor(earning)} ${
                              isHighestDay
                                ? "ring-2 ring-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]"
                                : ""
                            }`
                          : isToday(day)
                            ? "bg-[#703DFA]/5 ring-1 ring-[#703DFA]/40 text-[#703DFA]"
                            : "bg-gray-200 text-gray-800"
                      }
                    `}
                    data-testid={`day-${day}`}
                  >
                    <span
                      className={`text-[11px] font-medium ${hasEarning ? "" : "text-foreground"}`}
                    >
                      {day}
                    </span>
                    {hasEarning && (
                      <span
                        className={`text-[11px] font-bold tracking-tight ${
                          isHighestDay
                            ? "text-amber-200 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                            : "text-green-600"
                        }`}
                      >
                        {formatAmountCompact(earning)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Monthly Summary */}
            <div className="mt-8 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Monthly Summary
              </h3>

              {/* Total Earnings */}
              <div className="mb-4">
                <p className="text-xs tracking-wide text-gray-900 mb-1">
                  Total Earnings
                </p>
                <p className="text-lg font-extrabold text-green-600 tracking-tight">
                  {formatINR(summary.total)}
                </p>
              </div>

              {/* Supporting stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-900 mb-1">Highest Day</p>
                  <p className="text-base font-semibold text-green-600">
                    {summary.highest > 0 ? formatINR(summary.highest) : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-900 mb-1">Average / Day</p>
                  <p className="text-base font-semibold text-green-600">
                    {summary.average > 0 ? formatINR(summary.average) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Earning Modal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent data-testid="dialog-earning">
              <DialogHeader>
                <DialogTitle>
                  {selectedDate && earnings[selectedDate]
                    ? "Edit Earning"
                    : "Add Earning"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={earningAmount}
                    onChange={(e) => setEarningAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full h-10 px-3 rounded-lg bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    data-testid="input-earning-amount"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                    data-testid="button-save-earning"
                  >
                    Save
                  </Button>
                  {selectedDate && earnings[selectedDate] && (
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      data-testid="button-delete-earning"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Rewiring Belief Cards */}
          {isLoadingBeliefs ? (
            <div className="flex items-center justify-center py-4">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "#703DFA" }}
              />
            </div>
          ) : beliefs.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5" style={{ color: "#703DFA" }} />
                  <h2 className="text-lg font-semibold text-foreground">
                    My Rewired Beliefs
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/rewiring-belief")}
                  data-testid="button-manage-beliefs"
                >
                  Manage
                </Button>
              </div>
              {beliefs.map((belief) => (
                <Card
                  key={belief.id}
                  className="p-4 bg-white"
                  style={{
                    borderRadius: "1rem",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  }}
                  data-testid={`belief-display-card-${belief.id}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: "#EF4444" }}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Limiting
                        </p>
                        <p
                          className="text-sm text-foreground line-through opacity-60"
                          data-testid={`display-limiting-${belief.id}`}
                        >
                          {belief.limitingBelief}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: "#10B981" }}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Rewired
                        </p>
                        <p
                          className="text-sm font-medium text-foreground"
                          data-testid={`display-uplifting-${belief.id}`}
                        >
                          {belief.upliftingBelief}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Rewiring Belief CTA Card - show only when no beliefs exist */
            <Card
              className="p-5 bg-white cursor-pointer hover-elevate active-elevate-2 shadow-md h-[140px]"
              onClick={() => setLocation("/rewiring-belief")}
              data-testid="card-rewiring-belief"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-3 mb-1 flex-1">
                  <Brain
                    className="w-7 h-7 flex-shrink-0"
                    style={{ color: "#703DFA" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-foreground text-lg font-bold">
                        Rewiring Belief
                      </h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Transform limiting beliefs into empowering ones
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white text-black border-border"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation("/rewiring-belief");
                    }}
                  >
                    <span className="mr-1 text-sm">Start Rewiring</span>
                    <span style={{ color: "#703DFA" }}>→</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Mapped CMS Courses */}
          {isLoadingCourses && (
            <div className="flex items-center justify-center py-4">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "#703DFA" }}
              />
            </div>
          )}

          {!isLoadingCourses && mappedCourses.length > 0 && (
            <div className="space-y-4">
              {mappedCourses.map((course) => (
                <Card
                  key={course.id}
                  className="p-5 bg-white cursor-pointer hover-elevate active-elevate-2 shadow-md"
                  onClick={() =>
                    setLocation(`/abundance-mastery/course/${course.id}`)
                  }
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="flex items-start gap-3">
                    <BookOpen
                      className="w-7 h-7 flex-shrink-0"
                      style={{ color: "#703DFA" }}
                    />
                    <div className="flex-1">
                      <h2 className="text-foreground text-lg font-bold mb-1">
                        {course.title}
                      </h2>
                      {course.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
