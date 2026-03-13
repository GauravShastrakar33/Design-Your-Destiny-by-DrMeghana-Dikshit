import { trackingRepository } from "../repositories/tracking.repository";
import { userRepository } from "../repositories/user.repository";
import { getTodayForUser } from "../utils/timezone";

export class TrackingServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TrackingServiceError";
  }
}

export const trackingService = {
  // ===== USER STREAK =====
  async markStreakToday(userId: number) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new TrackingServiceError("User not found", 401);
    }

    const todayDate = getTodayForUser(user.timezone);
    await trackingRepository.markUserActivityDate(userId, todayDate);
    
    return { success: true, date: todayDate };
  },

  async getLast7DaysStreak(userId: number, baseDateQuery?: string) {
    const baseDate = baseDateQuery || new Date().toISOString().split("T")[0];

    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const activeDates = await trackingRepository.getUserStreakDates(userId, dates);
    const activeDateSet = new Set(activeDates);

    return dates.map((date) => ({
      date,
      active: activeDateSet.has(date),
    }));
  },

  // ===== CONSISTENCY CALENDAR =====
  async getConsistencyMonth(userId: number, yearParam?: string, monthParam?: string) {
    if (!yearParam || !monthParam) {
      throw new TrackingServiceError("year and month query parameters are required", 400);
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new TrackingServiceError("Invalid year or month", 400);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const allDates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allDates.push(dateStr);
    }

    const activeDates = await trackingRepository.getUserStreakDates(userId, allDates);
    const activeDateSet = new Set(activeDates);

    const days = allDates.map(date => ({
      date,
      active: activeDateSet.has(date)
    }));

    return { year, month, days };
  },

  async getConsistencyRange(userId: number, todayDate?: string) {
    if (!todayDate || !/^\d{4}-\d{2}-\d{2}$/.test(todayDate)) {
      throw new TrackingServiceError("today query parameter required (YYYY-MM-DD)", 400);
    }

    const currentMonth = todayDate.slice(0, 7);
    const rangeData = await trackingRepository.getConsistencyRange(userId);
    const currentStreak = await trackingRepository.getCurrentStreak(userId, todayDate);

    return {
      startMonth: rangeData.startMonth,
      currentMonth,
      currentStreak,
    };
  },

  // ===== ACTIVITY LOGGING (AI INSIGHTS) =====
  async logActivity(userId: number, lessonId: any, lessonName: any, featureType: any) {
    if (!lessonId || typeof lessonId !== "number") {
      throw new TrackingServiceError("lessonId is required and must be a number", 400);
    }
    if (!lessonName || typeof lessonName !== "string") {
      throw new TrackingServiceError("lessonName is required", 400);
    }
    if (!featureType || !["PROCESS", "PLAYLIST"].includes(featureType)) {
      throw new TrackingServiceError("featureType must be PROCESS or PLAYLIST", 400);
    }

    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new TrackingServiceError("User not found", 401);
    }

    const todayDate = getTodayForUser(user.timezone);

    const result = await trackingRepository.logActivity(userId, lessonId, lessonName, featureType, todayDate);

    return { success: true, logged: result.logged };
  },

  async getMonthlyActivityStats(userId: number, monthQuery?: string) {
    const month = monthQuery || new Date().toISOString().slice(0, 7);
    
    console.log(`[monthly-stats] Fetching stats for userId=${userId}, month=${month}`);
    const stats = await trackingRepository.getMonthlyStats(userId, month);
    console.log(`[monthly-stats] Results: PROCESS=${stats.PROCESS.length}, PLAYLIST=${stats.PLAYLIST.length}`);
    
    return stats;
  }
};
