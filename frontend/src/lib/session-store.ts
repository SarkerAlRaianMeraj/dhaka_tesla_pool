import { useSyncExternalStore } from "react";
import type { AuthSession } from "./types";

/**
 * The signed-in session, kept outside React and exposed through
 * `useSyncExternalStore`.
 *
 * Why not `useState` plus an effect: the token lives in `localStorage`, so it can
 * only be read in the browser, while the server has rendered "signed out". An
 * effect that reads it after mount produces a second render and a flash of the
 * wrong screen. `useSyncExternalStore` is built for exactly this — the server
 * snapshot is "signed out", the client snapshot is whatever is stored, and React
 * hydrates without a mismatch warning.
 *
 * A module-level store also means every component reads the same value without a
 * provider in between, which keeps the token out of React state entirely.
 */

const STORAGE_KEY = "dhaka-tesla-pool.session";

type SessionSnapshot = {
  session: AuthSession | null;
  /** False until the stored token has been checked against the API. */
  validated: boolean;
};

let snapshot: SessionSnapshot | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    // A corrupted value must not lock the user out permanently.
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function getSnapshot(): SessionSnapshot {
  snapshot ??= { session: readFromStorage(), validated: false };
  return snapshot;
}

function getServerSnapshot(): SessionSnapshot {
  return { session: null, validated: true };
}

function emit(next: SessionSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSession(session: AuthSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit({ session, validated: true });
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  emit({ session: null, validated: true });
}

/** Records that the stored token was confirmed by the API. */
export function markValidated(): void {
  if (snapshot && !snapshot.validated) {
    emit({ ...snapshot, validated: true });
  }
}

export function useSession(): SessionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}