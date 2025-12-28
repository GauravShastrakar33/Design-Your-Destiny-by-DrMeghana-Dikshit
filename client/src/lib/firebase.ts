import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAJLuqn-Okx9JOFFKvJ0ctlaERe0I3rzdQ",
  authDomain: "dyd-by-dr-m.firebaseapp.com",
  projectId: "dyd-by-dr-m",
  storageBucket: "dyd-by-dr-m.firebasestorage.app",
  messagingSenderId: "645018757980",
  appId: "1:645018757980:web:fa4be9ab701ff87f0fef99",
  measurementId: "G-7X50EFX2SF"
};

export const firebaseApp = initializeApp(firebaseConfig);

export async function getFirebaseMessaging() {
  const supported = await isSupported();
  return supported ? getMessaging(firebaseApp) : null;
}
