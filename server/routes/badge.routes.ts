import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin as rbacAdmin } from "../middleware/rbac";
import { badgeController } from "../controllers/badge.controller";

const router = Router();

// ===== BADGE ROUTES =====

// GET /api/v1/badges - Get all earned badges for authenticated user
router.get("/api/v1/badges", authenticateJWT, badgeController.getBadges);

// POST /api/v1/badges/evaluate - Evaluate and award badges (called on app open)
router.post("/api/v1/badges/evaluate", authenticateJWT, badgeController.evaluateBadges);

// GET /admin/v1/students/:id/badges - Admin gets student badges
router.get("/admin/v1/students/:id/badges", rbacAdmin, badgeController.getAdminStudentBadges);

// POST /admin/v1/students/:id/badges - Admin granting badges
router.post("/admin/v1/students/:id/badges", rbacAdmin, badgeController.awardAdminBadge);

export default router;
