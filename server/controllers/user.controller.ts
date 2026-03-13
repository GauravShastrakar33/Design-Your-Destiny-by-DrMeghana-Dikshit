import { Request, Response } from "express";
import { userService, UserServiceError } from "../services/user.service";

// Helper function to handle service errors
const handleServiceError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof UserServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

export const userController = {
  // ===== USER TIMEZONE =====
  updateTimezone: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { timezone } = req.body;
      const result = await userService.updateUserTimezone(req.user.sub, timezone);
      
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to update timezone");
    }
  },

  // ===== USER PROFILE (NAME & PASSWORD) =====
  updateUserName: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { name } = req.body;
      const result = await userService.updateUserName(req.user.sub, name);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to update name");
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(
        req.user.sub,
        currentPassword,
        newPassword
      );

      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to change password");
    }
  },

  // ===== USER WELLNESS PROFILE =====
  getWellnessProfileAdmin: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const profile = await userService.getWellnessProfile(userId);
      res.json(profile);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch wellness profile");
    }
  },

  updateWellnessProfileAdmin: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const { karmicAffirmation, prescription } = req.body;
      const profile = await userService.updateWellnessProfile(userId, {
        karmicAffirmation,
        prescription,
      });

      res.json(profile);
    } catch (error) {
      handleServiceError(res, error, "Failed to save wellness profile");
    }
  },

  getOwnWellnessProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await userService.getWellnessProfile(req.user.sub);
      res.json(profile);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch wellness profile");
    }
  }
};
