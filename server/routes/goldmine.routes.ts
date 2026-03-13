import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { goldmineController } from "../controllers/goldmine.controller";
import multer from "multer";

const router = Router();

// Configure multer for memory storage (for direct uploads)
const uploadGoldmineFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/api/admin/goldmine/videos", authenticateJWT, requireAdmin, goldmineController.listAdmin);
router.get("/api/admin/goldmine/get-upload-urls", authenticateJWT, requireAdmin, goldmineController.getUploadUrls);
router.post("/api/admin/goldmine/videos/confirm", authenticateJWT, requireAdmin, goldmineController.confirmUpload);
router.post(
  "/api/admin/goldmine/videos",
  authenticateJWT,
  requireAdmin,
  uploadGoldmineFiles.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),
  goldmineController.uploadDirectly
);
router.patch("/api/admin/goldmine/videos/:id", authenticateJWT, requireAdmin, uploadGoldmineFiles.single("thumbnail"), goldmineController.update);
router.delete("/api/admin/goldmine/videos/:id", authenticateJWT, requireAdmin, goldmineController.deleteVideo);

// ─── User Routes ──────────────────────────────────────────────────────────────
router.get("/api/goldmine/videosList", authenticateJWT, goldmineController.listUser);
router.get("/api/goldmine/videos/:id/play", authenticateJWT, goldmineController.getPlaybackUrl);

export default router;
