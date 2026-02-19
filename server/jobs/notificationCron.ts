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
    
    if (pendingNotifications.length > 0) {
      console.log(`🔔 Notification cron: Found ${pendingNotifications.length} pending notification(s)`);
    }

    for (const notification of pendingNotifications) {
      try {
        const eligibleUserIds = await storage.getEligibleUserIdsForNotification(
          notification.requiredProgramCode,
          notification.requiredProgramLevel
        );

        console.log(`Notification ${notification.id}: Found ${eligibleUserIds.length} eligible users`);

        if (eligibleUserIds.length === 0) {
          console.log(`No eligible users for notification ${notification.id}, marking as sent`);
          await storage.markNotificationSent(notification.id);
          continue;
        }

        const deviceTokens = await storage.getDeviceTokensByUserIds(eligibleUserIds);
        
        console.log(`Notification ${notification.id}: Found ${deviceTokens.length} registered devices`);

        if (deviceTokens.length === 0) {
          console.log(`No device tokens found for notification ${notification.id}, marking as sent`);
          await storage.markNotificationSent(notification.id);
          continue;
        }

        const tokens = deviceTokens.map(dt => dt.token);
        const userIdByToken = new Map(deviceTokens.map(dt => [dt.token, dt.userId]));

        // Check if event is still valid (not cancelled)
        if (notification.type === "event_reminder" && notification.relatedEventId) {
          const event = await storage.getEventById(notification.relatedEventId);
          if (!event || event.status === "CANCELLED") {
            console.log(
              `Skipping notification ${notification.id} because event ${notification.relatedEventId} is ${event?.status || 'missing'}`
            );
            await storage.markNotificationSent(notification.id);
            continue;
          }
        }

        console.log(`Sending notification ${notification.id} to ${tokens.length} devices`);

        // Build data payload with deep link info for event reminders
        const dataPayload: Record<string, string> = {
          type: notification.type,
          notificationId: String(notification.id),
          url: "/notifications", // Default action
        };
        
        // Add eventId for deep linking when it's an event reminder
        if (notification.type === "event_reminder" && notification.relatedEventId) {
          dataPayload.eventId = String(notification.relatedEventId);
          dataPayload.url = `/events/${notification.relatedEventId}`;
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
            error: failed ? "FCM delivery failure" : null,
          });
        }

        // 📝 Always save logs so users can see reminders in-app
        await storage.createNotificationLogs(logs);

        // 🧹 Only cleanup tokens that are explicitly invalid (NotRegistered)
        for (const deadToken of result.tokensToCleanup) {
          try {
            await storage.deleteDeviceToken(deadToken);
            console.log(`Removed dead token: ${deadToken.substring(0, 20)}...`);
          } catch (err) {
            console.error("Error removing dead token:", err);
          }
        }

        await storage.markNotificationSent(notification.id);

        console.log(
          `Notification ${notification.id}: ${result.successCount} push sent, ${result.failureCount} push failed`
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

// Helper to create reminders for an event
export async function createEventReminders(event: {
  id: number;
  title: string;
  startDatetime: Date;
  requiredProgramCode: string;
  requiredProgramLevel: number;
  status: string;
}) {
  // Only create reminders for UPCOMING events
  if (event.status !== "UPCOMING") return;

  const startTime = new Date(event.startDatetime);
  const now = new Date();

  // Format time for notification body (e.g., "3:30 PM")
  const timeStr = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", // e.g., "3:30 PM"
    hour12: true,
    timeZone: "Asia/Kolkata", // Use India time for display if possible, or UTC? better to use generic or specific if user base is known. 
    // actually, let's just use the time string without timezone for now or ensure consistency.
    // The previous implementation used system locale. Let's stick to a safe default or user's expected tz.
    // Given Dr. Meghana Dikshit (likely Indian audience), Asia/Kolkata is a safe bet for "display" if server is UTC.
    // But let's stick to the previous implementation to avoid regression, just ensure it works.
    // Previous: const timeStr = startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  });

  // Use a fixed timezone for consistency if server is UTC
  const timeStrIST = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata" 
  });

  const notifications: Array<{
    title: string;
    body: string;
    type: string;
    scheduledAt: Date;
    requiredProgramCode: string;
    requiredProgramLevel: number;
    relatedEventId: number;
  }> = [];

  // Reminder 1: 24 hours before
  const reminder24h = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
  if (reminder24h > now) {
    notifications.push({
      title: `${event.title} Tomorrow`,
      body: `Your ${event.title} starts tomorrow at ${timeStrIST}.`,
      type: "event_reminder",
      scheduledAt: reminder24h,
      requiredProgramCode: event.requiredProgramCode,
      requiredProgramLevel: event.requiredProgramLevel,
      relatedEventId: event.id,
    });
  }

  // Reminder 2: 15 minutes before
  const reminder15m = new Date(startTime.getTime() - 15 * 60 * 1000);
  if (reminder15m > now) {
    notifications.push({
      title: `Starting Soon`,
      body: `${event.title} starts in 15 minutes.`,
      type: "event_reminder",
      scheduledAt: reminder15m,
      requiredProgramCode: event.requiredProgramCode,
      requiredProgramLevel: event.requiredProgramLevel,
      relatedEventId: event.id,
    });
  }

  if (notifications.length > 0) {
    await storage.createNotifications(notifications);
    console.log(
      `Created ${notifications.length} reminder(s) for event ${event.id}: ${event.title}`
    );
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
