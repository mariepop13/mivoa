import { doc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

export async function incrementEntryUsage(userId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const usageRef = doc(firestore, `users/${userId}/subscription/usage`);

  try {
    await updateDocumentNonBlocking(usageRef, {
      entriesUsed: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const usageSnap = await getDoc(usageRef);
    
    if (!usageSnap.exists()) {
      await setDocumentNonBlocking(usageRef, {
        entriesUsed: 1,
        lastResetDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, {});
    } else {
      throw error;
    }
  }
}

export async function trackModelUsage(userId: string, modelId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  const usageRef = doc(firestore, `users/${userId}/subscription/usage`);

  try {
    await updateDocumentNonBlocking(usageRef, {
      [`modelUsage.${modelId}`]: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const usageSnap = await getDoc(usageRef);
    
    if (!usageSnap.exists()) {
      await setDocumentNonBlocking(usageRef, {
        modelUsage: { [modelId]: 1 },
        updatedAt: serverTimestamp(),
      }, {});
    } else {
      throw error;
    }
  }
}

export async function checkAndResetIfNeeded(
  userId: string,
  lastResetDate: Date | null
): Promise<boolean> {
  const { firestore } = initializeFirebase();
  const usageRef = doc(firestore, `users/${userId}/subscription/usage`);
  
  if (lastResetDate === null) {
    await setDocumentNonBlocking(usageRef, {
      entriesUsed: 0,
      lastResetDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return true;
  }
  
  const now = new Date();
  const currentMonth = new Date(now);
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const lastResetMonth = new Date(lastResetDate);
  lastResetMonth.setDate(1);
  lastResetMonth.setHours(0, 0, 0, 0);
  
  if (lastResetMonth < currentMonth) {
    await setDocumentNonBlocking(usageRef, {
      entriesUsed: 0,
      lastResetDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return true;
  }
  
  return false;
}

