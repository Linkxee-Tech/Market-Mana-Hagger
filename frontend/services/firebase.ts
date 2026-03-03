import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(val =>
  val && typeof val === 'string' && !val.includes("YOUR_FIREBASE") && !val.includes("YOUR_PROJECT_ID")
);

// Initialize Firebase
export const firebaseApp = hasFirebaseConfig
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

// Analytics (Client-side only)
export const initAnalytics = async () => {
  if (firebaseApp && typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) return getAnalytics(firebaseApp);
  }
  return null;
};
