import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface ConsistencyDay {
  date: string;
  active: boolean;
}

interface MonthData {
  year: number;
  month: number;
  days: ConsistencyDay[];
}

interface RangeData {
  startMonth: string | null;
  currentMonth: string;
  currentStreak: number;
}

interface ConsistencyCalendarProps {
  visible?: boolean;
}

export default function ConsistencyCalendar({
  visible = true,
}: ConsistencyCalendarProps) {
  // 🔥 DEV ONLY — remove after UI check
  // const FORCE_TEST_FLAME = true;

  const userToken = localStorage.getItem("@app:user_token");

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const todayDate = useMemo(() => getTodayDate(), []);
  const todayMonth = useMemo(() => todayDate.slice(0, 7), [todayDate]);

  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth() + 1);

  const { data: rangeData, isLoading: isRangeLoading } = useQuery<RangeData>({
    queryKey: ["/api/v1/consistency/range", todayDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/consistency/range?today=${todayDate}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch range");
      return response.json();
    },
    enabled: !!userToken && visible,
  });

  const { data: monthData, isLoading: isMonthLoading } = useQuery<MonthData>({
    queryKey: ["/api/v1/consistency/month", viewYear, viewMonth],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/consistency/month?year=${viewYear}&month=${viewMonth}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch month data");
      return response.json();
    },
    enabled: !!userToken && visible,
  });

  const currentStreak = rangeData?.currentStreak || 0;
  //replace above line with following two lines
  // const apiStreak = rangeData?.currentStreak || 0;
  // const currentStreak = FORCE_TEST_FLAME ? 7 : apiStreak;

  const showFlame = currentStreak >= 7;
  const startMonth = rangeData?.startMonth || null;
  const currentMonth = rangeData?.currentMonth || todayMonth;

  const viewMonthStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
  const canGoBack = startMonth ? viewMonthStr > startMonth : false;
  const canGoForward = viewMonthStr < currentMonth;

  const handlePrevMonth = () => {
    if (!canGoBack) return;
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoForward) return;
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (ConsistencyDay | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const dayData = monthData?.days.find((d) => d.date === dateStr);
      days.push({
        date: dateStr,
        active: dayData?.active || false,
      });
    }

    return days;
  }, [monthData, viewYear, viewMonth, firstDayOfMonth, daysInMonth]);

  if (!visible) return null;

  const isLoading = isRangeLoading || isMonthLoading;

  return (
    <Card
      className="border-0 shadow-md rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-white"
      data-testid="consistency-calendar"
    >
      <div className="p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-brand shadow-sm flex-shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-none">
                Consistency Calendar
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Track your growth
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-xs font-bold text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 shadow-sm"></span>
              <span className="tracking-widest">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-100 border border-gray-200 shadow-sm"></span>
              <span className="tracking-widest">Inactive</span>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-gray-50/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 mb-6 sm:mb-8">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoBack}
            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
              canGoBack
                ? "hover:bg-white hover:shadow-sm text-gray-700 active:scale-95"
                : "text-gray-300 cursor-not-allowed"
            }`}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span
            className="text-sm sm:text-base font-bold text-gray-800 tracking-tight"
            data-testid="text-current-month"
          >
            {monthNames[viewMonth - 1]} {viewYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={!canGoForward}
            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
              canGoForward
                ? "hover:bg-white hover:shadow-sm text-gray-700 active:scale-95"
                : "text-gray-300 cursor-not-allowed"
            }`}
            data-testid="button-next-month"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 sm:py-12">
            <Loader2 className="w-8 h-8 text-brand/40 animate-spin" />
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-[8px] sm:text-xs text-gray-400 font-black uppercase tracking-widest"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3 place-items-center">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="w-8 h-8 sm:w-10 sm:h-10"
                    />
                  );
                }

                const isFuture = day.date > todayDate;
                const isToday = day.date === todayDate;
                const isActive = day.active;

                let bgColor = "bg-gray-100";
                let textColor = "text-gray-500";
                let borderColor = "border-transparent";

                if (isFuture) {
                  bgColor = "bg-gray-50/50";
                  textColor = "text-gray-300";
                } else if (isActive) {
                  bgColor =
                    "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]";
                  textColor = "text-amber-900";
                }

                const dayNum = parseInt(day.date.split("-")[2], 10);

                const dayDate = new Date(day.date);
                const today = new Date(todayDate);
                const diffTime = today.getTime() - dayDate.getTime();
                const daysFromToday = Math.round(diffTime / (1000 * 3600 * 24));

                const isPartOfStreak =
                  showFlame &&
                  isActive &&
                  daysFromToday >= 0 &&
                  daysFromToday < currentStreak;

                return (
                  <div
                    key={day.date}
                    className={`group relative aspect-square w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-2xl border border-transparent transition-all duration-300 ${bgColor} ${
                      isToday
                        ? "ring-2 ring-brand ring-offset-2 scale-110 z-10"
                        : ""
                    } hover:scale-110`}
                    data-testid={`day-${day.date}`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-black ${textColor}`}
                    >
                      {dayNum}
                    </span>
                    {isPartOfStreak && (
                      <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-white rounded-full p-[1.5px] sm:p-[2px] shadow-sm z-20">
                        <Flame
                          className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500 fill-orange-500"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!startMonth && !isLoading && (
              <div className="mt-8 sm:mt-10 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-50 text-center">
                <p className="text-xs sm:text-xs font-medium text-indigo-400">
                  Begin your wellness journey today.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
