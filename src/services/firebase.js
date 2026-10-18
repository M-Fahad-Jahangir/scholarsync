import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCsGWAYQfrIEUVXFFA6oWwMc3P5-roi1QM',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'scholarsync-a79ad.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'scholarsync-a79ad',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'scholarsync-a79ad.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '999078801289',
  appId: env.VITE_FIREBASE_APP_ID || '1:999078801289:web:79e59222146de604c83b58',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-6T9X7EEP18',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
);

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    if (typeof window !== 'undefined') {
      try {
        enableIndexedDbPersistence(db).catch(() => {
          // Multi-tab restricted or already initialized; proceed silently
        });
      } catch {}
    }
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
}

const TIMETABLE_DOC_REF = () => (db ? doc(db, 'timetable', 'current_data') : null);

/**
 * Real-time listener for timetable data.
 * Whenever any user updates any lecture/class/teacher, this callback fires with the new state.
 */
export function subscribeToTimetable(onDataReceived, onError) {
  if (!isFirebaseConfigured || !db) return () => {};

  const docRef = TIMETABLE_DOC_REF();
  if (!docRef) return () => {};

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onDataReceived(data);
      }
    },
    (err) => {
      console.warn('Firestore real-time subscription notice:', err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Sync timetable data to Firestore in the cloud.
 */
export async function syncTimetableToCloud(payload) {
  if (!isFirebaseConfigured || !db) return;

  const docRef = TIMETABLE_DOC_REF();
  if (!docRef) return;

  try {
    await setDoc(
      docRef,
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync timetable to Firestore:', err.message);
  }
}

export { app, db, auth, firebaseConfig };
