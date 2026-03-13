import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { pohController, uploadPOHVision } from "../controllers/poh.controller";

const router = Router();

// ─── User POH Routes ─────────────────────────────────────────────────────────
router.get("/api/poh/current", authenticateJWT, pohController.getCurrent);
router.post("/api/poh", authenticateJWT, pohController.create);
router.put("/api/poh/:id", authenticateJWT, pohController.update);
router.post("/api/poh/:id/milestones", authenticateJWT, pohController.addMilestone);
router.post("/api/poh/milestone/:id/achieve", authenticateJWT, pohController.achieveMilestone);
router.put("/api/poh/milestone/:id", authenticateJWT, pohController.updateMilestone);
router.put("/api/poh/:id/actions", authenticateJWT, pohController.updateActions);
router.post("/api/poh/rate", authenticateJWT, pohController.saveRating);
router.post("/api/poh/:id/complete", authenticateJWT, pohController.complete);
router.post("/api/poh/:id/close", authenticateJWT, pohController.close);
router.get("/api/poh/history", authenticateJWT, pohController.getHistory);
router.post(
  "/api/poh/:id/vision",
  authenticateJWT,
  uploadPOHVision.single("image"),
  pohController.uploadVisionImage
);

// ─── Admin Analytics Routes ───────────────────────────────────────────────────
router.get("/admin/api/poh/usage", authenticateJWT, requireAdmin, pohController.getUsageStats);
router.get("/admin/api/poh/daily-checkins", authenticateJWT, requireAdmin, pohController.getDailyCheckins);
router.get("/admin/api/poh/progress-signals", authenticateJWT, requireAdmin, pohController.getProgressSignals);
router.get("/admin/api/poh/drop-offs", authenticateJWT, requireAdmin, pohController.getDropOffs);
router.get("/admin/api/poh/life-areas", authenticateJWT, requireAdmin, pohController.getLifeAreas);

export default router;
