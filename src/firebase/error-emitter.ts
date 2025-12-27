'use client';
import { FirestorePermissionError } from '@/firebase/errors';

export interface AppEvents extends Record<string, unknown> {
  'permission-error': FirestorePermissionError;
}

type Callback<T> = (data: T) => void;

function safeInvokeCallback<T>(callback: Callback<T>, data: T, eventName: string): void {
  try {
    callback(data);
  } catch (error) {
    console.error(`Error in event listener for ${eventName}:`, error);
  }
}

type EventMap = Record<string, unknown>;

function createEventEmitter<T extends EventMap>() {
  const events: Record<string, Array<Callback<unknown>>> = {};

  return {
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      const key = String(eventName);
      if (!events[key]) {
        events[key] = [];
      }
      events[key].push(callback as Callback<unknown>);
    },

    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      const key = String(eventName);
      if (!events[key]) {
        return;
      }
      events[key] = events[key].filter(cb => cb !== callback);
    },

    emit<K extends keyof T>(eventName: K, data: T[K]) {
      const key = String(eventName);
      const callbacks = events[key];
      if (!callbacks) {
        return;
      }
      callbacks.forEach(callback => {
        safeInvokeCallback(callback as Callback<T[K]>, data, key);
      });
    },
  };
}

export const errorEmitter = createEventEmitter<AppEvents>();

