import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Conectar emuladores locales si estamos en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Asegurar que no se conecten múltiples veces en fast-refresh de Next.js
  if (!(auth as any)._emulatorActivated) {
    (auth as any)._emulatorActivated = true;
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('🔌 Conectado al emulador de Firebase Auth (puerto 9099)');
    } catch (e) {
      console.warn('⚠️ Error al conectar al emulador de Auth:', e);
    }
  }

  if (!(db as any)._emulatorActivated) {
    (db as any)._emulatorActivated = true;
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔌 Conectado al emulador de Firestore (puerto 8080)');
    } catch (e) {
      console.warn('⚠️ Error al conectar al emulador de Firestore:', e);
    }
  }
}

export { app, auth, db };
