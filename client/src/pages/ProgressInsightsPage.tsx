import {
  ArrowLeft,
  Music,
  ListMusic,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  Quote,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface ActivityItem {
  lessonId: number;
  lessonName: string;
  count: number;
}

interface MonthlyStats {
  PROCESS: ActivityItem[];
  PLAYLIST: ActivityItem[];
  maxCount: number;
}

function HorizontalBar({
  label,
  count,
  maxCount,
  color = "brand",
}: {
  label: string;
  count: number;
  maxCount: number;
  color?: "brand" | "pink";
}) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const barColor =
    color === "brand"
      ? "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]"
      : "bg-gradient-to-r from-pink-400 to-pink-600";
  const lightColor = color === "brand" ? "bg-brand/5" : "bg-pink-50";

  return (
    <div className="mb-5 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-400">
            Count
          </span>
          <span
            className={`text-sm font-semibold ${
              color === "brand" ? "text-brand" : "text-pink-500"
            }`}
          >
            {count}
          </span>
        </div>
      </div>
      <div
        className={`w-full ${lightColor} h-2.5 rounded-full overflow-hidden border border-black/[0.03]`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor} shadow-sm`}
        />
      </div>
    </div>
  );
}

function getAvailableMonths(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    months.push({ value, label });
  }

  return months;
}

export default function ProgressInsightsPage() {
  const [, setLocation] = useLocation();
  const availableMonths = getAvailableMonths();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  const selectedMonth = availableMonths[selectedMonthIndex];
  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  const {
    data: monthlyData,
    isLoading,
    error,
  } = useQuery<MonthlyStats>({
    queryKey: ["/api/v1/activity/monthly-stats", selectedMonth?.value],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/activity/monthly-stats?month=${selectedMonth?.value}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("@app:user_token")}`,
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch monthly stats");
      return response.json();
    },
    enabled: isAuthenticated && !!selectedMonth,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const handlePrevMonth = () => {
    if (selectedMonthIndex < availableMonths.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  const hasAnyData =
    monthlyData &&
    (monthlyData.PROCESS.length > 0 || monthlyData.PLAYLIST.length > 0);

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: "#F3F3F3" }}
      >
        <div className="max-w-md mx-auto">
          <Header
            title="Progress Insights"
            hasBackButton={true}
            onBack={() => setLocation("/")}
          />
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">
              Please log in to view your practice insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <Header
        title="Progress Insights"
        hasBackButton={true}
        onBack={() => setLocation("/")}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Month Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            disabled={selectedMonthIndex >= availableMonths.length - 1}
            className="w-12 h-12 rounded-2xl hover:bg-gray-50 text-gray-400 disabled:opacity-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <div className="flex flex-col items-center flex-1 mx-2">
            <span className="text-xs sm:text-xs font-semibold text-gray-400 tracking-wide mb-0.5 whitespace-nowrap">
              Viewing Stats For
            </span>
            <span className="text-base sm:text-lg font-bold text-gray-900 leading-none text-center">
              {selectedMonth?.label}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            disabled={selectedMonthIndex <= 0}
            className="w-12 h-12 rounded-2xl hover:bg-gray-50 text-gray-400 disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
              <p className="text-gray-400 font-bold text-sm tracking-wide">
                Gathering Insights...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-white rounded-2xl border border-red-50 text-center shadow-sm"
            >
              <p className="text-red-500 font-bold mb-2">
                Oops! Something went wrong.
              </p>
              <p className="text-gray-500 text-sm">
                We couldn't fetch your insights. Please try again.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl font-bold"
                onClick={() => window.location.reload()}
              >
                Retry Now
              </Button>
            </motion.div>
          ) : monthlyData ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-0 shadow-xl shadow-black/[0.03] rounded-2xl overflow-hidden bg-white">
                <div className="p-6 sm:p-8 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h2 className="text-md font-bold text-gray-900 leading-tight">
                        Monthly Overview
                      </h2>
                      <p className="text-sm text-gray-400 font-medium">
                        Your consistency in {selectedMonth?.label}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-4">
                  {monthlyData?.PROCESS?.length > 0 && (
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-brand flex items-center justify-center border border-purple-100">
                            <Music className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            Processes
                          </h3>
                        </div>
                        <span className="text-[10px] font-black bg-purple-50 text-brand px-2 py-1 rounded-full border border-purple-100">
                          Total {monthlyData?.PROCESS?.length || 0}
                        </span>
                      </div>
                      {monthlyData?.PROCESS?.map((item, idx) => (
                        <HorizontalBar
                          key={item.lessonId || idx}
                          label={item.lessonName}
                          count={item.count}
                          maxCount={monthlyData?.maxCount || 0}
                          color="brand"
                        />
                      ))}
                    </div>
                  )}

                  {monthlyData?.PLAYLIST?.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100">
                            <ListMusic className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            My Playlist
                          </h3>
                        </div>
                        <span className="text-[10px] font-black bg-pink-50 text-pink-500 px-2 py-1 rounded-full border border-pink-100">
                          Total {monthlyData?.PLAYLIST?.length || 0}
                        </span>
                      </div>
                      {monthlyData?.PLAYLIST?.map((item, idx) => (
                        <HorizontalBar
                          key={item.lessonId || idx}
                          label={item.lessonName}
                          count={item.count}
                          maxCount={monthlyData?.maxCount || 0}
                          color="pink"
                        />
                      ))}
                    </div>
                  )}

                  {hasAnyData ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 p-5 sm:p-6 bg-gradient-to-br from-brand/5 via-white to-pink-50/50 rounded-2xl border border-brand/10 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-12 h-12 text-brand" />
                      </div>
                      <Quote className="w-6 h-6 text-brand/40 mb-3" />
                      <p className="text-sm sm:text-md font-semibold text-gray-800 leading-relaxed italic relative z-10">
                        "You came back again and again. That's growth."
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">
                        Begin Your Journey
                      </h3>
                      <p className="text-sm text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                        No activity recorded for {selectedMonth?.label} yet.
                      </p>
                      <Button
                        onClick={() => setLocation("/")}
                        className="mt-6 rounded-lg bg-brand hover:bg-brand/90 font-semibold px-8"
                      >
                        Start Practicing
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
