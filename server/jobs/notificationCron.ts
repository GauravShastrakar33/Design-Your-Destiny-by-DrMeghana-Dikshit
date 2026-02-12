import { storage } from "../storage";
import { sendPushNotification } from "../lib/firebaseAdmin";

let cronInterval: ReturnType<typeof setInterval> | null = null;
let isProcessing = false;

async function processNotifications(): Promise<void> {
  if (isProcessing) {
    console.log("Notification cron: Previous run still in progress, skipping");
    return;
  }

  isProcessing = true;
  try {
    const pendingNotifications = await storage.getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      try {
        const eligibleUserIds = await storage.getEligibleUserIdsForNotification(
          notification.requiredProgramCode,
          notification.requiredProgramLevel
        );

        if (eligibleUserIds.length === 0) {
          console.log(`No eligible users for notification ${notification.id}, marking as sent`);
          await storage.markNotificationSent(notification.id);
          continue;
        }

        const deviceTokens = await storage.getDeviceTokensByUserIds(eligibleUserIds);
        
        if (deviceTokens.length === 0) {
          console.log(`No device tokens found for notification ${notification.id}, marking as sent`);
          await storage.markNotificationSent(notification.id);
          continue;
        }

        const tokens = deviceTokens.map(dt => dt.token);
        const userIdByToken = new Map(deviceTokens.map(dt => [dt.token, dt.userId]));

        console.log(`Sending notification ${notification.id} to ${tokens.length} devices`);

        // Build data payload with deep link info for event reminders
        const dataPayload: Record<string, string> = {
          type: notification.type,
          notificationId: String(notification.id),
        };
        
        // Add eventId for deep linking when it's an event reminder
        if (notification.type === "event_reminder" && notification.relatedEventId) {
          dataPayload.eventId = String(notification.relatedEventId);
        }

        const result = await sendPushNotification(
          tokens,
          notification.title,
          notification.body,
          dataPayload
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

        await storage.markNotificationSent(notification.id);

        console.log(
          `Notification ${notification.id}: ${result.successCount} sent, ${result.failureCount} failed`
        );
      } catch (notificationError) {
        console.error(`Error processing notification ${notification.id}:`, notificationError);
      }
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
  } finally {
    isProcessing = false;
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
