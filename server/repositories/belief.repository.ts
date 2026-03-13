import { db } from "../db";
import { 
  rewiringBeliefs as rewiringBeliefsTable,
  type RewiringBelief,
  type InsertRewiringBelief
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class BeliefRepository {
  async getRewiringBeliefsByUserId(userId: number): Promise<RewiringBelief[]> {
    return await db.query.rewiringBeliefs.findMany({
      where: (beliefs, { eq }) => eq(beliefs.userId, userId),
      orderBy: [desc(rewiringBeliefsTable.createdAt)]
    });
  }

  async getRewiringBeliefById(id: number): Promise<RewiringBelief | undefined> {
    return await db.query.rewiringBeliefs.findFirst({
      where: (beliefs, { eq }) => eq(beliefs.id, id),
    });
  }

  async createRewiringBelief(belief: InsertRewiringBelief): Promise<RewiringBelief> {
    const [newBelief] = await db
      .insert(rewiringBeliefsTable)
      .values(belief)
      .returning();
    return newBelief;
  }

  async updateRewiringBelief(
    id: number, 
    userId: number, 
    updates: Partial<Pick<InsertRewiringBelief, 'limitingBelief' | 'upliftingBelief'>>
  ): Promise<RewiringBelief | undefined> {
    const [updated] = await db
      .update(rewiringBeliefsTable)
      .set(updates)
      .where(and(
        eq(rewiringBeliefsTable.id, id),
        eq(rewiringBeliefsTable.userId, userId)
      ))
      .returning();
    return updated;
  }

  async deleteRewiringBelief(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(rewiringBeliefsTable)
      .where(and(
        eq(rewiringBeliefsTable.id, id),
        eq(rewiringBeliefsTable.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }
}

export const beliefRepository = new BeliefRepository();
