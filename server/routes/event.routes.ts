import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { eventController } from "../controllers/event.controller";

const router = Router();

// ===== ADMIN APIs =====

router.get("/api/admin/v1/events", authenticateJWT, requireAdmin, eventController.getAllAdminEvents);
router.get("/api/admin/v1/events/upcoming", authenticateJWT, requireAdmin, eventController.getAdminUpcomingEvents);
router.get("/api/admin/v1/events/latest", authenticateJWT, requireAdmin, eventController.getAdminLatestEvents);

// Must be BEFORE the /:id route to prevent "upload-url" from being parsed as an ID
router.get("/api/admin/v1/events/upload-url", authenticateJWT, requireAdmin, eventController.getUploadUrl);
router.get("/api/admin/v1/events/:id", authenticateJWT, requireAdmin, eventController.getAdminEventById);

router.post("/api/admin/v1/events", authenticateJWT, requireAdmin, eventController.createEvent);
router.put("/api/admin/v1/events/:id", authenticateJWT, requireAdmin, eventController.updateEvent);

// Admin API: Regenerate reminders for all UPCOMING events
router.post("/api/admin/v1/events/regenerate-reminders", authenticateJWT, requireAdmin, eventController.regenerateReminders);

router.delete("/api/admin/v1/events/:id", authenticateJWT, requireAdmin, eventController.cancelEvent);

router.post("/api/admin/v1/events/:id/skip-recording", authenticateJWT, requireAdmin, eventController.skipRecording);
router.post("/api/admin/v1/events/:id/add-recording", authenticateJWT, requireAdmin, eventController.addRecording);
router.post("/api/admin/v1/events/:id/remove-recording", authenticateJWT, requireAdmin, eventController.removeRecording);

// ===== PUBLIC EVENT APIs (User App) =====

router.get("/api/events/upcoming", eventController.getPublicUpcomingEvents);
router.get("/api/events/latest", eventController.getPublicLatestEvents);
router.get("/api/events/:id", eventController.getPublicEventById);

export default router;
