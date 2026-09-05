import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// If the env vars aren't set yet, `db` is null and the app quietly falls
// back to its built-in demo data — nothing breaks on stage while you're
// still wiring things up.
let db = null;
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
