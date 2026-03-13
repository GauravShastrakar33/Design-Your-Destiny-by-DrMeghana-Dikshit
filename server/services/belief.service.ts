import { beliefRepository } from "../repositories/belief.repository";

export class BeliefServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "BeliefServiceError";
  }
}

export const beliefService = {
  async getRewiringBeliefs(userId: number) {
    return await beliefRepository.getRewiringBeliefsByUserId(userId);
  },

  async createRewiringBelief(userId: number, limitingBelief: string, upliftingBelief: string) {
    if (!limitingBelief || typeof limitingBelief !== "string" || !limitingBelief.trim()) {
      throw new BeliefServiceError("Limiting belief is required", 400);
    }
    if (!upliftingBelief || typeof upliftingBelief !== "string" || !upliftingBelief.trim()) {
      throw new BeliefServiceError("Uplifting belief is required", 400);
    }

    return await beliefRepository.createRewiringBelief({
      userId,
      limitingBelief: limitingBelief.trim(),
      upliftingBelief: upliftingBelief.trim(),
    });
  },

  async updateRewiringBelief(id: number, userId: number, updates: { limitingBelief?: string; upliftingBelief?: string }) {
    if (isNaN(id)) {
      throw new BeliefServiceError("Invalid belief ID", 400);
    }

    const cleanUpdates: { limitingBelief?: string; upliftingBelief?: string } = {};

    if (updates.limitingBelief !== undefined) {
      if (typeof updates.limitingBelief !== "string" || !updates.limitingBelief.trim()) {
        throw new BeliefServiceError("Limiting belief cannot be empty", 400);
      }
      cleanUpdates.limitingBelief = updates.limitingBelief.trim();
    }

    if (updates.upliftingBelief !== undefined) {
      if (typeof updates.upliftingBelief !== "string" || !updates.upliftingBelief.trim()) {
        throw new BeliefServiceError("Uplifting belief cannot be empty", 400);
      }
      cleanUpdates.upliftingBelief = updates.upliftingBelief.trim();
    }

    if (Object.keys(cleanUpdates).length === 0) {
      throw new BeliefServiceError("No updates provided", 400);
    }

    const updated = await beliefRepository.updateRewiringBelief(id, userId, cleanUpdates);

    if (!updated) {
      throw new BeliefServiceError("Belief not found or not authorized", 404);
    }

    return updated;
  },

  async deleteRewiringBelief(id: number, userId: number) {
    if (isNaN(id)) {
      throw new BeliefServiceError("Invalid belief ID", 400);
    }

    const success = await beliefRepository.deleteRewiringBelief(id, userId);

    if (!success) {
      throw new BeliefServiceError("Belief not found or not authorized", 404);
    }

    return { success: true };
  }
};
