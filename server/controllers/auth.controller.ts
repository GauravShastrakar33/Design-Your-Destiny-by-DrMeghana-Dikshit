import { Request, Response } from "express";
import { authService, AuthServiceError } from "../services/auth.service";

// Helper function to handle service errors
const handleServiceError = (res: Response, error: unknown, fallbackMessage: string, useErrorKey: boolean = false) => {
  if (error instanceof AuthServiceError) {
    const payload = useErrorKey ? { error: error.message } : { message: error.message };
    return res.status(error.statusCode).json(payload);
  }
  console.error(fallbackMessage, error);
  const payload = useErrorKey ? { error: fallbackMessage } : { message: fallbackMessage };
  return res.status(500).json(payload);
};

export const authController = {
  // Legacy admin login (kept for backward compatibility)
  adminLegacyLogin: async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const result = await authService.adminLegacyLogin(password);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Login failed", true);
    }
  },

  // Admin JWT login (SUPER_ADMIN and COACH)
  adminJwtLogin: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await authService.adminJwtLogin(email, password);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Login failed", false);
    }
  },

  // User JWT login
  userJwtLogin: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await authService.userJwtLogin(email, password);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Login failed", false);
    }
  },

  // Get current authenticated user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await authService.getCurrentUser(req.user.sub);
      res.json(user);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch user", true);
    }
  },
};
