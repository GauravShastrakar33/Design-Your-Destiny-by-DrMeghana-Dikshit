import { db } from "../db";
import {
  users,
  activityLogs,
  userBadges,
  events as eventsTable,
  notificationLogs,
  deviceTokens,
  communitySessions,
  cmsCourses,
} from "@shared/schema";
import {
  eq,
  and,
  or,
  gte,
  lt,
  asc,
  desc,
  count,
  countDistinct,
} from "drizzle-orm";

export const dashboardRepository = {
  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // ─── KPIs ─────────────────────────────────────────────────────────────────
    const [
      totalUsersResult,
      activeTodayResult,
      practisedTodayResult,
      badgesEarnedTodayResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users).where(eq(users.role, "USER")),
      db.select({ count: count() }).from(users).where(
        and(eq(users.role, "USER"), gte(users.lastActivity, twentyFourHoursAgo))
      ),
      db.select({ count: countDistinct(activityLogs.userId) }).from(activityLogs).where(
        and(
          gte(activityLogs.createdAt, twentyFourHoursAgo),
          or(
            eq(activityLogs.featureType, "PROCESS"),
            eq(activityLogs.featureType, "PLAYLIST")
          )
        )
      ),
      db.select({ count: count() }).from(userBadges).where(
        gte(userBadges.earnedAt, twentyFourHoursAgo)
      ),
    ]);

    // ─── Events ───────────────────────────────────────────────────────────────
    const [eventsToday, upcomingEvents] = await Promise.all([
      db.select().from(eventsTable).where(
        and(gte(eventsTable.startDatetime, today), lt(eventsTable.startDatetime, tomorrow))
      ).orderBy(asc(eventsTable.startDatetime)),
      db.select().from(eventsTable).where(
        and(gte(eventsTable.startDatetime, tomorrow), lt(eventsTable.startDatetime, sevenDaysLater))
      ).orderBy(asc(eventsTable.startDatetime)),
    ]);

    // ─── Notifications Health ─────────────────────────────────────────────────
    const [failedNotificationsResult, usersWithDeviceTokens, totalUserCount] =
      await Promise.all([
        db.select({ count: count() }).from(notificationLogs).where(
          and(
            eq(notificationLogs.status, "failed"),
            gte(notificationLogs.createdAt, twentyFourHoursAgo)
          )
        ),
        db.select({ count: countDistinct(deviceTokens.userId) }).from(deviceTokens),
        db.select({ count: count() }).from(users).where(eq(users.role, "USER")),
      ]);

    // ─── Community Practices ──────────────────────────────────────────────────
    const [communityPracticesResult] = await db
      .select({ count: count() })
      .from(communitySessions);

    // ─── CMS Health ───────────────────────────────────────────────────────────
    const [totalCoursesResult, publishedCoursesResult, lastUpdatedCourseResult] =
      await Promise.all([
        db.select({ count: count() }).from(cmsCourses),
        db.select({ count: count() }).from(cmsCourses).where(eq(cmsCourses.isPublished, true)),
        db
          .select({ id: cmsCourses.id, title: cmsCourses.title, updatedAt: cmsCourses.updatedAt })
          .from(cmsCourses)
          .orderBy(desc(cmsCourses.updatedAt))
          .limit(1),
      ]);

    return {
      kpis: {
        totalUsers:        totalUsersResult[0]?.count        ?? 0,
        activeToday:       activeTodayResult[0]?.count       ?? 0,
        practisedToday:    practisedTodayResult[0]?.count    ?? 0,
        badgesEarnedToday: badgesEarnedTodayResult[0]?.count ?? 0,
      },
      events: {
        today:    eventsToday,
        upcoming: upcomingEvents,
      },
      notifications: {
        failedLast24h:  failedNotificationsResult[0]?.count ?? 0,
        usersDisabled:
          Number(totalUserCount[0]?.count ?? 0) -
          Number(usersWithDeviceTokens[0]?.count ?? 0),
      },
      communityPractices: {
        total: communityPracticesResult?.count ?? 0,   // row already destructured
      },

      cmsHealth: {
        totalCourses:     totalCoursesResult[0]?.count     ?? 0,
        publishedCourses: publishedCoursesResult[0]?.count ?? 0,
        lastUpdatedCourse: lastUpdatedCourseResult[0]
          ? {
              title:     lastUpdatedCourseResult[0].title,
              updatedAt: lastUpdatedCourseResult[0].updatedAt,
            }
          : null,
      },
      // raw events for controller to shape
      _rawEventsToday:    eventsToday,
      _rawUpcomingEvents: upcomingEvents,
    };
  },
};
