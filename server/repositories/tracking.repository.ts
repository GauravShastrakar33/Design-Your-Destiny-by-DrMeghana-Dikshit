import { db } from "../db";
import { 
  userStreaks as userStreaksTable,
  users as usersTable,
  activityLogs as activityLogsTable,
  type UserStreak,
  type ActivityLog,
  type FeatureType 
} from "@shared/schema";
import { eq, and, inArray, asc, desc, sql } from "drizzle-orm";

export class TrackingRepository {
  // ===== USER STREAKS =====

  async markUserActivityDate(userId: number, activityDate: string): Promise<UserStreak> {
    const [existing] = await db
      .select()
      .from(userStreaksTable)
      .where(and(eq(userStreaksTable.userId, userId), eq(userStreaksTable.activityDate, activityDate)));

    if (existing) {
      // Update lastActivity even if streak already exists (for accurate "Active Today" tracking)
      await db.update(usersTable).set({ lastActivity: new Date() }).where(eq(usersTable.id, userId));
      return existing;
    }

    const [newStreak] = await db
      .insert(userStreaksTable)
      .values({ userId, activityDate })
      .returning();

    // Update users.lastActivity to track recent activity for Admin Dashboard
    await db.update(usersTable).set({ lastActivity: new Date() }).where(eq(usersTable.id, userId));

    return newStreak;
  }

  async getUserStreakDates(userId: number, dates: string[]): Promise<string[]> {
    if (dates.length === 0) return [];

    const records = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(and(
        eq(userStreaksTable.userId, userId),
        inArray(userStreaksTable.activityDate, dates)
      ));

    return records.map(r => r.activityDate);
  }

  async getConsistencyRange(userId: number): Promise<{ startMonth: string | null; currentMonth: string }> {
    const [earliest] = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, userId))
      .orderBy(asc(userStreaksTable.activityDate))
      .limit(1);

    const startMonth = earliest ? earliest.activityDate.slice(0, 7) : null;

    return { startMonth, currentMonth: "current" };
  }

  async getCurrentStreak(userId: number, todayDate: string): Promise<number> {
    const allRecords = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, userId))
      .orderBy(desc(userStreaksTable.activityDate));

    if (allRecords.length === 0) return 0;

    const activeDates = new Set(allRecords.map(r => r.activityDate));

    let streak = 0;
    let checkDate = new Date(todayDate + 'T12:00:00');

    if (!activeDates.has(todayDate)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // ===== ACTIVITY LOGS (AI INSIGHTS) =====

  async logActivity(
    userId: number,
    lessonId: number,
    lessonName: string,
    featureType: FeatureType,
    activityDate: string
  ): Promise<{ logged: boolean; activity: ActivityLog }> {
    // Validate date format only
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(activityDate)) {
      throw new Error(`Invalid date format: ${activityDate}`);
    }

    // Check if already logged for this user/lesson/feature/date
    const [existing] = await db
      .select()
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.userId, userId),
        eq(activityLogsTable.lessonId, lessonId),
        eq(activityLogsTable.featureType, featureType),
        eq(activityLogsTable.activityDate, activityDate)
      ));

    if (existing) {
      // Update lastActivity even if already logged (for accurate "Active Today" tracking)
      await db
        .update(usersTable)
        .set({ lastActivity: new Date() })
        .where(eq(usersTable.id, userId));
      return { logged: false, activity: existing };
    }

    // Insert new activity log
    const [newLog] = await db
      .insert(activityLogsTable)
      .values({ userId, lessonId, lessonName, featureType, activityDate })
      .returning();

    // Update users.lastActivity to track recent activity for Admin Dashboard
    await db
      .update(usersTable)
      .set({ lastActivity: new Date() })
      .where(eq(usersTable.id, userId));

    return { logged: true, activity: newLog };
  }

  async getMonthlyStats(userId: number, month: string): Promise<{
    PROCESS: { lessonId: number; lessonName: string; count: number }[];
    PLAYLIST: { lessonId: number; lessonName: string; count: number }[];
    maxCount: number;
  }> {
    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      month = new Date().toISOString().slice(0, 7);
    }

    // Ensure month is within last 6 months
    const now = new Date();
    const inputDate = new Date(month + '-01');
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    if (inputDate < sixMonthsAgo) {
      month = sixMonthsAgo.toISOString().slice(0, 7);
    }

    // Query activities for the given month
    const activities = await db
      .select({
        lessonId: activityLogsTable.lessonId,
        lessonName: activityLogsTable.lessonName,
        featureType: activityLogsTable.featureType,
        count: sql<number>`cast(count(${activityLogsTable.id}) as int)`,
      })
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.userId, userId),
        sql`${activityLogsTable.activityDate} >= ${month + '-01'}`,
        sql`${activityLogsTable.activityDate} <= ${month + '-31'}`
      ))
      .groupBy(
        activityLogsTable.lessonId,
        activityLogsTable.lessonName,
        activityLogsTable.featureType
      )
      .orderBy(desc(sql`count(${activityLogsTable.id})`));

    // Format the response
    const result = {
      PROCESS: [] as { lessonId: number; lessonName: string; count: number }[],
      PLAYLIST: [] as { lessonId: number; lessonName: string; count: number }[],
      maxCount: 0
    };

    let maxCount = 0;

    for (const activity of activities) {
      const type = activity.featureType as 'PROCESS' | 'PLAYLIST';
      const item = {
        lessonId: activity.lessonId,
        lessonName: activity.lessonName,
        count: activity.count
      };
      
      if (type === 'PROCESS') {
        result.PROCESS.push(item);
      } else if (type === 'PLAYLIST') {
        result.PLAYLIST.push(item);
      }
      
      if (activity.count > maxCount) {
        maxCount = activity.count;
      }
    }

    result.maxCount = maxCount;
    return result;
  }
}

export const trackingRepository = new TrackingRepository();
