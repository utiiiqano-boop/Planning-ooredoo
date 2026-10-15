import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// PERSONNES
// ============================================
const PERSONS_COL = 'persons';

export function subscribePersons(callback, onError) {
  return onSnapshot(
    collection(db, PERSONS_COL),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    err => {
      console.error('[subscribePersons]', err);
      if (onError) onError(err);
    }
  );
}

export async function addPerson(person) {
  const id = person.name.toLowerCase().replace(/\s+/g, '_');
  await setDoc(doc(db, PERSONS_COL, id), {
    name: person.name,
    isResponsable: !!person.isResponsable,
    restDay: person.restDay ?? null,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function updatePerson(id, data) {
  await updateDoc(doc(db, PERSONS_COL, id), data);
}

export async function deletePerson(id) {
  await deleteDoc(doc(db, PERSONS_COL, id));
}

// ============================================
// CONGÉS
// ============================================
const CONGES_COL = 'conges';

export function subscribeConges(callback, onError) {
  return onSnapshot(
    collection(db, CONGES_COL),
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    err => {
      console.error('[subscribeConges]', err);
      if (onError) onError(err);
    }
  );
}

export async function addConge(conge) {
  const id = `${conge.personName}_${conge.startDate}_${conge.endDate}`.replace(/\s+/g, '_');
  await setDoc(doc(db, CONGES_COL, id), {
    ...conge,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function deleteConge(id) {
  await deleteDoc(doc(db, CONGES_COL, id));
}

// ============================================
// OVERRIDES (modifications manuelles)
// ============================================
const OVERRIDES_COL = 'overrides';

export function subscribeOverrides(callback, onError) {
  return onSnapshot(
    collection(db, OVERRIDES_COL),
    snap => {
      const map = {};
      snap.docs.forEach(d => {
        map[d.id] = d.data().shifts || {};
      });
      callback(map);
    },
    err => {
      console.error('[subscribeOverrides]', err);
      if (onError) onError(err);
    }
  );
}

export async function setOverride(dateKey, personName, shift) {
  const ref = doc(db, OVERRIDES_COL, dateKey);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().shifts || {} : {};
  const updated = { ...existing, [personName]: shift };
  await setDoc(ref, { shifts: updated, updatedAt: serverTimestamp() });
}

export async function clearOverride(dateKey, personName) {
  const ref = doc(db, OVERRIDES_COL, dateKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const existing = snap.data().shifts || {};
  const updated = { ...existing };
  delete updated[personName];
  await setDoc(ref, { shifts: updated, updatedAt: serverTimestamp() });
}

// ============================================
// PLANNINGS (historique)
// ============================================
const PLANNINGS_COL = 'plannings';

/**
 * Sauvegarde un planning dans l'historique
 */
export async function savePlanning({ name, planning, persons, conges, weeks, startDate }) {
  const id = `planning_${Date.now()}`;
  await setDoc(doc(db, PLANNINGS_COL, id), {
    name: name || `Planning du ${new Date().toLocaleDateString('fr-FR')}`,
    planning,
    personsSnapshot: persons.map(p => ({
      name: p.name,
      isResponsable: p.isResponsable,
      restDay: p.restDay,
    })),
    congesSnapshot: conges,
    weeks,
    startDate: startDate.toISOString(),
    createdAt: serverTimestamp(),
  });
  return id;
}

/**
 * S'abonne à l'historique des plannings
 */
export function subscribePlannings(callback, onError) {
  const q = query(collection(db, PLANNINGS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    err => {
      console.error('[subscribePlannings]', err);
      if (onError) onError(err);
    }
  );
}

export async function deletePlanning(id) {
  await deleteDoc(doc(db, PLANNINGS_COL, id));
}

export async function renamePlanning(id, newName) {
  await updateDoc(doc(db, PLANNINGS_COL, id), { name: newName });
}

// ============================================
// SETTINGS (nom équipe + horaires personnalisés)
// ============================================
const SETTINGS_COL = 'settings';

const DEFAULT_SETTINGS = {
  teamName: 'Ooredoo',
  shift1Label: 'Shift 1',
  shift1Start: '09:00',
  shift1End: '15:00',
  shift2Label: 'Shift 2',
  shift2Start: '15:00',
  shift2End: '09:00',
};

export async function saveSettings(data) {
  await setDoc(
    doc(db, SETTINGS_COL, 'main'),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getSettings() {
  const snap = await getDoc(doc(db, SETTINGS_COL, 'main'));
  return snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
}

export function subscribeSettings(callback, onError) {
  return onSnapshot(
    doc(db, SETTINGS_COL, 'main'),
    snap => {
      const data = snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
      callback(data);
    },
    err => {
      console.error('[subscribeSettings]', err);
      if (onError) onError(err);
    }
  );
}

export { DEFAULT_SETTINGS };
