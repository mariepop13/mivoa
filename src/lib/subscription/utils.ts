import { Timestamp } from 'firebase/firestore';

export function convertTimestampToDate(timestamp: unknown): Date | undefined {
  if (!timestamp) {
    return undefined;
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }

  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  }

  return undefined;
}

