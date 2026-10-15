import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDORKjTAe_uwoDoGjtSRsG1UMo3ug4scbo",
  authDomain: "planning-ooredoo-59b89.firebaseapp.com",
  projectId: "planning-ooredoo-59b89",
  storageBucket: "planning-ooredoo-59b89.firebasestorage.app",
  messagingSenderId: "437814549774",
  appId: "1:437814549774:web:dbd4972d7a2abfd173cb5f",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
