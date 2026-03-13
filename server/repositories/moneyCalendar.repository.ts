import { db } from "../db";
import { moneyEntries } from "@shared/schema";
import { eq, and, gte, lt, asc, sql } from "drizzle-orm";
import type { MoneyEntry } from "@shared/schema";

export const moneyCalendarRepository = {
  async upsert(userId: number, entryDate: string, amount: string): Promise<MoneyEntry> {
    const [entry] = await db
      .insert(moneyEntries)
      .values({ userId, entryDate, amount })
      .onConflictDoUpdate({
        target: [moneyEntries.userId, moneyEntries.entryDate],
        set: { amount, updatedAt: new Date() },
      })
      .returning();
    return entry;
  },

  async findForMonth(
    userId: number,
    year: number,
    month: number
  ): Promise<MoneyEntry[]> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return await db
      .select()
      .from(moneyEntries)
      .where(
        and(
          eq(moneyEntries.userId, userId),
          sql`${moneyEntries.entryDate} >= ${startDate}::date`,
          sql`${moneyEntries.entryDate} <= ${endDate}::date`
        )
      )
      .orderBy(asc(moneyEntries.entryDate));
  },
};
