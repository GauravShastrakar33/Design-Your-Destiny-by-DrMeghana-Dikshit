import { db } from "../db";
import { sessionBanners as sessionBannersTable } from "@shared/schema";
import type { SessionBanner, InsertSessionBanner } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const bannerRepository = {
  async findAll(): Promise<SessionBanner[]> {
    return db.select().from(sessionBannersTable).orderBy(desc(sessionBannersTable.startAt));
  },

  async findById(id: number): Promise<SessionBanner | undefined> {
    const [banner] = await db
      .select()
      .from(sessionBannersTable)
      .where(eq(sessionBannersTable.id, id));
    return banner;
  },

  async create(data: InsertSessionBanner): Promise<SessionBanner> {
    const [banner] = await db.insert(sessionBannersTable).values(data).returning();
    return banner;
  },

  async update(id: number, data: Partial<InsertSessionBanner>): Promise<SessionBanner | undefined> {
    const [updated] = await db
      .update(sessionBannersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sessionBannersTable.id, id))
      .returning();
    return updated;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(sessionBannersTable)
      .where(eq(sessionBannersTable.id, id))
      .returning();
    return result.length > 0;
  },

  async findActive(): Promise<SessionBanner | undefined> {
    const now = new Date();
    const [active] = await db
      .select()
      .from(sessionBannersTable)
      .where(
        and(
          sql`${sessionBannersTable.startAt} <= ${now}`,
          sql`${sessionBannersTable.endAt} > ${now}`
        )
      )
      .orderBy(desc(sessionBannersTable.updatedAt))
      .limit(1);
    return active;
  },

  async findDefault(): Promise<SessionBanner | undefined> {
    const [banner] = await db
      .select()
      .from(sessionBannersTable)
      .where(eq(sessionBannersTable.isDefault, true))
      .limit(1);
    return banner;
  },

  async setDefault(id: number): Promise<SessionBanner | undefined> {
    // Unset any existing default
    await db
      .update(sessionBannersTable)
      .set({ isDefault: false })
      .where(eq(sessionBannersTable.isDefault, true));

    // Set new default
    const [updated] = await db
      .update(sessionBannersTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(sessionBannersTable.id, id))
      .returning();
    return updated;
  },
};
