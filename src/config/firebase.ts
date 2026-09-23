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

// Use named database if NEXT_PUBLIC_FIREBASE_DB_ID is set,
// otherwise fall back to the default database
const dbId = process.env.NEXT_PUBLIC_FIREBASE_DB_ID;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ─── Portal App Instance ──────────────────────────────────────────────────
const PORTAL_APP_NAME = "portal";

export const portalApp =
  getApps().find((a) => a.name === PORTAL_APP_NAME) ??
  initializeApp(firebaseConfig, PORTAL_APP_NAME);

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
export const portalDb = dbId ? getFirestore(portalApp, dbId) : getFirestore(portalApp);
export const portalStorage = getStorage(portalApp);