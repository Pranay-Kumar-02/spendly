import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD4D9DSFdTiyodG0w2SgtL0sVxkXGY99G8",
    authDomain: "spendly-b1dd9.firebaseapp.com",
    projectId: "spendly-b1dd9",
    storageBucket: "spendly-b1dd9.firebasestorage.app",
    messagingSenderId: "136310670675",
    appId: "1:136310670675:web:0bf099d4f3b8550bea4da6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;