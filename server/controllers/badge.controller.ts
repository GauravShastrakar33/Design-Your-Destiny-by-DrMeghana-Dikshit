import { Request, Response } from "express";
import { badgeService, BadgeServiceError } from "../services/badgeService";

// Helper function to handle service errors
const handleServiceError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof BadgeServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

export const badgeController = {
  getBadges: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const badges = await badgeService.getUserBadges(req.user.sub);
      res.json({ badges });
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch badges");
    }
  },

  getAdminStudentBadges: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }
      
      const badges = await badgeService.getUserBadges(id);
      res.json({ badges });
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch student badges");
    }
  },

  evaluateBadges: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const todayDate = new Date().toISOString().split("T")[0];
      const newlyAwardedBadges = await badgeService.evaluateBadges(req.user.sub, todayDate);

      res.json({
        newBadges: newlyAwardedBadges,
        hasNewBadges: newlyAwardedBadges.length > 0,
      });
    } catch (error) {
      handleServiceError(res, error, "Failed to evaluate badges");
    }
  },

  awardAdminBadge: async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID" });
      }

      const { badgeKey } = req.body;
      if (!["ambassador", "hall_of_fame"].includes(badgeKey)) {
        return res.status(400).json({ error: "Invalid badge key" });
      }

      const result = await badgeService.awardAdminBadge(studentId, badgeKey as "ambassador" | "hall_of_fame");
      
      if (result.alreadyEarned) {
        return res.status(400).json({ error: "User already has this badge" });
      }

      res.json({ success: true, message: "Badge awarded successfully" });
    } catch (error) {
      handleServiceError(res, error, "Failed to award badge");
    }
  }
};
