importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAJLuqn-Okx9JOFFKvJ0ctlaERe0I3rzdQ",
  authDomain: "dyd-by-dr-m.firebaseapp.com",
  projectId: "dyd-by-dr-m",
  storageBucket: "dyd-by-dr-m.firebasestorage.app",
  messagingSenderId: "645018757980",
  appId: "1:645018757980:web:fa4be9ab701ff87f0fef99",
  measurementId: "G-7X50EFX2SF"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Extract data for deep linking
  const data = payload.data || {};
  
  self.registration.showNotification(
    payload.notification?.title || "Notification",
    {
      body: payload.notification?.body,
      icon: "/icon-192.png",
      data: data, // Pass data to notification for click handling
    }
  );
});

// Handle notification click for deep linking
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = "/";

  // Deep link to event page for event reminders
  if (data.type === "event_reminder" && data.eventId) {
    targetUrl = `/events/${data.eventId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // No existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
