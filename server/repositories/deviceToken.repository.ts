import { db } from "../db";
import { deviceTokens as deviceTokensTable } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export const deviceTokenRepository = {
  async getDeviceTokensByUserIds(userIds: number[]): Promise<{ userId: number; token: string }[]> {
    if (userIds.length === 0) return [];

    return db
      .select({ userId: deviceTokensTable.userId, token: deviceTokensTable.token })
      .from(deviceTokensTable)
      .where(inArray(deviceTokensTable.userId, userIds));
  },

  async deleteDeviceToken(token: string): Promise<void> {
    await db
      .delete(deviceTokensTable)
      .where(eq(deviceTokensTable.token, token));
  },
};
