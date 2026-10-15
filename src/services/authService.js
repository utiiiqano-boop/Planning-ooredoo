// Imports dynamiques pour éviter les crashs au chargement
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, user => callback(user));
}

export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: translateError(e.code) };
  }
}

export async function logout() {
  await signOut(auth);
}

function translateError(code) {
  const map = {
    'auth/invalid-email': 'Email invalide',
    'auth/user-not-found': 'Utilisateur introuvable',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/invalid-credential': 'Email ou mot de passe incorrect',
    'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
    'auth/network-request-failed': 'Problème de connexion réseau',
  };
  return map[code] || 'Erreur de connexion';
}
