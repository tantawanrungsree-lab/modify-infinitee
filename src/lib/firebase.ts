import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ModifyJob, UserProfile } from '../types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Clean object for Firestore (strip any undefined fields to prevent Firestore serialization errors)
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      clean[key] = cleanFirestoreData(value);
    } else if (Array.isArray(value)) {
      clean[key] = value
        .filter(item => item !== undefined)
        .map(item => (item !== null && typeof item === 'object') ? cleanFirestoreData(item) : item);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Save or merge job document to Firestore
export async function saveJobToFirestore(job: ModifyJob): Promise<void> {
  try {
    const cleaned = cleanFirestoreData(job);
    await setDoc(doc(db, 'jobs', job.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `jobs/${job.id}`);
    throw error;
  }
}

// Update specific fields of a job document in Firestore
export async function updateJobInFirestore(jobId: string, updates: Partial<ModifyJob>): Promise<void> {
  try {
    const cleaned = cleanFirestoreData(updates);
    await updateDoc(doc(db, 'jobs', jobId), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
    throw error;
  }
}

// Delete job document from Firestore
export async function deleteJobFromFirestore(jobId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'jobs', jobId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `jobs/${jobId}`);
    throw error;
  }
}

// Seed initial sample jobs to Firestore if remote database is empty
export async function seedInitialJobsToFirestore(initialJobs: ModifyJob[]): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'jobs'));
    if (snapshot.empty && initialJobs.length > 0) {
      console.log('Seeding initial jobs to Firestore central database...');
      for (const job of initialJobs) {
        await saveJobToFirestore(job);
      }
      console.log('Initial jobs seeded successfully to Firestore.');
    }
  } catch (error) {
    console.warn('Seeding check note:', error);
  }
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently offline or uninitialized.');
    }
    return false;
  }
}

// Google Sign-in with Popup
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function saveUserProfile(userProfile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userProfile.uid), {
      ...userProfile,
      lastLoginAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save user profile to Firestore:', err);
  }
}
