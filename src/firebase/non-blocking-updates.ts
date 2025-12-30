import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions): Promise<void> {
  try {
    await setDoc(docRef, data, options);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      const contextualError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      }, error);
      errorEmitter.emit('permission-error', contextualError);
    }
    throw error;
  }
}

export async function addDocumentNonBlocking(colRef: CollectionReference, data: any): Promise<DocumentReference<DocumentData>> {
  try {
    return await addDoc(colRef, data);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      const contextualError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      }, error);
      errorEmitter.emit('permission-error', contextualError);
    }
    throw error;
  }
}

export async function updateDocumentNonBlocking(docRef: DocumentReference, data: any): Promise<void> {
  try {
    await updateDoc(docRef, data);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      const contextualError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      }, error);
      errorEmitter.emit('permission-error', contextualError);
    }
    throw error;
  }
}

export async function deleteDocumentNonBlocking(docRef: DocumentReference): Promise<void> {
  try {
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      const contextualError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      }, error);
      errorEmitter.emit('permission-error', contextualError);
    }
    throw error;
  }
}
