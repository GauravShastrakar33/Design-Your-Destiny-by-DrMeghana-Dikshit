import { db } from "../db";
import {
  drmQuestions as drmQuestionsTable,
  users as usersTable,
  notifications as notificationsTable,
  notificationLogs as notificationLogsTable,
  deviceTokens as deviceTokensTable,
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { DrmQuestion } from "@shared/schema";

export const drmRepository = {
  // ─── User ─────────────────────────────────────────────────────────────────

  async findByUser(userId: number): Promise<DrmQuestion[]> {
    return db
      .select()
      .from(drmQuestionsTable)
      .where(eq(drmQuestionsTable.userId, userId))
      .orderBy(desc(drmQuestionsTable.askedAt));
  },

  async findById(id: number): Promise<DrmQuestion | undefined> {
    const [q] = await db.select().from(drmQuestionsTable).where(eq(drmQuestionsTable.id, id));
    return q;
  },

  async findByUserMonth(userId: number, monthYear: string): Promise<DrmQuestion | undefined> {
    const [q] = await db
      .select()
      .from(drmQuestionsTable)
      .where(and(eq(drmQuestionsTable.userId, userId), eq(drmQuestionsTable.monthYear, monthYear)));
    return q;
  },

  async create(data: { userId: number; questionText: string; monthYear: string }): Promise<DrmQuestion> {
    const [q] = await db.insert(drmQuestionsTable).values(data).returning();
    return q;
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async findAll(): Promise<(DrmQuestion & { userName: string })[]> {
    return db
      .select({
        id:           drmQuestionsTable.id,
        userId:       drmQuestionsTable.userId,
        questionText: drmQuestionsTable.questionText,
        askedAt:      drmQuestionsTable.askedAt,
        monthYear:    drmQuestionsTable.monthYear,
        status:       drmQuestionsTable.status,
        audioR2Key:   drmQuestionsTable.audioR2Key,
        answeredAt:   drmQuestionsTable.answeredAt,
        userName:     usersTable.name,
      })
      .from(drmQuestionsTable)
      .innerJoin(usersTable, eq(drmQuestionsTable.userId, usersTable.id))
      .orderBy(desc(drmQuestionsTable.askedAt));
  },

  async updateAnswer(id: number, audioR2Key: string): Promise<DrmQuestion | undefined> {
    const [updated] = await db
      .update(drmQuestionsTable)
      .set({ status: "ANSWERED", audioR2Key, answeredAt: new Date() })
      .where(eq(drmQuestionsTable.id, id))
      .returning();
    return updated;
  },

  async getUserById(userId: number) {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
    return user;
  },

  async getDeviceTokensByUserIds(userIds: number[]) {
    if (userIds.length === 0) return [];
    return db
      .select({ userId: deviceTokensTable.userId, token: deviceTokensTable.token })
      .from(deviceTokensTable)
      .where(inArray(deviceTokensTable.userId, userIds));
  },

  async createNotification(data: {
    title: string; body: string; type: string;
    scheduledAt: Date; sent: boolean;
    requiredProgramCode: string; requiredProgramLevel: number;
  }) {
    const [n] = await db.insert(notificationsTable).values(data).returning();
    return n;
  },

  async insertNotificationLogs(records: { notificationId: number; userId: number; deviceToken: string; status: string }[]) {
    if (records.length === 0) return;
    await db.insert(notificationLogsTable).values(records);
  },
};
