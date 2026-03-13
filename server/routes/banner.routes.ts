import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { bannerController } from "../controllers/banner.controller";

const router = Router();

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// NOTE: upload-url MUST be before /:id to prevent "upload-url" parsed as an ID
router.get("/api/admin/v1/session-banners/upload-url", authenticateJWT, requireAdmin, bannerController.getUploadUrl);
router.get("/api/admin/v1/session-banners", authenticateJWT, requireAdmin, bannerController.getAll);
router.get("/api/admin/v1/session-banners/:id", authenticateJWT, requireAdmin, bannerController.getById);
router.post("/api/admin/v1/session-banners", authenticateJWT, requireAdmin, bannerController.create);
router.put("/api/admin/v1/session-banners/:id", authenticateJWT, requireAdmin, bannerController.update);
router.delete("/api/admin/v1/session-banners/:id", authenticateJWT, requireAdmin, bannerController.deleteBanner);
router.post("/api/admin/v1/session-banners/:id/duplicate", authenticateJWT, requireAdmin, bannerController.duplicate);
router.post("/api/admin/v1/session-banners/:id/set-default", authenticateJWT, requireAdmin, bannerController.setDefault);

// ─── Public Route ─────────────────────────────────────────────────────────────
router.get("/api/public/v1/session-banner", bannerController.getPublicBanner);

export default router;
