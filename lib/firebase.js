import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);