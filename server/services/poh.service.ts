import { pohRepository } from "../repositories/poh.repository";
import { pohCategoryEnum } from "@shared/schema";
import { getSignedGetUrl, uploadBufferToR2 } from "../r2Upload";

// Helper to generate signed URLs for vision images
async function signVisionImages(
  visionImages: (string | null)[]
): Promise<(string | null)[]> {
  const signed: (string | null)[] = [];
  for (const img of visionImages) {
    if (img && img !== "NULL") {
      try {
        let key: string;
        if (img.includes(".r2.cloudflarestorage.com/")) {
          key = img.split(".r2.cloudflarestorage.com/")[1];
        } else if (img.startsWith("http")) {
          const url = new URL(img);
          key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
        } else {
          key = img;
        }
        const result = await getSignedGetUrl(key, 3600);
        signed.push(result.success ? result.url! : null);
      } catch {
        signed.push(null);
      }
    } else {
      signed.push(null);
    }
  }
  return signed;
}

export const pohService = {
  // ─── Current POH State ─────────────────────────────────────────────────────

  async getCurrentState(userId: number) {
    const userPOHs = await pohRepository.findAllByUser(userId);
    const activePOH = userPOHs.find((p) => p.status === "active");
    const nextPOH = userPOHs.find((p) => p.status === "next");

    let activeResponse = null;
    if (activePOH) {
      const milestones = await pohRepository.findMilestones(activePOH.id);
      const actions = await pohRepository.findActions(activePOH.id);
      const today = new Date().toISOString().split("T")[0];
      const todayRating = await pohRepository.findRatingByDate(userId, today);
      const signedVisionImages = await signVisionImages(activePOH.visionImages || []);

      activeResponse = {
        id: activePOH.id,
        title: activePOH.title,
        why: activePOH.why,
        category: activePOH.category,
        customCategory: activePOH.customCategory,
        custom_category: activePOH.customCategory,
        started_at: activePOH.startedAt,
        vision_images: signedVisionImages,
        milestones: milestones.map((m) => ({
          id: m.id,
          text: m.text,
          achieved: m.achieved,
          achieved_at: m.achievedAt,
          order_index: m.orderIndex,
        })),
        actions: actions.map((a) => ({
          id: a.id,
          text: a.text,
          order: a.orderIndex,
        })),
        today_rating: todayRating ? todayRating.rating : null,
      };
    }

    let nextResponse = null;
    if (nextPOH) {
      nextResponse = {
        id: nextPOH.id,
        title: nextPOH.title,
        why: nextPOH.why,
        category: nextPOH.category,
        customCategory: nextPOH.customCategory,
        custom_category: nextPOH.customCategory,
        milestones: [],
        actions: [],
      };
    }

    return { active: activeResponse, next: nextResponse };
  },

  // ─── Create POH ────────────────────────────────────────────────────────────

  async createPOH(data: {
    userId: number;
    title: string;
    why: string;
    category: string;
    customCategory?: string | null;
  }) {
    const userPOHs = await pohRepository.findAllByUser(data.userId);
    const hasActive = userPOHs.some((p) => p.status === "active");
    const hasNext = userPOHs.some((p) => p.status === "next");

    if (hasActive && hasNext) {
      throw new Error("SLOTS_FULL");
    }

    const status: "active" | "next" = hasActive ? "next" : "active";
    const startedAt = status === "active" ? new Date().toISOString().split("T")[0] : null;

    return await pohRepository.create({ ...data, status, startedAt });
  },

  // ─── Update POH ────────────────────────────────────────────────────────────

  async updatePOH(
    pohId: string,
    userId: number,
    body: {
      title?: string;
      why?: string;
      category?: string;
      customCategory?: string | null;
    }
  ) {
    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");

    const updates: any = {};

    if (body.title !== undefined) {
      if (body.title.length > 120) throw new Error("TITLE_TOO_LONG");
      updates.title = body.title;
    }

    if (body.why !== undefined) {
      if (poh.status !== "active") throw new Error("WHY_NOT_ACTIVE");
      if (body.why.length > 500) throw new Error("WHY_TOO_LONG");
      updates.why = body.why;
    }

    if (body.category !== undefined) {
      if (!pohCategoryEnum.safeParse(body.category).success)
        throw new Error("INVALID_CATEGORY");
      updates.category = body.category;
      if (body.category === "other") {
        if (!body.customCategory?.trim()) throw new Error("CUSTOM_CATEGORY_REQUIRED");
        updates.customCategory = body.customCategory.trim();
      } else {
        updates.customCategory = null;
      }
    } else if (body.customCategory !== undefined && poh.category === "other") {
      if (!body.customCategory?.trim()) throw new Error("CUSTOM_CATEGORY_EMPTY");
      updates.customCategory = body.customCategory.trim();
    }

    return await pohRepository.update(pohId, updates);
  },

  // ─── Milestones ────────────────────────────────────────────────────────────

  async addMilestone(pohId: string, userId: number, text: string) {
    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("NOT_ACTIVE");
    if (!text || text.length > 200) throw new Error("MILESTONE_TEXT_INVALID");

    const existing = await pohRepository.findMilestones(pohId);
    if (existing.length >= 5) throw new Error("MAX_MILESTONES");

    return await pohRepository.createMilestone({ pohId, text, orderIndex: existing.length });
  },

  async achieveMilestone(milestoneId: string, userId: number) {
    const milestone = await pohRepository.findMilestoneById(milestoneId);
    if (!milestone) throw new Error("NOT_FOUND");

    const poh = await pohRepository.findById(milestone.pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("NOT_ACTIVE");
    if (milestone.achieved) throw new Error("ALREADY_ACHIEVED");

    const today = new Date().toISOString().split("T")[0];
    return await pohRepository.achieveMilestone(milestoneId, today);
  },

  async updateMilestone(milestoneId: string, userId: number, text: string) {
    const milestone = await pohRepository.findMilestoneById(milestoneId);
    if (!milestone) throw new Error("NOT_FOUND");

    const poh = await pohRepository.findById(milestone.pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("POH_NOT_ACTIVE");
    if (milestone.achieved) throw new Error("MILESTONE_LOCKED");
    if (!text || text.length > 200) throw new Error("MILESTONE_TEXT_INVALID");

    return await pohRepository.updateMilestone(milestoneId, { text });
  },

  // ─── Actions ───────────────────────────────────────────────────────────────

  async updateActions(pohId: string, userId: number, actions: string[]) {
    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("NOT_ACTIVE");
    if (!Array.isArray(actions) || actions.length > 3) throw new Error("ACTIONS_INVALID");
    for (const a of actions) {
      if (typeof a !== "string" || a.length === 0) throw new Error("ACTION_EMPTY");
    }
    await pohRepository.replaceActions(pohId, actions);
    return await pohRepository.findActions(pohId);
  },

  // ─── Daily Rating ──────────────────────────────────────────────────────────

  async saveRating(userId: number, pohId: string, rating: number, localDate: string) {
    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("NOT_ACTIVE");
    if (typeof rating !== "number" || rating < 0 || rating > 10)
      throw new Error("RATING_INVALID");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error("DATE_INVALID");

    const today = new Date().toISOString().split("T")[0];
    if (localDate !== today) throw new Error("RATING_DATE_LOCKED");

    const existing = await pohRepository.findRatingByDate(userId, localDate);
    if (existing) {
      return await pohRepository.updateRating(existing.id, rating);
    }
    return await pohRepository.createRating({ userId, pohId, localDate, rating });
  },

  // ─── Complete / Close ──────────────────────────────────────────────────────

  async completePOH(pohId: string, userId: number, closingReflection: string) {
    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("NOT_ACTIVE");
    if (!closingReflection || closingReflection.length < 20)
      throw new Error("REFLECTION_TOO_SHORT");

    const today = new Date().toISOString().split("T")[0];
    await pohRepository.complete(pohId, {
      status: "completed",
      endedAt: today,
      closingReflection,
    });
    await pohRepository.promoteNext(userId, today);
  },

  async closePOH(pohId: string, userId: number, closingReflection: string) {
    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("NOT_ACTIVE");
    if (!closingReflection || closingReflection.length < 20)
      throw new Error("REFLECTION_TOO_SHORT");

    const today = new Date().toISOString().split("T")[0];
    await pohRepository.complete(pohId, {
      status: "closed_early",
      endedAt: today,
      closingReflection,
    });
    await pohRepository.promoteNext(userId, today);
  },

  // ─── History ───────────────────────────────────────────────────────────────

  async getHistory(userId: number) {
    const historyPOHs = await pohRepository.findHistory(userId);
    return Promise.all(
      historyPOHs.map(async (poh) => {
        const milestones = await pohRepository.findMilestones(poh.id);
        return {
          id: poh.id,
          title: poh.title,
          category: poh.category,
          customCategory: poh.customCategory,
          custom_category: poh.customCategory,
          status: poh.status,
          started_at: poh.startedAt,
          ended_at: poh.endedAt,
          closing_reflection: poh.closingReflection,
          milestones: milestones.filter((m) => m.achieved).map((m) => m.text),
        };
      })
    );
  },

  // ─── Vision Image Upload ───────────────────────────────────────────────────

  async uploadVisionImage(
    pohId: string,
    userId: number,
    index: number,
    file: Express.Multer.File
  ) {
    if (isNaN(index) || index < 0 || index > 2) throw new Error("INVALID_INDEX");

    const poh = await pohRepository.findById(pohId);
    if (!poh || poh.userId !== userId) throw new Error("NOT_FOUND");
    if (poh.status !== "active") throw new Error("VISION_UPLOAD_NOT_ALLOWED");

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extMap[file.mimetype] || "jpg";
    const key = `poh-visions/${userId}/${pohId}/vision-${index}.${ext}`;

    const uploadResult = await uploadBufferToR2(file.buffer, key, file.mimetype);
    if (!uploadResult.success) throw new Error("UPLOAD_FAILED");

    const currentImages = poh.visionImages || [];
    const newImages = [...currentImages];
    while (newImages.length < 3) newImages.push(null as any);
    newImages[index] = uploadResult.url!;

    await pohRepository.update(pohId, { visionImages: newImages });
    return { success: true, vision_images: newImages, uploaded_index: index };
  },

  // ─── Admin Analytics ────────────────────────────────────────────────

  async getUsageStats() { return pohRepository.getUsageStats(); },
  async getDailyCheckins() { return pohRepository.getDailyCheckins(); },
  async getProgressSignals() { return pohRepository.getProgressSignals(); },
  async getDropOffs() { return pohRepository.getDropOffs(); },
  async getLifeAreas() { return pohRepository.getLifeAreas(); },
};
