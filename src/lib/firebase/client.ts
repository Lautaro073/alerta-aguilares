import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

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

// Inicializar Firebase App Check (solo en el cliente)
let appCheckInstance: AppCheck | null = null;

if (typeof window !== 'undefined') {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (process.env.NODE_ENV !== 'production') {
    // Modo debug: genera un token en la consola del navegador que se registra
    // manualmente en Firebase Console → App Check → Debug tokens
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'), // site key de prueba pública de Google
      isTokenAutoRefreshEnabled: true,
    });
  } else if (siteKey) {
    // Producción: usar la site key real de reCAPTCHA v3
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

// Conectar emuladores locales si estamos en desarrollo y está explícitamente configurado
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // Asegurar que no se conecten múltiples veces en fast-refresh de Next.js
  if (!(auth as unknown as Record<string, boolean>)._emulatorActivated) {
    (auth as unknown as Record<string, boolean>)._emulatorActivated = true;
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    } catch (e) {
      console.warn('⚠️ Error al conectar al emulador de Auth:', e);
    }
  }

}

export { app, auth, appCheckInstance };
