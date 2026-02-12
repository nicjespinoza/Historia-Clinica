import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence
// Uses persistentLocalCache for offline support (modern SDK approach)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});
// FIREBASE APP CHECK - Anti-Bots & DDoS Protection
// ============================================================
// INSTRUCCIONES PARA ACTIVAR:
// 1. Ve a Firebase Console > App Check > Apps
// 2. Registra tu app web con reCAPTCHA Enterprise
// 3. Copia la "Site Key" (empieza con 6L...)
// 4. Agrégala a tu .env.local: VITE_RECAPTCHA_SITE_KEY=6L...
// 5. Despliega con firebase deploy

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// NOTE: App Check está actualmente DESACTIVADO para permitir pruebas en producción con múltiples usuarios.
// Se activará más adelante. Para activarlo, configurar VITE_RECAPTCHA_SITE_KEY en el entorno de producción.
// Solo activar en producción Y si la Site Key está configurada
if (import.meta.env.PROD && RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY.startsWith('6L')) {
    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
        });

    } catch (error) {
        console.warn("⚠️ App Check no pudo inicializarse:", error);
    }
} else if (import.meta.env.PROD) {
    console.warn("⚠️ App Check NO configurado. Agrega VITE_RECAPTCHA_SITE_KEY a tu .env para proteger la app contra bots.");
}


// Export services
export const auth = getAuth(app);
// export const db = getFirestore(app); // Already initialized above
export const storage = getStorage(app);
export const functions = getFunctions(app);
