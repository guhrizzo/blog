// firebase.js (atualizado com melhorias)
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence,
  connectFirestoreEmulator 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcnH27vM03uP51PbBfSELIQ6tfDCmw1aE",
  authDomain: "meublog-da849.firebaseapp.com",
  projectId: "meublog-da849",
  storageBucket: "meublog-da849.firebasestorage.app",
  messagingSenderId: "527034794015",
  appId: "1:527034794015:web:023962cd3f01b23a17d52a",
  measurementId: "G-EWX80G4SJW"
};

const app = initializeApp(firebaseConfig);

// Inicializações
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Configurações de persistência
if (typeof window !== 'undefined') {
  // Auth persistence
  setPersistence(auth, browserLocalPersistence)
    .catch((err) => console.error("Auth persistence error:", err));

  // Firestore offline persistence (multi-tab)
  enableMultiTabIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open");
      } else if (err.code === 'unimplemented') {
        console.warn("Persistence not supported by browser");
      }
    });
}

// Ambiente de desenvolvimento (descomentar quando necessário)
// if (process.env.NODE_ENV === 'development') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

export default app;