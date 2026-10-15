import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC7kE6mr3e9ItIGjAoUWwNELGQVGFqolSw",
  authDomain: "planning-ooredoo.firebaseapp.com",
  databaseURL: "https://planning-ooredoo-default-rtdb.firebaseio.com",
  projectId: "planning-ooredoo",
  storageBucket: "planning-ooredoo.firebasestorage.app",
  messagingSenderId: "176372375824",
  appId: "1:176372375824:web:58f7b3ed77b1450d408595",
  measurementId: "G-68MMPDZWHL",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
