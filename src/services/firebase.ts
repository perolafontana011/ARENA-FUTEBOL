import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test server connection as requested by Firebase Integration guidelines
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_health', 'connection_probe'));
    return true;
  } catch (err) {
    // If probe doc doesn't exist that's normal for Firestore; check if client is truly offline
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firestore está operando em modo offline/cache local.');
      return false;
    }
    return true;
  }
}

// Collections
export const COLLECTIONS = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  EXPENSES: 'expenses',
  DEBT_PAYMENTS: 'debt_payments',
  SETTINGS: 'settings'
} as const;

export {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
};
