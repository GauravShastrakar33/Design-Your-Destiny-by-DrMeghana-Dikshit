import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { trackingController } from "../controllers/tracking.controller";

const router = Router();

// ===== USER STREAK ROUTES =====

// Mark today as active for streak tracking
router.post("/api/v1/streak/mark-today", authenticateJWT, trackingController.markStreakToday);

// Get last 7 days of streak activity
router.get("/api/v1/streak/last-7-days", authenticateJWT, trackingController.getLast7DaysStreak);


// ===== CONSISTENCY CALENDAR ROUTES =====

// Get monthly consistency data (read-only)
router.get("/api/v1/consistency/month", authenticateJWT, trackingController.getConsistencyMonth);

// Get consistency range (earliest activity to current month)
router.get("/api/v1/consistency/range", authenticateJWT, trackingController.getConsistencyRange);


// ===== ACTIVITY LOGGING ROUTES (AI INSIGHTS) =====

// Log user activity (practice/breath/checklist)
router.post("/api/v1/activity/log", authenticateJWT, trackingController.logActivity);

// Get monthly activity stats for AI Insights
router.get("/api/v1/activity/monthly-stats", authenticateJWT, trackingController.getMonthlyActivityStats);

export default router;
