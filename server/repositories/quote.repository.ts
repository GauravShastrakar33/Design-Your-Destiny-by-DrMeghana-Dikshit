import { db } from "../db";
import { dailyQuotes } from "@shared/schema";
import { eq, asc, sql } from "drizzle-orm";
import type { DailyQuote } from "@shared/schema";

export const quoteRepository = {
  // ─── Public ────────────────────────────────────────────────────────────────

  async findTodayQuote(today: string): Promise<DailyQuote | undefined> {
    const [quote] = await db
      .select()
      .from(dailyQuotes)
      .where(sql`${dailyQuotes.isActive} = true AND ${dailyQuotes.lastShownDate} = ${today}`);
    return quote;
  },

  async findNextRoundRobin(): Promise<DailyQuote[]> {
    return db
      .select()
      .from(dailyQuotes)
      .where(eq(dailyQuotes.isActive, true))
      .orderBy(
        sql`CASE WHEN ${dailyQuotes.lastShownDate} IS NULL THEN 0 ELSE 1 END`,
        sql`${dailyQuotes.lastShownDate} NULLS FIRST`,
        asc(dailyQuotes.displayOrder)
      );
  },

  async markShownDate(id: number, today: string): Promise<void> {
    await db
      .update(dailyQuotes)
      .set({ lastShownDate: today, updatedAt: new Date() })
      .where(eq(dailyQuotes.id, id));
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async findAll(): Promise<DailyQuote[]> {
    return db.select().from(dailyQuotes).orderBy(asc(dailyQuotes.displayOrder));
  },

  async getNextDisplayOrder(): Promise<number> {
    const [result] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${dailyQuotes.displayOrder}), 0)` })
      .from(dailyQuotes);
    return (result?.maxOrder || 0) + 1;
  },

  async create(data: typeof dailyQuotes.$inferInsert): Promise<DailyQuote> {
    const [quote] = await db.insert(dailyQuotes).values(data).returning();
    return quote;
  },

  async update(
    id: number,
    fields: { quoteText?: string; author?: string; isActive?: boolean }
  ): Promise<DailyQuote | undefined> {
    const set: Record<string, any> = { updatedAt: new Date() };
    if (fields.quoteText !== undefined) set.quoteText = fields.quoteText;
    if (fields.author    !== undefined) set.author    = fields.author;
    if (fields.isActive  !== undefined) set.isActive  = fields.isActive;

    const [updated] = await db
      .update(dailyQuotes)
      .set(set)
      .where(eq(dailyQuotes.id, id))
      .returning();
    return updated;
  },

  async delete(id: number): Promise<DailyQuote | undefined> {
    const [deleted] = await db
      .delete(dailyQuotes)
      .where(eq(dailyQuotes.id, id))
      .returning();
    return deleted;
  },
};
