import { Request, Response } from "express";
import { trackingService, TrackingServiceError } from "../services/tracking.service";

// Helper function to handle service errors
const handleServiceError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof TrackingServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

export const trackingController = {
  // ===== USER STREAK =====
  markStreakToday: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const result = await trackingService.markStreakToday(req.user.sub);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to mark activity");
    }
  },

  getLast7DaysStreak: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const baseDate = req.query.date as string | undefined;
      const result = await trackingService.getLast7DaysStreak(req.user.sub, baseDate);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch streak data");
    }
  },

  // ===== CONSISTENCY CALENDAR =====
  getConsistencyMonth: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const year = req.query.year as string | undefined;
      const month = req.query.month as string | undefined;
      const result = await trackingService.getConsistencyMonth(req.user.sub, year, month);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch consistency data");
    }
  },

  getConsistencyRange: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const todayDate = req.query.today as string | undefined;
      const result = await trackingService.getConsistencyRange(req.user.sub, todayDate);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch consistency range");
    }
  },

  // ===== ACTIVITY LOGGING (AI INSIGHTS) =====
  logActivity: async (req: Request, res: Response) => {
    try {
      console.log("🔥 LOCAL BACKEND HIT - Activity Log", new Date().toISOString());
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { lessonId, lessonName, featureType } = req.body;
      const result = await trackingService.logActivity(req.user.sub, lessonId, lessonName, featureType);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to log activity");
    }
  },

  getMonthlyActivityStats: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const month = req.query.month as string | undefined;
      const stats = await trackingService.getMonthlyActivityStats(req.user.sub, month);
      
      res.set("Cache-Control", "no-store");
      res.json(stats);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch monthly stats");
    }
  }
};
