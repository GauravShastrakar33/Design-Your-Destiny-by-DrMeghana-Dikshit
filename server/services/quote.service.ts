import { quoteRepository } from "../repositories/quote.repository";
import { insertDailyQuoteSchema } from "@shared/schema";

export const quoteService = {
  // ─── Public ────────────────────────────────────────────────────────────────

  async getTodayQuote() {
    const today = new Date().toISOString().split("T")[0];

    // Step 1: already shown today?
    const existing = await quoteRepository.findTodayQuote(today);
    if (existing) {
      return { quote: existing.quoteText, author: existing.author || null };
    }

    // Step 2: round-robin — pick next unshown (or oldest shown)
    const active = await quoteRepository.findNextRoundRobin();
    if (active.length === 0) return { quote: null, author: null };

    const selected = active[0];
    await quoteRepository.markShownDate(selected.id, today);
    return { quote: selected.quoteText, author: selected.author || null };
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAll() {
    return quoteRepository.findAll();
  },

  async create(body: Record<string, any>) {
    const { displayOrder, ...bodyWithoutOrder } = body;
    const parsed = insertDailyQuoteSchema.safeParse(bodyWithoutOrder);
    if (!parsed.success) throw Object.assign(new Error("VALIDATION_FAILED"), { details: parsed.error.errors });

    const nextOrder = await quoteRepository.getNextDisplayOrder();
    return quoteRepository.create({ ...parsed.data, displayOrder: nextOrder } as typeof import("@shared/schema").dailyQuotes.$inferInsert);
  },

  async update(id: number, body: { quoteText?: string; author?: string; isActive?: boolean }) {
    const updated = await quoteRepository.update(id, body);
    if (!updated) throw new Error("NOT_FOUND");
    return updated;
  },

  async delete(id: number) {
    const deleted = await quoteRepository.delete(id);
    if (!deleted) throw new Error("NOT_FOUND");
    return deleted;
  },
};
