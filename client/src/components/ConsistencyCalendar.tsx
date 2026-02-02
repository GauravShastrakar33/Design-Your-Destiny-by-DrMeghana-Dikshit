import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  CalendarDays,
} from "lucide-react";

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
    <div
      className="bg-white rounded-xl p-4 shadow-sm"
      data-testid="consistency-calendar"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-md font-semibold text-primary-text">
            Your Consistency Calendar
          </h3>
        </div>
          <CalendarDays className="w-5 h-5 text-primary" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          disabled={!canGoBack}
          className={`p-2 rounded-lg transition ${
            canGoBack
              ? "hover:bg-gray-100 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          }`}
          data-testid="button-prev-month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span
          className="text-sm font-medium text-gray-800"
          data-testid="text-current-month"
        >
          {monthNames[viewMonth - 1]} {viewYear}
        </span>
        <button
          onClick={handleNextMonth}
          disabled={!canGoForward}
          className={`p-2 rounded-lg transition ${
            canGoForward
              ? "hover:bg-gray-100 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          }`}
          data-testid="button-next-month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-end gap-4 text-xs mb-3">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="text-gray-600">Active</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-200"></span>
          <span className="text-gray-600">Inactive</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs text-gray-500 font-medium py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-x-8 gap-y-2 place-items-center">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="w-12 h-12" />;
              }

              const isFuture = day.date > todayDate;
              const isToday = day.date === todayDate;
              const isActive = day.active;

              let bgColor = "bg-gray-200";
              let textColor = "text-gray-600";

              if (isFuture) {
                bgColor = "bg-gray-100";
                textColor = "text-gray-300";
              } else if (isActive) {
                bgColor = "bg-amber-400";
                textColor = "text-amber-900";
              }

              const dayDate = new Date(day.date);
              const today = new Date(todayDate);
              const diffTime = today.getTime() - dayDate.getTime();
              const daysFromToday = Math.round(diffTime / (1000 * 3600 * 24));

              // Show flame if:
              // 1. Streak is at least 7 days (showFlame)
              // 2. This day is active
              // 3. This day is within the current streak window (relative to today)
              const isPartOfStreak =
                showFlame &&
                isActive &&
                daysFromToday >= 0 &&
                daysFromToday < currentStreak;

              const dayNum = parseInt(day.date.split("-")[2], 10);

              return (
                <div
                  key={day.date}
                  className={`aspect-square w-10 h-10 flex items-center justify-center rounded-full relative ${bgColor} ${
                    isToday ? "ring-2 ring-primary ring-offset-1" : ""
                  }`}
                  data-testid={`day-${day.date}`}
                >
                  <span className={`text-sm font-medium ${textColor}`}>
                    {dayNum}
                  </span>
                  {isPartOfStreak && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px] ring-2 ring-white z-10 shadow-sm">
                      <Flame
                        className="w-4 h-4 text-orange-500"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!startMonth && !isLoading && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Start using the app daily to build your consistency!
        </p>
      )}
    </div>
  );
}
