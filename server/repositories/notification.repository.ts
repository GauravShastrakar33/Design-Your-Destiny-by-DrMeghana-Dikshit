import { db } from "../db";
import {
  type InsertNotification,
  type InsertNotificationLog,
  notificationLogs as notificationLogsTable,
  notifications as notificationsTable,
  deviceTokens as deviceTokensTable,
  programs as programsTable,
  userPrograms as userProgramsTable,
} from "@shared/schema";
import { eq, and, asc, desc, countDistinct, inArray, sql } from "drizzle-orm";

export const notificationRepository = {
  // ─── User In-App Notifications ────────────────────────────────────────────

  async getUserNotifications(userId: number) {
    const results = await db
      .select({
        id:             notificationsTable.id,
        title:          notificationsTable.title,
        body:           notificationsTable.body,
        type:           notificationsTable.type,
        relatedEventId: notificationsTable.relatedEventId,
        createdAt:      notificationLogsTable.createdAt,
      })
      .from(notificationLogsTable)
      .innerJoin(notificationsTable, eq(notificationLogsTable.notificationId, notificationsTable.id))
      .where(eq(notificationLogsTable.userId, userId))
      .orderBy(desc(notificationLogsTable.createdAt));

    // Deduplicate by notification ID (user may have multiple device tokens)
    const seen = new Set<number>();
    return results
      .filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
      .map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },

  async getUnreadCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: countDistinct(notificationLogsTable.notificationId) })
      .from(notificationLogsTable)
      .where(and(eq(notificationLogsTable.userId, userId), eq(notificationLogsTable.isRead, false)));
    return Number(result?.count) ?? 0;
  },

  async markAsRead(userId: number, notificationId: number): Promise<void> {
    await db
      .update(notificationLogsTable)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notificationLogsTable.userId, userId), eq(notificationLogsTable.notificationId, notificationId)));
  },

  async markAllAsRead(userId: number): Promise<void> {
    await db
      .update(notificationLogsTable)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notificationLogsTable.userId, userId), eq(notificationLogsTable.isRead, false)));
  },

  // ─── Device Tokens ────────────────────────────────────────────────────────

  async upsertDeviceToken(userId: number, token: string, platform: string): Promise<void> {
    await db
      .insert(deviceTokensTable)
      .values({ userId, token, platform })
      .onConflictDoUpdate({
        target: deviceTokensTable.token,
        set: { userId, platform },
      });
  },

  async deleteDeviceToken(userId: number, token: string): Promise<void> {
    await db
      .delete(deviceTokensTable)
      .where(and(eq(deviceTokensTable.userId, userId), eq(deviceTokensTable.token, token)));
  },

  async deleteAllUserDeviceTokens(userId: number): Promise<void> {
    await db.delete(deviceTokensTable).where(eq(deviceTokensTable.userId, userId));
  },

  async getUserDeviceTokens(userId: number) {
    return db.select().from(deviceTokensTable).where(eq(deviceTokensTable.userId, userId)).limit(1);
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  async getAllDeviceTokens() {
    return db.select({ token: deviceTokensTable.token, userId: deviceTokensTable.userId }).from(deviceTokensTable);
  },

  async createNotification(data: {
    title: string;
    body: string;
    type: string;
    scheduledAt: Date;
    sent: boolean;
    requiredProgramCode: string;
    requiredProgramLevel: number;
  }) {
    const [notification] = await db.insert(notificationsTable).values(data).returning();
    return notification;
  },

  async insertNotificationLogs(records: { notificationId: number; userId: number; deviceToken: string; status: string }[]) {
    if (records.length === 0) return;
    await db.insert(notificationLogsTable).values(records);
  },

  // ─── Delivery / Cron ──────────────────────────────────────────────────────

  async createNotifications(notifications: InsertNotification[]) {
    if (notifications.length === 0) return [];

    return db
      .insert(notificationsTable)
      .values(notifications)
      .returning();
  },

  async getPendingNotifications() {
    const now = new Date();

    return db
      .select()
      .from(notificationsTable)
      .where(
        and(
          sql`${notificationsTable.scheduledAt} <= ${now}`,
          eq(notificationsTable.sent, false)
        )
      )
      .orderBy(asc(notificationsTable.scheduledAt));
  },

  async markNotificationSent(id: number): Promise<void> {
    await db
      .update(notificationsTable)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(notificationsTable.id, id));
  },

  async createNotificationLogs(logs: InsertNotificationLog[]) {
    if (logs.length === 0) return [];

    return db
      .insert(notificationLogsTable)
      .values(logs)
      .returning();
  },

  async getEligibleUserIdsForNotification(programCode: string, programLevel: number): Promise<number[]> {
    const result = await db
      .select({ userId: userProgramsTable.userId })
      .from(userProgramsTable)
      .innerJoin(programsTable, eq(userProgramsTable.programId, programsTable.id))
      .where(
        and(
          eq(programsTable.code, programCode),
          sql`${programsTable.level} >= ${programLevel}`,
          eq(programsTable.isActive, true)
        )
      );

    return result.map((row) => row.userId);
  },
};
