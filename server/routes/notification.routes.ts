import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

// ─── User Routes ──────────────────────────────────────────────────────────────
router.get("/api/v1/notifications/unread-count", authenticateJWT, notificationController.getUnreadCount);
router.get("/api/v1/notifications/status", authenticateJWT, notificationController.getStatus);
router.get("/api/v1/notifications", authenticateJWT, notificationController.getNotifications);
router.post("/api/v1/notifications/read-all", authenticateJWT, notificationController.markAllAsRead);
router.patch("/api/v1/notifications/:id/read", authenticateJWT, notificationController.markAsRead);
router.post("/api/v1/notifications/register-device", authenticateJWT, notificationController.registerDevice);
router.delete("/api/v1/notifications/unregister-device", authenticateJWT, notificationController.unregisterDevice);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/admin/api/notifications/stats", authenticateJWT, requireAdmin, notificationController.getStats);
router.post("/admin/api/notifications/test", authenticateJWT, requireAdmin, notificationController.sendTest);

export default router;
