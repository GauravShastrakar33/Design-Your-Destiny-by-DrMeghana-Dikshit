import admin from "firebase-admin";

let fcmInstance: admin.messaging.Messaging | null = null;

export function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });

      console.log("🔥 Firebase Admin initialized successfully");

      fcmInstance = admin.messaging();
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      return null;
    }
  } else {
    fcmInstance = admin.messaging();
  }

  return fcmInstance;
}

export function getFCM(): admin.messaging.Messaging | null {
  if (!fcmInstance) {
    return initializeFirebaseAdmin();
  }
  return fcmInstance;
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{
  successCount: number;
  failureCount: number;
  failedTokens: string[];
  tokensToCleanup: string[];
}> {
  const fcm = getFCM();
  
  if (!fcm) {
    console.error("FCM not initialized");
    return {
      successCount: 0,
      failureCount: tokens.length,
      failedTokens: tokens,
      tokensToCleanup: [],
    };
  }

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [], tokensToCleanup: [] };
  }

  // 📦 FCM has a limit of 500 tokens per multicast message
  const batchSize = 500;
  const tokenBatches: string[][] = [];
  for (let i = 0; i < tokens.length; i += batchSize) {
    tokenBatches.push(tokens.slice(i, i + batchSize));
  }

  let totalSuccessCount = 0;
  let totalFailureCount = 0;
  const allFailedTokens: string[] = [];
  const tokensToCleanup: string[] = [];

  console.log(`🚀 Sending notification in ${tokenBatches.length} batch(es) to ${tokens.length} total tokens`);

  for (const batch of tokenBatches) {
    const message: admin.messaging.MulticastMessage = {
      tokens: batch,
      notification: { title, body },
      data,
      // 📱 Ensure high priority for mobile devices
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            "content-available": 1,
          },
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon-192.png",
        },
        data,
      },
    };

    try {
      const response = await fcm.sendEachForMulticast(message);
      totalSuccessCount += response.successCount;
      totalFailureCount += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = batch[idx];
          allFailedTokens.push(token);
          
          const errorCode = resp.error?.code;
          // 🧹 Only cleanup if the token is explicitly invalid/not registered
          if (errorCode === "messaging/registration-token-not-registered") {
            tokensToCleanup.push(token);
          } else {
             console.error(`FCM error for token ${idx} in batch: ${errorCode}`);
          }
        }
      });
    } catch (error) {
      console.error("Error sending multicast batch:", error);
      totalFailureCount += batch.length;
      allFailedTokens.push(...batch);
    }
  }

  return {
    successCount: totalSuccessCount,
    failureCount: totalFailureCount,
    failedTokens: allFailedTokens,
    tokensToCleanup,
  };
}
