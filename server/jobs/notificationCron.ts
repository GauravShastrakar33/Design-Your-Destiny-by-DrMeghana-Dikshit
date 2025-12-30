import { storage } from "../storage";
import { sendPushNotification } from "../lib/firebaseAdmin";

let cronInterval: ReturnType<typeof setInterval> | null = null;

async function processNotifications(): Promise<void> {
  try {
    const pendingNotifications = await storage.getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      const alreadySent = await storage.hasNotificationBeenSent(notification.id);
      if (alreadySent) {
        continue;
      }

      const eligibleUserIds = await storage.getEligibleUserIdsForNotification(
        notification.requiredProgramCode,
        notification.requiredProgramLevel
      );

      if (eligibleUserIds.length === 0) {
        console.log(`No eligible users for notification ${notification.id}`);
        continue;
      }

      const deviceTokens = await storage.getDeviceTokensByUserIds(eligibleUserIds);
      
      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for notification ${notification.id}`);
        continue;
      }

      const tokens = deviceTokens.map(dt => dt.token);
      const userIdByToken = new Map(deviceTokens.map(dt => [dt.token, dt.userId]));

      console.log(`Sending notification ${notification.id} to ${tokens.length} devices`);

      const result = await sendPushNotification(
        tokens,
        notification.title,
        notification.body,
        { type: notification.type, notificationId: String(notification.id) }
      );

      const logs: Array<{
        notificationId: number;
        userId: number;
        deviceToken: string;
        status: string;
        error: string | null;
      }> = [];

      for (const token of tokens) {
        const userId = userIdByToken.get(token) || 0;
        const failed = result.failedTokens.includes(token);
        
        logs.push({
          notificationId: notification.id,
          userId,
          deviceToken: token,
          status: failed ? "failed" : "sent",
          error: failed ? "FCM delivery failed" : null,
        });
      }

      await storage.createNotificationLogs(logs);

      for (const failedToken of result.failedTokens) {
        try {
          await storage.deleteDeviceToken(failedToken);
          console.log(`Removed invalid token: ${failedToken.substring(0, 20)}...`);
        } catch (err) {
          console.error("Error removing failed token:", err);
        }
      }

      console.log(
        `Notification ${notification.id}: ${result.successCount} sent, ${result.failureCount} failed`
      );
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
  }
}

export function startNotificationCron(): void {
  if (cronInterval) {
    console.log("Notification cron already running");
    return;
  }

  console.log("Starting notification cron job (runs every 60 seconds)");
  
  cronInterval = setInterval(processNotifications, 60 * 1000);
  
  processNotifications();
}

export function stopNotificationCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("Notification cron stopped");
  }
}
