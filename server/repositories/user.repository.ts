import { db } from "../db";
import { 
  users as usersTable, 
  userWellnessProfiles as userWellnessProfilesTable,
  type User,
  type UserWellnessProfile,
  type InsertUserWellnessProfile
} from "@shared/schema";
import { eq } from "drizzle-orm";

export class UserRepository {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(usersTable).set({ 
      lastLogin: new Date(),
      lastActivity: new Date() 
    }).where(eq(usersTable.id, id));
  }

  async updateUserTimezone(id: number, timezone: string): Promise<void> {
    await db.update(usersTable).set({ timezone }).where(eq(usersTable.id, id));
  }

  async updateUserName(id: number, name: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(usersTable)
      .set({ name })
      .where(eq(usersTable.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(usersTable)
      .set({ passwordHash: hashedPassword })
      .where(eq(usersTable.id, id));
  }

  async clearForcePasswordChange(id: number): Promise<void> {
    await db
      .update(usersTable)
      .set({ forcePasswordChange: false })
      .where(eq(usersTable.id, id));
  }

  // ===== USER WELLNESS PROFILES =====

  async getWellnessProfileByUserId(userId: number): Promise<UserWellnessProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userWellnessProfilesTable)
      .where(eq(userWellnessProfilesTable.userId, userId));
    return profile;
  }

  async upsertWellnessProfile(
    userId: number,
    data: Partial<InsertUserWellnessProfile>
  ): Promise<UserWellnessProfile> {
    const existing = await this.getWellnessProfileByUserId(userId);

    if (existing) {
      const [updated] = await db
        .update(userWellnessProfilesTable)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(userWellnessProfilesTable.userId, userId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(userWellnessProfilesTable)
        .values({
          userId,
          karmicAffirmation: data.karmicAffirmation ?? null,
          prescription: data.prescription ?? null,
        })
        .returning();
      return inserted;
    }
  }
}

export const userRepository = new UserRepository();
