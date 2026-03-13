import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { logAudit } from "../utils/audit";

export const notificationController = {
  // ─── User ─────────────────────────────────────────────────────────────────

  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      res.json(await notificationService.getUserNotifications(userId));
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      res.json(await notificationService.getUnreadCount(userId));
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  },

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  },

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      await notificationService.markAsRead(userId, Number(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "INVALID_ID") return res.status(400).json({ error: "Invalid notification ID" });
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },

  async registerDevice(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { token, platform } = req.body;
      await notificationService.registerDevice(userId, token, platform);
      res.json({ success: true, message: "Device registered successfully" });
    } catch (error: any) {
      if (error.message === "TOKEN_REQUIRED") return res.status(400).json({ error: "Token is required" });
      if (error.message === "PLATFORM_TOO_LONG") return res.status(400).json({ error: "Platform name too long" });
      console.error("Error registering device token:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  },

  async unregisterDevice(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      await notificationService.unregisterDevice(userId, req.body?.token);
      res.json({ success: true, message: "Device unregistered" });
    } catch (error) {
      console.error("Error unregistering device token:", error);
      res.status(500).json({ error: "Failed to unregister device" });
    }
  },

  async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      res.json(await notificationService.getStatus(userId));
    } catch (error) {
      console.error("Error getting notification status:", error);
      res.status(500).json({ error: "Failed to get notification status" });
    }
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getStats(_req: Request, res: Response) {
    try {
      res.json(await notificationService.getStats());
    } catch (error) {
      console.error("Error getting notification stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  },

  async sendTest(req: Request, res: Response) {
    try {
      const { title, body } = req.body;
      const result = await notificationService.sendTestNotification(title, body);
      if (req.user && result.notification) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "NOTIFICATION", entityId: result.notification.id, newValues: result.notification });
      }
      const { notification: _, ...response } = result;
      res.json(response);
    } catch (error: any) {
      if (error.message === "MISSING_FIELDS") return res.status(400).json({ error: "Title and body are required" });
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  },
};
