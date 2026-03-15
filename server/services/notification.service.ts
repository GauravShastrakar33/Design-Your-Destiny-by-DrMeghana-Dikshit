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

    // 1. Create the notification record
    const notification = await notificationRepository.createNotification({
      title,
      body,
      type: "admin_test",
      scheduledAt: new Date(),
      sent: true,
      requiredProgramCode: "",
      requiredProgramLevel: 0,
    });

    // 2. Insert notification logs first (source of truth for unread count)
    await notificationRepository.insertNotificationLogs(
      allTokens.map((t) => ({ 
        notificationId: notification.id, 
        userId: t.userId, 
        deviceToken: t.token, 
        status: "sent" 
      }))
    );

    // 3. Group tokens by user and send personalized pushes with accurate badge counts
    const userTokenMap = new Map<number, string[]>();
    allTokens.forEach(t => {
      const tokens = userTokenMap.get(t.userId) || [];
      tokens.push(t.token);
      userTokenMap.set(t.userId, tokens);
    });

    let totalSuccess = 0;
    let totalFailure = 0;
    const allTokensToCleanup: string[] = [];

    for (const [userId, tokens] of Array.from(userTokenMap.entries())) {
      try {
        // Query current unread count (includes the one we just inserted)
        const { count } = await this.getUnreadCount(userId);
        
        const result = await sendPushNotification(tokens, title, body, {
          notificationId: notification.id.toString(),
          url: "/notifications",
          type: "admin_test",
        }, count);

        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
        allTokensToCleanup.push(...result.tokensToCleanup);
      } catch (err) {
        console.error(`❌ Failed to send personalized push to user ${userId}:`, err);
        totalFailure += tokens.length;
      }
    }

    return {
      success: true,
      message: "Notification sent",
      successCount: totalSuccess,
      failureCount: totalFailure,
      tokensCleanedUp: allTokensToCleanup.length,
      notification,
    };
  },
};
