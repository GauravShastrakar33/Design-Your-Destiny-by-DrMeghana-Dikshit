import { sessionRepository } from "../repositories/session.repository";
import type { InsertCommunitySession } from "@shared/schema";

export const sessionService = {
  async getAllSessions() {
    return await sessionRepository.findAll();
  },

  async getActiveSessions() {
    const sessions = await sessionRepository.findAll();
    return sessions.filter((s) => s.isActive);
  },

  async createSession(data: InsertCommunitySession) {
    return await sessionRepository.create(data);
  },

  async updateSession(id: number, data: Partial<InsertCommunitySession>) {
    return await sessionRepository.update(id, data);
  },

  async deleteSession(id: number): Promise<boolean> {
    return await sessionRepository.delete(id);
  },
};
