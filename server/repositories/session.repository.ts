import { db } from "../db";
import { communitySessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import type {
  CommunitySession,
  InsertCommunitySession,
} from "@shared/schema";

export const sessionRepository = {
  async findAll(): Promise<CommunitySession[]> {
    return await db.query.communitySessions.findMany({
      orderBy: (sessions, { asc }) => [asc(sessions.time)],
    });
  },

  async findById(id: number): Promise<CommunitySession | undefined> {
    return await db.query.communitySessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.id, id),
    });
  },

  async create(session: InsertCommunitySession): Promise<CommunitySession> {
    const [newSession] = await db
      .insert(communitySessions)
      .values(session)
      .returning();
    return newSession;
  },

  async update(
    id: number,
    session: Partial<InsertCommunitySession>
  ): Promise<CommunitySession | undefined> {
    const [updated] = await db
      .update(communitySessions)
      .set(session)
      .where(eq(communitySessions.id, id))
      .returning();
    return updated;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(communitySessions)
      .where(eq(communitySessions.id, id))
      .returning();
    return result.length > 0;
  },
};
