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
  self.registration.showNotification(
    payload.notification?.title || "Notification",
    {
      body: payload.notification?.body,
      icon: "/icon-192.png",
    }
  );
});
