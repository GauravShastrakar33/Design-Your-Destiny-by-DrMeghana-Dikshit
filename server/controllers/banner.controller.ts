import { Request, Response } from "express";
import { bannerService } from "../services/banner.service";
import { logAudit } from "../utils/audit";

export const bannerController = {
  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAll(_req: Request, res: Response) {
    try {
      res.json(await bannerService.getAll());
    } catch (error) {
      console.error("Error fetching session banners:", error);
      res.status(500).json({ error: "Failed to fetch session banners" });
    }
  },

  async getUploadUrl(req: Request, res: Response) {
    try {
      const { filename, contentType } = req.query as { filename: string; contentType: string };
      const result = await bannerService.getUploadUrl(filename, contentType);
      res.json(result);
    } catch (error: any) {
      if (error.message === "MISSING_PARAMS") {
        return res.status(400).json({ error: "filename and contentType are required" });
      }
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: error.message || "Failed to generate upload URL" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const banner = await bannerService.getById(parseInt(req.params.id));
      res.json(banner);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Banner not found" });
      console.error("Error fetching session banner:", error);
      res.status(500).json({ error: "Failed to fetch session banner" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const banner = await bannerService.create(req.body);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "BANNER", entityId: banner.id, newValues: banner });
      }
      res.status(201).json(banner);
    } catch (error: any) {
      if (error.message === "MISSING_FIELDS") {
        return res.status(400).json({ error: "type, startAt, and endAt are required" });
      }
      console.error("Error creating session banner:", error);
      res.status(500).json({ error: "Failed to create session banner" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { banner, existing } = await bannerService.update(id, req.body);
      if (req.user && existing) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "UPDATE", entityType: "BANNER", entityId: id, oldValues: existing, newValues: banner });
      }
      res.json(banner);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Banner not found" });
      console.error("Error updating session banner:", error);
      res.status(500).json({ error: "Failed to update session banner" });
    }
  },

  async deleteBanner(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const existing = await bannerService.deleteBanner(id);
      if (req.user && existing) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "DELETE", entityType: "BANNER", entityId: id, oldValues: existing });
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Banner not found" });
      console.error("Error deleting session banner:", error);
      res.status(500).json({ error: "Failed to delete session banner" });
    }
  },

  async duplicate(req: Request, res: Response) {
    try {
      const duplicate = await bannerService.duplicate(parseInt(req.params.id));
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "BANNER", entityId: duplicate.id, newValues: duplicate });
      }
      res.status(201).json(duplicate);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Banner not found" });
      console.error("Error duplicating session banner:", error);
      res.status(500).json({ error: "Failed to duplicate session banner" });
    }
  },

  async setDefault(req: Request, res: Response) {
    try {
      const banner = await bannerService.setDefault(parseInt(req.params.id));
      res.json(banner);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Banner not found" });
      console.error("Error setting default banner:", error);
      res.status(500).json({ error: "Failed to set default banner" });
    }
  },

  // ─── Public ────────────────────────────────────────────────────────────────

  async getPublicBanner(_req: Request, res: Response) {
    try {
      res.json(await bannerService.getPublicBanner());
    } catch (error) {
      console.error("Error fetching public session banner:", error);
      res.status(500).json({ error: "Failed to fetch session banner" });
    }
  },
};
