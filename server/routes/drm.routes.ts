import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { drmController } from "../controllers/drm.controller";

const router = Router();

// ─── User Routes ──────────────────────────────────────────────────────────────
router.get("/api/v1/drm/questions", authenticateJWT, drmController.getUserQuestions);
router.get("/api/v1/drm/questions/:id", authenticateJWT, drmController.getQuestionById);
router.post("/api/v1/drm/questions", authenticateJWT, drmController.submitQuestion);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/admin/api/drm/questions", authenticateJWT, requireAdmin, drmController.getAllQuestions);
router.get("/admin/api/drm/questions/:id", authenticateJWT, requireAdmin, drmController.getAdminQuestionById);
router.post("/admin/api/drm/questions/:id/answer", authenticateJWT, requireAdmin, drmController.getAnswerUploadUrl);
router.post("/admin/api/drm/questions/:id/confirm-answer", authenticateJWT, requireAdmin, drmController.confirmAnswer);

export default router;
