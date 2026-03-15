import { Request, Response } from "express";
import { quoteService } from "../services/quote.service";

// In-memory cache for today's quote
let cachedQuoteDate: string | null = null;
let cachedQuoteData: any | null = null;
let quoteFetchPromise: Promise<any> | null = null;

export const clearQuoteCache = () => {
  cachedQuoteDate = null;
  cachedQuoteData = null;
  quoteFetchPromise = null;
};

export const quoteController = {
  // ─── Public ────────────────────────────────────────────────────────────────

  async getToday(_req: Request, res: Response) {
    try {
      // Use UTC today or server today for the daily quote rotation
      const today = new Date().toISOString().split("T")[0];

      // 1. Level 1 Cache: Instant Memory Hit
      if (cachedQuoteDate === today && cachedQuoteData) {
        return res.json(cachedQuoteData);
      }

      // 2. Level 2 Cache: Prevent Cache Stampede
      // If multiple requests arrive while one is already fetching, they all await the same promise
      if (quoteFetchPromise) {
        const data = await quoteFetchPromise;
        return res.json(data);
      }

      // 3. Cache Miss: Fetch and Populate
      quoteFetchPromise = quoteService.getTodayQuote();
      const result = await quoteFetchPromise;
      
      cachedQuoteData = result;
      cachedQuoteDate = today;
      quoteFetchPromise = null;
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching today's quote:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAll(_req: Request, res: Response) {
    try {
      res.json(await quoteService.getAll());
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const quote = await quoteService.create(req.body);
      res.status(201).json(quote);
    } catch (error: any) {
      if (error.message === "VALIDATION_FAILED") {
        return res.status(400).json({ error: "Validation failed", details: error.details });
      }
      // PostgreSQL unique violation on display order
      if (error.code === "23505" && error.constraint === "unique_display_order") {
        return res.status(400).json({ error: "Display order conflict detected. Please try again." });
      }
      console.error("Error creating quote:", error);
      res.status(500).json({ error: "Failed to create quote" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { quoteText, author, isActive } = req.body;
      const updated = await quoteService.update(parseInt(req.params.id), { quoteText, author, isActive });
      res.json(updated);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Quote not found" });
      console.error("Error updating quote:", error);
      res.status(500).json({ error: "Failed to update quote" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await quoteService.delete(parseInt(req.params.id));
      res.json({ success: true, message: "Quote deleted" });
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Quote not found" });
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Failed to delete quote" });
    }
  },
};
