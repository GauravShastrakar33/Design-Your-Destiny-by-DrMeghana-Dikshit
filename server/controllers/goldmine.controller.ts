import { Request, Response } from "express";
import { goldmineService } from "../services/goldmine.service";
import { logAudit } from "../utils/audit";

export const goldmineController = {
  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getUploadUrls(req: Request, res: Response) {
    try {
      res.json(await goldmineService.getUploadUrls(req.query.videoContentType as string, req.query.thumbnailContentType as string));
    } catch (error: any) {
      console.error("Error generating goldmine upload URLs:", error);
      res.status(500).json({ error: "Failed to generate upload URLs" });
    }
  },

  async confirmUpload(req: Request, res: Response) {
    try {
      const video = await goldmineService.confirmUpload(req.body);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "GOLDMINE_VIDEO", entityId: video.id, newValues: video });
      }
      res.status(201).json(video);
    } catch (error: any) {
      if (error.message === "MISSING_FIELDS") return res.status(400).json({ error: "Missing required fields" });
      console.error("Error confirming goldmine video:", error);
      res.status(500).json({ error: "Failed to confirm goldmine video" });
    }
  },

  async uploadDirectly(req: Request, res: Response) {
    try {
      const { title, tags } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const video = await goldmineService.uploadDirectly(files || {}, req.body);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "GOLDMINE_VIDEO", entityId: video.id, newValues: video });
      }
      res.status(201).json(video);
    } catch (error: any) {
      if (error.message === "MISSING_TITLE") return res.status(400).json({ error: "title is required" });
      if (error.message === "MISSING_TAGS" || error.message === "INVALID_TAGS") return res.status(400).json({ error: "tags must be a comma-separated string or an array" });
      if (error.message === "MISSING_VIDEO") return res.status(400).json({ error: "video file is required" });
      if (error.message === "MISSING_THUMBNAIL") return res.status(400).json({ error: "thumbnail file is required" });
      if (error.message === "VIDEO_UPLOAD_FAILED") return res.status(500).json({ error: "Failed to upload video to R2" });
      if (error.message === "THUMBNAIL_UPLOAD_FAILED") return res.status(500).json({ error: "Failed to upload thumbnail to R2" });

      console.error("Error creating goldmine video:", error);
      res.status(500).json({ error: "Failed to create goldmine video" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { updated, existing } = await goldmineService.update(req.params.id, req.body, req.file);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "UPDATE", entityType: "GOLDMINE_VIDEO", entityId: req.params.id, oldValues: existing, newValues: updated });
      }
      res.json(updated);
    } catch (error: any) {
      if (error.message === "NOT_FOUND" || error.message === "UPDATE_FAILED") return res.status(404).json({ error: "Video not found" });
      if (error.message === "INVALID_TITLE") return res.status(400).json({ error: "title must not be empty" });
      if (error.message === "INVALID_TAGS") return res.status(400).json({ error: "tags must be a string or an array" });
      if (error.message === "THUMBNAIL_UPLOAD_FAILED") return res.status(500).json({ error: "Failed to upload new thumbnail" });

      console.error("Error updating goldmine video:", error);
      res.status(500).json({ error: "Failed to update goldmine video" });
    }
  },

  async deleteVideo(req: Request, res: Response) {
    try {
      const existing = await goldmineService.deleteVideo(req.params.id);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "DELETE", entityType: "GOLDMINE_VIDEO", entityId: req.params.id, oldValues: existing });
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Video not found" });
      if (error.message === "VIDEO_DELETE_FAILED") return res.status(500).json({ error: "Failed to delete video from storage" });
      if (error.message === "THUMBNAIL_DELETE_FAILED") return res.status(500).json({ error: "Failed to delete thumbnail from storage" });
      if (error.message === "DELETE_FAILED") return res.status(500).json({ error: "Failed to delete video record" });

      console.error("Error deleting goldmine video:", error);
      res.status(500).json({ error: "Failed to delete goldmine video" });
    }
  },

  async listAdmin(req: Request, res: Response) {
    try {
      let page = parseInt(req.query.page as string, 10);
      if (!Number.isFinite(page) || page < 1) page = 1;
      let limit = parseInt(req.query.limit as string, 10);
      if (!Number.isFinite(limit) || limit < 1 || limit > 100) limit = 20;

      res.json(await goldmineService.listAll(page, limit, req.query.search as string));
    } catch (error) {
      console.error("Error listing goldmine videos:", error);
      res.status(500).json({ error: "Failed to fetch goldmine videos" });
    }
  },

  // ─── User ─────────────────────────────────────────────────────────────────

  async listUser(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 20);

      res.json(await goldmineService.listPublished(page, limit, req.query.search as string));
    } catch (error) {
      console.error("Error listing public goldmine videos:", error);
      res.status(500).json({ error: "Failed to list videos" });
    }
  },

  async getPlaybackUrl(req: Request, res: Response) {
    try {
      res.json(await goldmineService.getPlaybackUrl(req.params.id));
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Video not found" });
      if (error.message === "MISSING_FILE") return res.status(500).json({ error: "Video file key missing" });
      if (error.message === "URL_GENERATION_FAILED") return res.status(500).json({ error: "Failed to generate video playback URL" });

      console.error("Error getting goldmine video playback URL:", error);
      res.status(500).json({ error: "Failed to fetch playback URL" });
    }
  },
};
