import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ─── Main Admin App Instance ──────────────────────────────────────────────
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ─── Portal App Instance ──────────────────────────────────────────────────
const PORTAL_APP_NAME = "portal";

export const portalApp =
  getApps().find((a) => a.name === PORTAL_APP_NAME) ??
  initializeApp(firebaseConfig, PORTAL_APP_NAME);

// Safe Portal Auth initialization (Handles SSR & Next.js Hot Reloads)
const getPortalAuth = () => {
  try {
    return getAuth(portalApp);
  } catch {
    const isBrowser = typeof window !== "undefined";
    return initializeAuth(portalApp, {
      persistence: isBrowser
        ? [indexedDBLocalPersistence, browserLocalPersistence]
        : inMemoryPersistence,
    });
  }
};

export const portalAuth = getPortalAuth();
export const portalDb = getFirestore(portalApp);
export const portalStorage = getStorage(portalApp);