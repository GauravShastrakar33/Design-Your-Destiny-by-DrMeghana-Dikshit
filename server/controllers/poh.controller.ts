import { Request, Response } from "express";
import multer from "multer";
import { pohService } from "../services/poh.service";
import { insertProjectOfHeartSchema } from "@shared/schema";

// ─── Multer: POH vision image upload (memory storage → R2) ───────────────────

export const uploadPOHVision = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_IMAGE"));
    }
  },
});

// ─── Controller ──────────────────────────────────────────────────────────────

export const pohController = {
  async getCurrent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const state = await pohService.getCurrentState(req.user.sub);
      res.json(state);
    } catch (error) {
      console.error("Error fetching current POH:", error);
      res.status(500).json({ error: "Failed to fetch POH state" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });

      const { title, why, category, customCategory } = req.body;
      const validation = insertProjectOfHeartSchema.safeParse({
        userId: req.user.sub,
        title,
        why,
        category,
        customCategory,
        status: "active",
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.format() });
      }

      const poh = await pohService.createPOH({ userId: req.user.sub, title, why, category, customCategory });
      res.status(201).json(poh);
    } catch (error: any) {
      if (error.message === "SLOTS_FULL") {
        return res.status(400).json({ error: "Cannot create more POHs. You already have active and next projects." });
      }
      console.error("Error creating POH:", error);
      res.status(500).json({ error: "Failed to create POH" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const poh = await pohService.updatePOH(req.params.id, req.user.sub, req.body);
      res.json(poh);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:               [404, "POH not found"],
        TITLE_TOO_LONG:          [400, "Title must be <= 120 characters"],
        WHY_NOT_ACTIVE:          [403, "Only active POH can update 'why' field"],
        WHY_TOO_LONG:            [400, "Why must be <= 500 characters"],
        INVALID_CATEGORY:        [400, "Invalid category"],
        CUSTOM_CATEGORY_REQUIRED:[400, "Custom category is required when 'other' is selected"],
        CUSTOM_CATEGORY_EMPTY:   [400, "Custom category cannot be empty"],
      };
      const [status, message] = map[error.message] || [500, "Failed to update POH"];
      res.status(status).json({ error: message });
    }
  },

  async addMilestone(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const milestone = await pohService.addMilestone(req.params.id, req.user.sub, req.body.text);
      res.status(201).json(milestone);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:            [404, "POH not found"],
        NOT_ACTIVE:           [403, "Can only add milestones to active POH"],
        MILESTONE_TEXT_INVALID:[400, "Milestone text is required and must be <= 200 characters"],
        MAX_MILESTONES:       [400, "Maximum 5 milestones per POH"],
      };
      const [status, message] = map[error.message] || [500, "Failed to create milestone"];
      res.status(status).json({ error: message });
    }
  },

  async achieveMilestone(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const milestone = await pohService.achieveMilestone(req.params.id, req.user.sub);
      res.json(milestone);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:       [404, "Milestone not found"],
        NOT_ACTIVE:      [403, "Can only achieve milestones on active POH"],
        ALREADY_ACHIEVED:[400, "Milestone already achieved"],
      };
      const [status, message] = map[error.message] || [500, "Failed to achieve milestone"];
      res.status(status).json({ error: message });
    }
  },

  async updateMilestone(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const milestone = await pohService.updateMilestone(req.params.id, req.user.sub, req.body.text);
      res.json(milestone);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:            [404, "Milestone not found"],
        POH_NOT_ACTIVE:       [403, "POH_NOT_ACTIVE"],
        MILESTONE_LOCKED:     [403, "MILESTONE_LOCKED"],
        MILESTONE_TEXT_INVALID:[400, "Milestone text must be <= 200 characters"],
      };
      if (error.message === "POH_NOT_ACTIVE") {
        return res.status(403).json({ error: "POH_NOT_ACTIVE", message: "Can only edit milestones on active POH" });
      }
      if (error.message === "MILESTONE_LOCKED") {
        return res.status(403).json({ error: "MILESTONE_LOCKED", message: "Achieved milestones cannot be edited." });
      }
      const [status, message] = map[error.message] || [500, "Failed to update milestone"];
      res.status(status).json({ error: message });
    }
  },

  async updateActions(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const actions = await pohService.updateActions(req.params.id, req.user.sub, req.body.actions);
      res.json(actions);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:      [404, "POH not found"],
        NOT_ACTIVE:     [403, "Can only update actions on active POH"],
        ACTIONS_INVALID:[400, "Actions must be an array with max 3 items"],
        ACTION_EMPTY:   [400, "Each action must be a non-empty string"],
      };
      const [status, message] = map[error.message] || [500, "Failed to update actions"];
      res.status(status).json({ error: message });
    }
  },

  async saveRating(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const { poh_id, rating, local_date } = req.body;
      const result = await pohService.saveRating(req.user.sub, poh_id, rating, local_date);
      res.json(result);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:        [404, "POH not found"],
        NOT_ACTIVE:       [403, "Can only rate active POH"],
        RATING_INVALID:   [400, "Rating must be between 0 and 10"],
        DATE_INVALID:     [400, "Invalid date format. Use YYYY-MM-DD"],
        RATING_DATE_LOCKED:[403, "Can only submit or update rating for today"],
      };
      if (error.message === "RATING_DATE_LOCKED") {
        return res.status(403).json({ error: "RATING_DATE_LOCKED", message: "Can only submit or update rating for today" });
      }
      const [status, message] = map[error.message] || [500, "Failed to save rating"];
      res.status(status).json({ error: message });
    }
  },

  async complete(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      await pohService.completePOH(req.params.id, req.user.sub, req.body.closing_reflection);
      res.json({ success: true, message: "POH completed successfully" });
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:           [404, "POH not found"],
        NOT_ACTIVE:          [403, "Can only complete active POH"],
        REFLECTION_TOO_SHORT:[400, "Closing reflection is required (minimum 20 characters)"],
      };
      const [status, message] = map[error.message] || [500, "Failed to complete POH"];
      res.status(status).json({ error: message });
    }
  },

  async close(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      await pohService.closePOH(req.params.id, req.user.sub, req.body.closing_reflection);
      res.json({ success: true, message: "POH closed early" });
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND:           [404, "POH not found"],
        NOT_ACTIVE:          [403, "Can only close active POH"],
        REFLECTION_TOO_SHORT:[400, "Closing reflection is required (minimum 20 characters)"],
      };
      const [status, message] = map[error.message] || [500, "Failed to close POH"];
      res.status(status).json({ error: message });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const history = await pohService.getHistory(req.user.sub);
      res.json(history);
    } catch (error) {
      console.error("Error fetching POH history:", error);
      res.status(500).json({ error: "Failed to fetch POH history" });
    }
  },

  async uploadVisionImage(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      if (!req.file) {
        return res.status(400).json({ error: "INVALID_IMAGE", message: "No image file provided" });
      }
      const index = parseInt(req.body.index, 10);
      const result = await pohService.uploadVisionImage(req.params.id, req.user.sub, index, req.file);
      res.json(result);
    } catch (error: any) {
      const map: Record<string, [number, string]> = {
        INVALID_INDEX:            [400, "Index must be 0, 1, or 2"],
        NOT_FOUND:                [404, "POH not found"],
        VISION_UPLOAD_NOT_ALLOWED:[403, "Can only upload vision images to active POH"],
        UPLOAD_FAILED:            [500, "Failed to upload image"],
      };
      if (error.message === "INVALID_IMAGE") {
        return res.status(400).json({ error: "INVALID_IMAGE", message: "Only JPEG, PNG, and WebP images are allowed" });
      }
      const [status, message] = map[error.message] || [500, "Failed to upload vision image"];
      res.status(status).json({ error: message });
    }
  },

  // ─── Admin Analytics ────────────────────────────────────────────────

  async getUsageStats(_req: Request, res: Response) {
    try {
      res.json(await pohService.getUsageStats());
    } catch (error) {
      console.error("Error fetching POH usage:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  },

  async getDailyCheckins(_req: Request, res: Response) {
    try {
      res.json(await pohService.getDailyCheckins());
    } catch (error) {
      console.error("Error fetching daily check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-in data" });
    }
  },

  async getProgressSignals(_req: Request, res: Response) {
    try {
      res.json(await pohService.getProgressSignals());
    } catch (error) {
      console.error("Error fetching progress signals:", error);
      res.status(500).json({ error: "Failed to fetch progress signals" });
    }
  },

  async getDropOffs(_req: Request, res: Response) {
    try {
      res.json(await pohService.getDropOffs());
    } catch (error) {
      console.error("Error fetching drop-offs:", error);
      res.status(500).json({ error: "Failed to fetch drop-off data" });
    }
  },

  async getLifeAreas(_req: Request, res: Response) {
    try {
      res.json(await pohService.getLifeAreas());
    } catch (error) {
      console.error("Error fetching life areas:", error);
      res.status(500).json({ error: "Failed to fetch life areas" });
    }
  },
};

