import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { userController } from "../controllers/user.controller";

const router = Router();

// ===== USER TIMEZONE ======
// Update user's timezone
router.put("/api/v1/user/timezone", authenticateJWT, userController.updateTimezone);

// ===== USER PROFILE (NAME & PASSWORD) =====
// Update user name endpoint
router.put("/api/v1/me/name", authenticateJWT, userController.updateUserName);

// User API: Change password
router.post("/api/v1/me/change-password", authenticateJWT, userController.changePassword);

// ===== USER WELLNESS PROFILE APIs =====

// Admin API: Get wellness profile for a user
router.get("/admin/v1/users/:userId/wellness-profile", requireAdmin, userController.getWellnessProfileAdmin);

// Admin API: Create or update wellness profile for a user
router.post("/admin/v1/users/:userId/wellness-profile", requireAdmin, userController.updateWellnessProfileAdmin);

// User API: Get own wellness profile (read-only)
router.get("/api/v1/me/wellness-profile", authenticateJWT, userController.getOwnWellnessProfile);

export default router;
