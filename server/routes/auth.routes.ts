import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { authController } from "../controllers/auth.controller";

const router = Router();

// Legacy admin login (kept for backward compatibility)
router.post("/api/admin/login", authController.adminLegacyLogin);

// Admin JWT login (SUPER_ADMIN and COACH)
router.post("/admin/v1/auth/login", authController.adminJwtLogin);

// User JWT login
router.post("/api/v1/auth/login", authController.userJwtLogin);

// Get current authenticated user
router.get("/api/v1/me", authenticateJWT, authController.getCurrentUser);

export default router;
