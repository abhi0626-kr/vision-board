import { initializeApp, getApp, getApps } from 'firebase/app';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

const requiredConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredConfigValues.every(Boolean);

export const app = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export const googleProvider = app ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

if (auth) {
  void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
}

// Connect to local emulators when requested via environment variable.
// Storage also auto-falls back on localhost so uploads keep working in local dev
// even if the Vite process was started before .env.local was updated.
const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const useStorageEmulator = import.meta.env.VITE_USE_FIREBASE_STORAGE_EMULATOR === 'true' || useEmulator || isLocalhost;
const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';
const emulatorPorts = {
  auth: Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || 9099),
  firestore: Number(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080),
  storage: Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199),
};

if ((useEmulator || useStorageEmulator) && typeof window !== 'undefined') {
  try {
    if (auth && useEmulator) {
      connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorPorts.auth}`, { disableWarnings: true });
      console.log('[Firebase] Connected Auth emulator at', `${emulatorHost}:${emulatorPorts.auth}`);
    }

    if (db && useEmulator) {
      connectFirestoreEmulator(db, emulatorHost, emulatorPorts.firestore);
      console.log('[Firebase] Connected Firestore emulator at', `${emulatorHost}:${emulatorPorts.firestore}`);
    }

    if (storage && useStorageEmulator) {
      connectStorageEmulator(storage, emulatorHost, emulatorPorts.storage);
      console.log('[Firebase] Connected Storage emulator at', `${emulatorHost}:${emulatorPorts.storage}`);
    }
  } catch (e) {
    console.warn('[Firebase] Could not connect to emulators', e);
  }
}

export { firebaseConfig };

// Debug logging for Firebase configuration
if (typeof window !== 'undefined') {
  console.log('[Firebase] Configuration status:', {
    configured: isFirebaseConfigured,
    hasApp: !!app,
    hasDb: !!db,
    hasAuth: !!auth,
  });
}