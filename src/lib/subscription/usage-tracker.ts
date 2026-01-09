import { doc, serverTimestamp, increment, getDoc, runTransaction } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

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

function initializeUsageDocument(usageRef: ReturnType<typeof doc>): Promise<boolean> {
  const { firestore } = initializeFirebase();
    return runTransaction(firestore, async (transaction) => {
      const usageSnap = await transaction.get(usageRef);
      if (!usageSnap.exists() || !usageSnap.data()?.lastResetDate) {
        transaction.set(usageRef, {
          entriesUsed: 0,
          lastResetDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return true;
      }
      return false;
    });
  }
  
function resetMonthlyUsage(usageRef: ReturnType<typeof doc>, now: Date): Promise<boolean> {
  const { firestore } = initializeFirebase();
    return runTransaction(firestore, async (transaction) => {
      const usageSnap = await transaction.get(usageRef);
      const data = usageSnap.data();
      
      if (!usageSnap.exists() || !data) {
        transaction.set(usageRef, {
          entriesUsed: 0,
          lastResetDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return true;
      }
      
      const storedResetDate = data.lastResetDate?.toDate?.() || data.lastResetDate;
      if (!storedResetDate || !isSameMonth(storedResetDate, now)) {
        transaction.update(usageRef, {
          entriesUsed: 0,
          lastResetDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return true;
      }
      
      return false;
    });
}

export async function checkAndResetIfNeeded(
  userId: string,
  lastResetDate: Date | null
): Promise<boolean> {
  const { firestore } = initializeFirebase();
  const usageRef = doc(firestore, `users/${userId}/subscription/usage`);
  
  if (lastResetDate === null) {
    return initializeUsageDocument(usageRef);
  }
  
  const now = new Date();
  if (!isSameMonth(lastResetDate, now)) {
    return resetMonthlyUsage(usageRef, now);
  }
  
  return false;
}

