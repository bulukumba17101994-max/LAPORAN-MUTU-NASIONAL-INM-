import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import { HospitalConfig, MonthlyRecord } from '../types/inm';
import { createEmptyRecord } from '../data/inmConfig';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigRaw) : getApp();

// Target provisioned database ID or default
const databaseId = firebaseConfigRaw.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

// Test Firestore cloud connection at startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'inm_records', 'test_connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
  }
}
testConnection();

export const RECORD_COLLECTION = 'inm_records';
export const HOSPITAL_COLLECTION = 'hospital_config';
export const HOSPITAL_DOC_ID = 'main';

export function getRecordDocId(year: number, month: number): string {
  return `${year}_${month}`;
}

/**
 * Real-time subscription to a specific monthly record from Cloud Firestore.
 * Automatically receives live updates whenever any device alters the data.
 */
export function subscribeToMonthlyRecord(
  year: number,
  month: number,
  onUpdate: (record: MonthlyRecord | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docId = getRecordDocId(year, month);
  const docRef = doc(db, RECORD_COLLECTION, docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        const record: MonthlyRecord = {
          month: raw.month ?? month,
          year: raw.year ?? year,
          data: raw.data ?? {},
          lastUpdated: raw.lastUpdated ?? new Date().toISOString(),
          notes: raw.notes,
        };
        onUpdate(record);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error(`Error syncing monthly record ${docId}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to all monthly records for a given year in Cloud Firestore.
 */
export function subscribeToYearRecords(
  year: number,
  onUpdate: (records: Record<number, MonthlyRecord>) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, RECORD_COLLECTION);
  const q = query(colRef, where('year', '==', year));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: Record<number, MonthlyRecord> = {};
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        const m = Number(raw.month);
        if (m >= 1 && m <= 12) {
          records[m] = {
            month: m,
            year: raw.year ?? year,
            data: raw.data ?? {},
            lastUpdated: raw.lastUpdated ?? new Date().toISOString(),
            notes: raw.notes,
          };
        }
      });
      onUpdate(records);
    },
    (err) => {
      console.warn(`Error syncing year records for ${year}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Saves or updates a monthly record in Cloud Firestore in real time.
 */
export async function saveRecordToCloud(record: MonthlyRecord): Promise<void> {
  const docId = getRecordDocId(record.year, record.month);
  const docRef = doc(db, RECORD_COLLECTION, docId);

  const payload = {
    month: record.month,
    year: record.year,
    data: record.data,
    lastUpdated: record.lastUpdated || new Date().toISOString(),
    ...(record.notes ? { notes: record.notes } : {}),
  };

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Deletes a single monthly record from Cloud Firestore.
 */
export async function deleteRecordFromCloud(year: number, month: number): Promise<void> {
  const docId = getRecordDocId(year, month);
  const docRef = doc(db, RECORD_COLLECTION, docId);
  await deleteDoc(docRef);
}

/**
 * Deletes all INM records from Cloud Firestore.
 */
export async function deleteAllRecordsFromCloud(): Promise<void> {
  const colRef = collection(db, RECORD_COLLECTION);
  const snapshot = await getDocs(colRef);
  const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);
}

/**
 * Real-time subscription to Hospital Configuration in Cloud Firestore.
 */
export function subscribeToHospitalConfig(
  onUpdate: (config: HospitalConfig | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, HOSPITAL_COLLECTION, HOSPITAL_DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as HospitalConfig);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Error syncing hospital config:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Saves Hospital Configuration in Cloud Firestore.
 */
export async function saveHospitalConfigToCloud(config: HospitalConfig): Promise<void> {
  const docRef = doc(db, HOSPITAL_COLLECTION, HOSPITAL_DOC_ID);
  await setDoc(docRef, config, { merge: true });
}

/**
 * Fetches all saved monthly records from Cloud Firestore (for backups).
 */
export async function fetchAllCloudRecords(): Promise<Record<string, MonthlyRecord>> {
  const colRef = collection(db, RECORD_COLLECTION);
  const snapshot = await getDocs(colRef);
  const records: Record<string, MonthlyRecord> = {};

  snapshot.forEach((d) => {
    const raw = d.data();
    records[d.id] = {
      month: raw.month,
      year: raw.year,
      data: raw.data || {},
      lastUpdated: raw.lastUpdated,
      notes: raw.notes,
    };
  });

  return records;
}
