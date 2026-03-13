import { notificationRepository } from "../repositories/notification.repository";
import { sendPushNotification } from "../lib/firebaseAdmin";

export const notificationService = {
  // ─── User ─────────────────────────────────────────────────────────────────

  async getUserNotifications(userId: number) {
    return notificationRepository.getUserNotifications(userId);
  },

  async getUnreadCount(userId: number) {
    const count = await notificationRepository.getUnreadCount(userId);
    return { count };
  },

  async markAllAsRead(userId: number) {
    await notificationRepository.markAllAsRead(userId);
  },

  async markAsRead(userId: number, notificationId: number) {
    if (isNaN(notificationId)) throw new Error("INVALID_ID");
    await notificationRepository.markAsRead(userId, notificationId);
  },

  async registerDevice(userId: number, token: string, platform?: string) {
    if (!token || typeof token !== "string") throw new Error("TOKEN_REQUIRED");
    const platformValue = platform && typeof platform === "string" ? platform : "web";
    if (platformValue.length > 10) throw new Error("PLATFORM_TOO_LONG");
    await notificationRepository.upsertDeviceToken(userId, token, platformValue);
  },

  async unregisterDevice(userId: number, token?: string) {
    if (token) {
      await notificationRepository.deleteDeviceToken(userId, token);
    } else {
      await notificationRepository.deleteAllUserDeviceTokens(userId);
    }
  },

  async getStatus(userId: number) {
    const tokens = await notificationRepository.getUserDeviceTokens(userId);
    return { enabled: tokens.length > 0 };
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getStats() {
    const allTokens = await notificationRepository.getAllDeviceTokens();
    const uniqueUserIds = new Set(allTokens.map((t) => t.userId));
    return { totalDevices: allTokens.length, uniqueUsers: uniqueUserIds.size };
  },

  async sendTestNotification(title: string, body: string) {
    if (!title || !body) throw new Error("MISSING_FIELDS");

    const allTokens = await notificationRepository.getAllDeviceTokens();
    if (allTokens.length === 0) {
      return { success: true, message: "No devices registered", successCount: 0, failureCount: 0, tokensCleanedUp: 0 };
    }

    const notification = await notificationRepository.createNotification({
      title,
      body,
      type: "admin_test",
      scheduledAt: new Date(),
      sent: true,
      requiredProgramCode: "",
      requiredProgramLevel: 0,
    });

    const tokens = allTokens.map((t) => t.token);
    const result = await sendPushNotification(tokens, title, body, {
      notificationId: notification.id.toString(),
      url: "/notifications",
      type: "admin_test",
    });

    await notificationRepository.insertNotificationLogs(
      allTokens.map((t) => ({ notificationId: notification.id, userId: t.userId, deviceToken: t.token, status: "sent" }))
    );

    return {
      success: true,
      message: "Notification sent",
      successCount: result.successCount,
      failureCount: result.failureCount,
      tokensCleanedUp: result.failedTokens.length,
      notification,
    };
  },
};
