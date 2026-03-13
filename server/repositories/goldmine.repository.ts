import { db } from "../db";
import { goldmineVideos as goldmineVideosTable } from "@shared/schema";
import { eq, and, desc, or, ilike, sql, count } from "drizzle-orm";
import type { GoldmineVideo, InsertGoldmineVideo } from "@shared/schema";

export const goldmineRepository = {
  // ─── Shared ─────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<GoldmineVideo | undefined> {
    const [video] = await db.select().from(goldmineVideosTable).where(eq(goldmineVideosTable.id, id));
    return video;
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async create(data: InsertGoldmineVideo & { id: string }): Promise<GoldmineVideo> {
    const [video] = await db.insert(goldmineVideosTable).values(data).returning();
    return video;
  },

  async update(id: string, data: Partial<GoldmineVideo>): Promise<GoldmineVideo | undefined> {
    const [updated] = await db
      .update(goldmineVideosTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(goldmineVideosTable.id, id))
      .returning();
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(goldmineVideosTable).where(eq(goldmineVideosTable.id, id)).returning();
    return result.length > 0;
  },

  async listAll(params: { page: number; limit: number; search?: string }): Promise<{ data: GoldmineVideo[]; total: number }> {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;

    let whereClause = undefined;
    if (search?.trim()) {
      const s = search.trim();
      whereClause = or(
        ilike(goldmineVideosTable.title, `%${s}%`),
        sql`EXISTS (SELECT 1 FROM unnest(${goldmineVideosTable.tags}) tag WHERE tag ILIKE ${`%${s}%`})`
      );
    }

    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(goldmineVideosTable).where(whereClause),
      db.select().from(goldmineVideosTable).where(whereClause).orderBy(desc(goldmineVideosTable.createdAt)).limit(limit).offset(offset),
    ]);

    return { data: rows, total: Number(countResult[0]?.count ?? 0) };
  },

  // ─── User ─────────────────────────────────────────────────────────────────

  async listPublished(params: { page: number; limit: number; search?: string }): Promise<{ data: GoldmineVideo[]; total: number }> {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;
    const s = search?.trim().toLowerCase();

    const whereClause = and(
      eq(goldmineVideosTable.isPublished, true),
      s ? or(
        ilike(goldmineVideosTable.title, `%${s}%`),
        sql`EXISTS (SELECT 1 FROM unnest(${goldmineVideosTable.tags}) tag WHERE tag ILIKE ${`%${s}%`})`
      ) : undefined
    );

    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(goldmineVideosTable).where(whereClause),
      db.select().from(goldmineVideosTable).where(whereClause).orderBy(desc(goldmineVideosTable.createdAt)).limit(limit).offset(offset),
    ]);

    return { data: rows, total: Number(countResult[0]?.count ?? 0) };
  },
};
