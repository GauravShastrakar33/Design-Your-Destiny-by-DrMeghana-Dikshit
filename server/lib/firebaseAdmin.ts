import admin from "firebase-admin";

let fcmInstance: admin.messaging.Messaging | null = null;

export function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT not set. Push notifications will be disabled.",
      );
      return null;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson);

      // 🔍 TEMP VERIFICATION LOG (ADD THIS)
      console.log(
        "🔥 Firebase Admin initialized for:",
        serviceAccount.project_id,
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      fcmInstance = admin.messaging();
      console.log("Firebase Admin SDK initialized successfully");
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
}> {
  const fcm = getFCM();

  if (!fcm) {
    console.error("FCM not initialized");
    return {
      successCount: 0,
      failureCount: tokens.length,
      failedTokens: tokens,
    };
  }

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data,
    webpush: {
      notification: {
        title,
        body,
        icon: "/icon-192.png",
      },
      data, // Include data payload for service worker access
    },
  };

  try {
    const response = await fcm.sendEachForMulticast(message);

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
        console.error(`Failed to send to token ${idx}:`, resp.error);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error("Error sending multicast notification:", error);
    return {
      successCount: 0,
      failureCount: tokens.length,
      failedTokens: tokens,
    };
  }
}
