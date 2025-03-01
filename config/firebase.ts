import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBxs3rR1phe43o85uX8Hd9ShNlTSAsE3E",
  authDomain: "sniper-app-8a3c1.firebaseapp.com",
  projectId: "sniper-app-8a3c1",
  storageBucket: "sniper-app-8a3c1.firebasestorage.app",
  messagingSenderId: "43929708968",
  appId: "1:43929708968:web:683d3110eb940a1362559d",
  measurementId: "G-BN8H84S8RG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
