import { db } from "../db";
import { 
  userBadges as userBadgesTable,
  userStreaks as userStreaksTable,
  type UserBadge
} from "@shared/schema";
import { eq, and, desc, asc, count, inArray } from "drizzle-orm";

export class BadgeRepository {
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return db
      .select()
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, userId))
      .orderBy(desc(userBadgesTable.earnedAt));
  }

  async getUserBadgeKeys(userId: number): Promise<string[]> {
    const badges = await db
      .select({ badgeKey: userBadgesTable.badgeKey })
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, userId));
    return badges.map(b => b.badgeKey);
  }

  async awardBadge(userId: number, badgeKey: string, metadata?: object): Promise<UserBadge | null> {
    try {
      const [badge] = await db
        .insert(userBadgesTable)
        .values({ userId, badgeKey, metadata: metadata || null })
        .onConflictDoNothing()
        .returning();
      return badge || null;
    } catch {
      return null;
    }
  }

  async hasBadge(userId: number, badgeKey: string): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(userBadgesTable)
      .where(and(
        eq(userBadgesTable.userId, userId),
        eq(userBadgesTable.badgeKey, badgeKey)
      ));
    return (result?.count ?? 0) > 0;
  }

  // Need streak dates for robust streak validation logic in badge evaluations
  async getAllStreakHistory(userId: number): Promise<string[]> {
    const records = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, userId))
      .orderBy(asc(userStreaksTable.activityDate));
    return records.map(r => r.activityDate);
  }

  async getBadgeMetadata(userId: number, badgeKey: string): Promise<object | null> {
    const [badge] = await db
      .select({ metadata: userBadgesTable.metadata })
      .from(userBadgesTable)
      .where(and(
        eq(userBadgesTable.userId, userId),
        eq(userBadgesTable.badgeKey, badgeKey)
      ));
    return badge?.metadata as object | null;
  }

  async updateBadgeMetadata(userId: number, badgeKey: string, metadata: object): Promise<void> {
    await db
      .update(userBadgesTable)
      .set({ metadata })
      .where(and(
        eq(userBadgesTable.userId, userId),
        eq(userBadgesTable.badgeKey, badgeKey)
      ));
  }

  async getUnnotifiedBadgeKeys(userId: number): Promise<string[]> {
    const badges = await db
      .select({ badgeKey: userBadgesTable.badgeKey })
      .from(userBadgesTable)
      .where(and(
        eq(userBadgesTable.userId, userId),
        eq(userBadgesTable.notified, false)
      ));
    return badges.map(b => b.badgeKey);
  }

  async markBadgesAsNotified(userId: number, badgeKeys: string[]): Promise<void> {
    if (badgeKeys.length === 0) return;
    await db
      .update(userBadgesTable)
      .set({ notified: true })
      .where(and(
        eq(userBadgesTable.userId, userId),
        inArray(userBadgesTable.badgeKey, badgeKeys)
      ));
  }
}

export const badgeRepository = new BadgeRepository();
