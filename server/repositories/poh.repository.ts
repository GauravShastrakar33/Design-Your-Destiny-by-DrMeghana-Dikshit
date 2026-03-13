import { db } from "../db";
import {
  projectOfHearts,
  pohMilestones,
  pohActions,
  pohDailyRatings,
  users,
} from "@shared/schema";
import { eq, and, or, asc, desc, count, countDistinct, gte, sql } from "drizzle-orm";
import type {
  ProjectOfHeart,
  PohMilestone,
  PohAction,
  PohDailyRating,
} from "@shared/schema";

export const pohRepository = {
  // ─── Project of Heart ──────────────────────────────────────────────────────

  async findAllByUser(userId: number): Promise<ProjectOfHeart[]> {
    return db
      .select()
      .from(projectOfHearts)
      .where(eq(projectOfHearts.userId, userId))
      .orderBy(asc(projectOfHearts.createdAt));
  },

  async findById(pohId: string): Promise<ProjectOfHeart | undefined> {
    const [poh] = await db
      .select()
      .from(projectOfHearts)
      .where(eq(projectOfHearts.id, pohId));
    return poh;
  },

  async create(data: {
    userId: number;
    title: string;
    why: string;
    category: string;
    customCategory?: string | null;
    status: string;
    startedAt: string | null;
  }): Promise<ProjectOfHeart> {
    const [newPOH] = await db.insert(projectOfHearts).values(data).returning();
    return newPOH;
  },

  async update(
    pohId: string,
    updates: Partial<{
      title: string;
      why: string;
      category: string;
      customCategory: string | null;
      visionImages: string[];
    }>
  ): Promise<ProjectOfHeart> {
    const [updated] = await db
      .update(projectOfHearts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectOfHearts.id, pohId))
      .returning();
    return updated;
  },

  async complete(
    pohId: string,
    data: { status: string; endedAt: string; closingReflection: string }
  ): Promise<void> {
    await db
      .update(projectOfHearts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectOfHearts.id, pohId));
  },

  async promoteNext(userId: number, today: string): Promise<void> {
    const userPOHs = await this.findAllByUser(userId);
    const nextPOH = userPOHs.find((p) => p.status === "next");
    if (nextPOH) {
      await db
        .update(projectOfHearts)
        .set({ status: "active", startedAt: today, updatedAt: new Date() })
        .where(eq(projectOfHearts.id, nextPOH.id));
    }
  },

  async findHistory(userId: number): Promise<ProjectOfHeart[]> {
    return db
      .select()
      .from(projectOfHearts)
      .where(
        and(
          eq(projectOfHearts.userId, userId),
          or(
            eq(projectOfHearts.status, "completed"),
            eq(projectOfHearts.status, "closed_early")
          )
        )
      )
      .orderBy(desc(projectOfHearts.endedAt));
  },

  // ─── Milestones ────────────────────────────────────────────────────────────

  async findMilestones(pohId: string): Promise<PohMilestone[]> {
    return db
      .select()
      .from(pohMilestones)
      .where(eq(pohMilestones.pohId, pohId))
      .orderBy(asc(pohMilestones.orderIndex));
  },

  async findMilestoneById(milestoneId: string): Promise<PohMilestone | undefined> {
    const [m] = await db
      .select()
      .from(pohMilestones)
      .where(eq(pohMilestones.id, milestoneId));
    return m;
  },

  async createMilestone(data: {
    pohId: string;
    text: string;
    orderIndex: number;
  }): Promise<PohMilestone> {
    const [m] = await db.insert(pohMilestones).values(data).returning();
    return m;
  },

  async updateMilestone(
    milestoneId: string,
    updates: { text: string }
  ): Promise<PohMilestone> {
    const [m] = await db
      .update(pohMilestones)
      .set(updates)
      .where(eq(pohMilestones.id, milestoneId))
      .returning();
    return m;
  },

  async achieveMilestone(
    milestoneId: string,
    achievedAt: string
  ): Promise<PohMilestone> {
    const [m] = await db
      .update(pohMilestones)
      .set({ achieved: true, achievedAt })
      .where(eq(pohMilestones.id, milestoneId))
      .returning();
    return m;
  },

  // ─── Actions ───────────────────────────────────────────────────────────────

  async findActions(pohId: string): Promise<PohAction[]> {
    return db
      .select()
      .from(pohActions)
      .where(eq(pohActions.pohId, pohId))
      .orderBy(asc(pohActions.orderIndex));
  },

  async replaceActions(pohId: string, actions: string[]): Promise<void> {
    await db.delete(pohActions).where(eq(pohActions.pohId, pohId));
    if (actions.length > 0) {
      await db.insert(pohActions).values(
        actions.map((text, index) => ({ pohId, text, orderIndex: index }))
      );
    }
  },

  // ─── Daily Ratings ─────────────────────────────────────────────────────────

  async findRatingByDate(
    userId: number,
    localDate: string
  ): Promise<PohDailyRating | undefined> {
    const [r] = await db
      .select()
      .from(pohDailyRatings)
      .where(
        and(
          eq(pohDailyRatings.userId, userId),
          eq(pohDailyRatings.localDate, localDate)
        )
      );
    return r;
  },

  async createRating(data: {
    userId: number;
    pohId: string;
    localDate: string;
    rating: number;
  }): Promise<PohDailyRating> {
    const [r] = await db.insert(pohDailyRatings).values(data).returning();
    return r;
  },

  async updateRating(ratingId: string, rating: number): Promise<PohDailyRating> {
    const [r] = await db
      .update(pohDailyRatings)
      .set({ rating })
      .where(eq(pohDailyRatings.id, ratingId))
      .returning();
    return r;
  },

  // ─── Admin Analytics ────────────────────────────────────────────────

  async getUsageStats() {
    const [totalUsersRow] = await db.select({ count: count() }).from(users);
    const totalUsers = Number(totalUsersRow?.count) || 0;

    const [usersWithPohRow] = await db
      .select({ count: countDistinct(projectOfHearts.userId) })
      .from(projectOfHearts);
    const usersWithPoh = Number(usersWithPohRow?.count) || 0;

    const [activeRow] = await db
      .select({ count: count() })
      .from(projectOfHearts)
      .where(eq(projectOfHearts.status, "active"));
    const active = Number(activeRow?.count) || 0;

    const [nextRow] = await db
      .select({ count: count() })
      .from(projectOfHearts)
      .where(eq(projectOfHearts.status, "next"));
    const next = Number(nextRow?.count) || 0;

    return { total_users: totalUsers, users_with_poh: usersWithPoh, active, next };
  },

  async getDailyCheckins() {
    const today = new Date().toISOString().split("T")[0];

    const [todayRow] = await db
      .select({ count: countDistinct(pohDailyRatings.userId) })
      .from(pohDailyRatings)
      .where(eq(pohDailyRatings.localDate, today));
    const todayCheckedIn = Number(todayRow?.count) || 0;

    const [activeUsersRow] = await db
      .select({ count: countDistinct(projectOfHearts.userId) })
      .from(projectOfHearts)
      .where(eq(projectOfHearts.status, "active"));
    const activeUsers = Number(activeUsersRow?.count) || 0;
    const percentOfActive = activeUsers > 0 ? Math.round((todayCheckedIn / activeUsers) * 100) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const last30DaysResult = await db
      .select({ date: pohDailyRatings.localDate, count: countDistinct(pohDailyRatings.userId) })
      .from(pohDailyRatings)
      .where(gte(pohDailyRatings.localDate, thirtyDaysAgoStr))
      .groupBy(pohDailyRatings.localDate)
      .orderBy(asc(pohDailyRatings.localDate));

    const dateMap = new Map(last30DaysResult.map((r) => [r.date, Number(r.count)]));
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      last30Days.push({ date: dateStr, users_checked_in: dateMap.get(dateStr) || 0 });
    }

    return {
      today: { date: today, users_checked_in: todayCheckedIn, percent_of_active_users: percentOfActive },
      last_30_days: last30Days,
    };
  },

  async getProgressSignals() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const [completedPohRow] = await db
      .select({ count: count() })
      .from(projectOfHearts)
      .where(eq(projectOfHearts.status, "completed"));
    const completedPoh = Number(completedPohRow?.count) || 0;

    const [achieved30Row] = await db
      .select({ count: count() })
      .from(pohMilestones)
      .where(and(eq(pohMilestones.achieved, true), gte(pohMilestones.achievedAt, thirtyDaysAgoStr)));
    const milestonesAchieved30 = Number(achieved30Row?.count) || 0;

    const firstMilestonesResult = await db.execute(sql`
      SELECT AVG(days_to_first)::float as avg_days FROM (
        SELECT p.id, MIN(m.achieved_at::date - p.started_at::date) as days_to_first
        FROM project_of_hearts p
        JOIN poh_milestones m ON m.poh_id = p.id
        WHERE m.achieved = true AND p.started_at IS NOT NULL AND m.achieved_at IS NOT NULL
        GROUP BY p.id
      ) sub
    `);
    const avgDaysToFirst = Math.round((firstMilestonesResult.rows[0] as any)?.avg_days || 0);

    return {
      completed_poh: completedPoh,
      milestones_achieved_30_days: milestonesAchieved30,
      avg_days_to_first_milestone: avgDaysToFirst || 0,
    };
  },

  async getDropOffs() {
    const [closedEarlyRow] = await db
      .select({ count: count() })
      .from(projectOfHearts)
      .where(eq(projectOfHearts.status, "closed_early"));
    const closedEarly = Number(closedEarlyRow?.count) || 0;

    const noMilestonesResult = await db.execute(sql`
      SELECT COUNT(DISTINCT p.id) as count
      FROM project_of_hearts p
      LEFT JOIN poh_milestones m ON m.poh_id = p.id AND m.achieved = true
      WHERE p.status = 'active' AND m.id IS NULL
    `);
    const activeNoMilestones = parseInt((noMilestonesResult.rows[0] as any)?.count || "0");

    const avgDurationResult = await db.execute(sql`
      SELECT AVG(ended_at::date - started_at::date)::float as avg_days
      FROM project_of_hearts
      WHERE ended_at IS NOT NULL AND started_at IS NOT NULL
        AND status IN ('completed', 'closed_early')
    `);
    const avgDuration = Math.round((avgDurationResult.rows[0] as any)?.avg_days || 0);

    return {
      closed_early: closedEarly,
      active_with_no_milestones: activeNoMilestones,
      avg_active_duration_days: avgDuration || 0,
    };
  },

  async getLifeAreas() {
    const categoryResult = await db
      .select({ category: projectOfHearts.category, count: count() })
      .from(projectOfHearts)
      .where(eq(projectOfHearts.status, "active"))
      .groupBy(projectOfHearts.category);

    const result: Record<string, number> = { career: 0, health: 0, relationships: 0, wealth: 0, other: 0 };
    categoryResult.forEach((r) => {
      if (r.category in result) result[r.category] = Number(r.count) || 0;
    });
    return result;
  },
};
