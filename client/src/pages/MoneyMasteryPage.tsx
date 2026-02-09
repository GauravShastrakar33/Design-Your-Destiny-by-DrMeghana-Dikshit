import { useState } from "react";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Calendar,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Sparkles,
  TrendingUp,
  Coins,
  Target,
  Zap,
  Trophy,
  Info,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  thumbnailUrl: string | null;
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

import { motion, AnimatePresence } from "framer-motion";

export default function MoneyMasteryPage() {
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [earningAmount, setEarningAmount] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const monthKey = `${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1
  ).padStart(2, "0")}`;
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
    (a, b) => a.position - b.position
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
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    setSaveError(null);
    if (!selectedDate) return;

    if (!earningAmount.trim()) {
      setSaveError("Please enter an amount");
      return;
    }

    const amount = parseFloat(earningAmount);
    if (isNaN(amount)) {
      setSaveError("Please enter a valid number");
      return;
    }
    if (amount < 0) {
      setSaveError("Amount cannot be negative");
      return;
    }

    saveEntryMutation.mutate(
      { date: selectedDate, amount },
      {
        onSuccess: () => {
          setModalOpen(false);
          setEarningAmount("");
        },
      }
    );
  };

  const confirmClearDay = () => {
    if (!selectedDate) return;

    saveEntryMutation.mutate(
      { date: selectedDate, amount: 0 },
      {
        onSuccess: () => {
          setModalOpen(false);
          setEarningAmount("");
        },
      }
    );
  };

  const previousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  };

  const getEarningColor = (amount: number): string => {
    // All earning days get the same style
    return "bg-white border-emerald-600 text-emerald-600 shadow-sm";
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
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header
        title="Daily Abundance"
        hasBackButton={true}
        onBack={() => setLocation("/")}
      />

      <main className="max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Money Calendar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 sm:p-8 bg-white border-0 shadow-xl shadow-black/[0.03] rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-end">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      Money Calendar
                    </h2>
                  </div>
                </div>

                {/* Month Navigation Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-white p-2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-gray-50"
                    onClick={previousMonth}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </Button>

                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-gray-700 leading-none">
                      {selectedMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-gray-50"
                    onClick={nextMonth}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </Button>
                </motion.div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div
                      key={i}
                      className="text-center text-xs font-bold text-gray-600 tracking-wider py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-1.5">
                  {emptyDays.map((_, i) => (
                    <div key={i} className="aspect-square" />
                  ))}
                  {days.map((day) => {
                    const dateKey = formatDate(day);
                    const earning = earnings[dateKey];
                    const hasEarning = earning !== undefined && earning > 0;
                    const isHighestDay =
                      hasEarning &&
                      earning === summary.highest &&
                      summary.highest > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`relative aspect-square rounded-md flex flex-col items-center justify-center p-1
                          transition-all duration-200
                          hover:scale-[1.02] hover:shadow-sm
                          active:scale-[0.98]
                          ${
                            hasEarning
                              ? `${getEarningColor(earning)} border ${
                                  isHighestDay
                                    ? "ring-2 text-white bg-emerald-600 ring-amber-400 ring-offset-1 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                                    : ""
                                }`
                              : isToday(day)
                              ? "bg-brand/5 border border-brand text-brand shadow-sm font-bold"
                              : "bg-gray-300/70 border border-gray-300/70 text-gray-800"
                          }
                        `}
                        data-testid={`day-${day}`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isHighestDay ? "text-white" : "text-gray-800"
                          } ${hasEarning ? "mb-0.5" : ""}`}
                        >
                          {day}
                        </span>

                        {hasEarning && (
                          <div className="h-2 flex items-center justify-center">
                            <span
                              className={`text-[10px] font-semibold tracking-tight leading-none ${
                                isHighestDay ? "text-yellow-300" : ""
                              }`}
                            >
                              {formatAmountCompact(earning)}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Summary - Compact Single Card */}
              <div className="mt-6 md:mt-0 md:pl-4 lg:pl-6 md:w-48 lg:w-64 xl:w-72 flex flex-col justify-center">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 -mb-2">
                      Monthly Summary
                    </h3>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-6 h-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                          <Info className="w-3 h-3 text-gray-600" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4" align="end">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3">
                          Calendar Indicators
                        </h4>
                        <div className="space-y-2.5">
                          {/* Highest Day */}
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-600 text-white border-transparent ring-2 ring-amber-400 ring-offset-1 shadow-sm flex-shrink-0" />
                            <p className="text-xs text-gray-700">
                              Your best earning day
                            </p>
                          </div>

                          {/* Regular Earning */}
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-white border border-emerald-600 text-emerald-600 shadow-sm flex-shrink-0" />
                            <p className="text-xs text-gray-700">
                              Day with earnings
                            </p>
                          </div>

                          {/* No Earning */}
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-300/70 border border-gray-300/70 flex-shrink-0" />
                            <p className="text-xs text-gray-700">
                              Day without earnings
                            </p>
                          </div>

                          {/* Today */}
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand/5 border border-brand flex-shrink-0" />
                            <p className="text-xs text-gray-700">Current day</p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Total Earnings */}
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Earnings
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatINR(summary.total)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Highest Day */}
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Highest Day
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        {summary.highest > 0 ? formatINR(summary.highest) : "-"}
                      </p>
                    </div>

                    {/* Average / Day */}
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Average / Day
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        {summary.average > 0 ? formatINR(summary.average) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Earning Modal */}
        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSaveError(null);
          }}
        >
          <DialogContent className="sm:max-w-md w-[92%] rounded-2xl p-6 border-0 shadow-2xl">
            <div className="relative mb-1">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedDate && earnings[selectedDate]
                  ? "Update Log"
                  : "Daily Entry"}
              </DialogTitle>
              <p className="text-gray-500 text-sm mt-1 font-medium">
                Amount received for{" "}
                {selectedDate &&
                  new Date(selectedDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                  })}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 tracking-wide ml-1">
                  Earning Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-md font-bold text-gray-500">
                    ₹
                  </span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    type="number"
                    value={earningAmount}
                    onChange={(e) => {
                      setEarningAmount(e.target.value);
                      if (saveError) setSaveError(null);
                    }}
                    placeholder="0.00"
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-50 border border-gray-300 text-md font-semibold text-gray-900 placeholder:text-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all shadow-inner outline-none"
                  />
                </div>
                {saveError && (
                  <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                    {saveError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="default"
                  onClick={handleSave}
                  disabled={saveEntryMutation.isPending}
                  className="rounded-lg shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 border border-brand/20"
                >
                  {saveEntryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Save Entry
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={saveEntryMutation.isPending}
                  className="rounded-lg text-gray-500 hover:bg-gray-50 border border-gray-300"
                >
                  Cancel
                </Button>
              </div>

              {selectedDate &&
                typeof earnings[selectedDate] === "number" &&
                earnings[selectedDate] > 0 && (
                  <Button
                    onClick={confirmClearDay}
                    disabled={saveEntryMutation.isPending}
                    variant="ghost"
                    className="w-full text-red-600 border border-red-600 hover:bg-red-50 text-sm"
                  >
                    {saveEntryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Clear this day
                  </Button>
                )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Rewiring Belief Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h2 className="text-md font-bold text-gray-900 leading-tight">
                Rewired Beliefs
              </h2>
            </div>
            {beliefs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-brand font-bold text-xs bg-brand/5 px-4 rounded-full"
                onClick={() => setLocation("/rewiring-belief")}
              >
                Manage All
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {isLoadingBeliefs ? (
              <div className="grid grid-cols-1 gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white border border-gray-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : beliefs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {beliefs.slice(0, 3).map((belief, idx) => (
                  <motion.div
                    key={belief.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-5 border-0 shadow-lg shadow-black/[0.02] rounded-2xl bg-white group hover:shadow-xl transition-all">
                      <div className="space-y-6 pl-2">
                        {/* Limiting Section */}
                        <div className="relative pl-6 border-l-2 border-red-100">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-red-400 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-red-400" />
                          </div>
                          <p className="text-xs font-bold text-gray-500 tracking-wide mb-1">
                            Limiting
                          </p>
                          <p className="text-sm text-gray-500 font-medium break-words whitespace-pre-wrap">
                            {belief.limitingBelief}
                          </p>
                        </div>

                        {/* Rewired Section */}
                        <div className="relative pl-6 border-l-2 border-emerald-100">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center">
                            <Zap className="w-2 h-2 text-emerald-500 fill-current" />
                          </div>
                          <p className="text-xs font-bold text-gray-500 tracking-wide mb-1">
                            Rewired
                          </p>
                          <p className="text-sm text-gray-900 font-bold leading-relaxed break-words whitespace-pre-wrap">
                            {belief.upliftingBelief}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setLocation("/rewiring-belief")}
              >
                <Card className="p-3 bg-white rounded-2xl text-center shadow-none hover:border-brand/30 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-brand/5 text-brand rounded-full flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Start Rewiring
                  </h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto mb-3">
                    Transform your inner narrative and align with abundance.
                  </p>
                  <Button className="bg-brand text-white font-bold rounded-lg px-8 shadow-lg shadow-brand/20">
                    Create First Belief
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Challenges Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-md font-bold text-gray-900 leading-tight">
              Abundance Journeys
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoadingCourses
              ? [1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-40 bg-white border border-gray-100 rounded-2xl animate-pulse"
                  />
                ))
              : mappedCourses.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <Card
                      className="overflow-hidden border-0 shadow-lg shadow-black/[0.03] rounded-2xl bg-white group hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]"
                      onClick={() => setLocation(`/challenge/${course.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-1/3 aspect-video sm:aspect-square bg-gray-50 relative overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-brand/20 font-black text-xs">
                              No Cover
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent sm:hidden" />
                        </div>

                        <div className="flex-1 p-5 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2 hidden">
                            <BookOpen className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs font-black tracking-wide text-brand">
                              Challenge Journey
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-gray-900 group-hover:text-brand transition-colors leading-tight mb-2">
                            {course.title}
                          </h3>
                          {course.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
          </div>
        </div>
      </main>
    </div>
  );
}
