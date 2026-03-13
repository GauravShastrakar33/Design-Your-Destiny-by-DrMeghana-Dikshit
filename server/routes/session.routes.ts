import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { sessionController } from "../controllers/session.controller";

const router = Router();

// Public: Get all active community sessions
router.get("/api/sessions", sessionController.getActiveSessions);

// Admin: Get all sessions (including inactive)
router.get("/api/admin/sessions", authenticateJWT, requireAdmin, sessionController.getAllSessions);

// Admin: Create session
router.post("/api/admin/sessions", authenticateJWT, requireAdmin, sessionController.createSession);

// Admin: Update session
router.put("/api/admin/sessions/:id", authenticateJWT, requireAdmin, sessionController.updateSession);

// Admin: Delete session
router.delete("/api/admin/sessions/:id", authenticateJWT, requireAdmin, sessionController.deleteSession);

export default router;
