import { upsertToday } from "./wellnessApi";
import { WellnessApiError } from "./wellnessApi";
import type { WellnessEntryUpsert } from "@/types/wellness";

const DRAFT_KEY = "f2fit_wellness_draft";
const PENDING_WRITES_KEY = "f2fit_wellness_pending_writes";

export interface PendingWellnessWrite {
  id: string;
  payload: WellnessEntryUpsert;
  idempotencyKey: string;
  createdAt: string;
}

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
  validationFailed: number;
}

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeKey(key: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function loadDraft(): WellnessEntryUpsert | null {
  return readJson<WellnessEntryUpsert | null>(DRAFT_KEY, null);
}

export function saveDraft(draft: WellnessEntryUpsert): void {
  writeJson(DRAFT_KEY, draft);
}

export function clearDraft(): void {
  removeKey(DRAFT_KEY);
}

export function loadPendingWrites(): PendingWellnessWrite[] {
  return readJson<PendingWellnessWrite[]>(PENDING_WRITES_KEY, []);
}

export function hasPendingWrites(): boolean {
  return loadPendingWrites().length > 0;
}

export function enqueuePendingWrite(write: PendingWellnessWrite): void {
  const current = loadPendingWrites();
  writeJson(PENDING_WRITES_KEY, [...current, write]);
}

export function clearPendingWrites(): void {
  removeKey(PENDING_WRITES_KEY);
}

export async function syncPendingWrites(): Promise<SyncResult> {
  const pendingWrites = loadPendingWrites();
  let synced = 0;
  let failed = 0;
  let validationFailed = 0;
  const remaining: PendingWellnessWrite[] = [];

  for (const pendingWrite of pendingWrites) {
    try {
      await upsertToday(pendingWrite.payload, pendingWrite.idempotencyKey);
      synced += 1;
    } catch (error) {
      if (error instanceof WellnessApiError && error.status === 422) {
        validationFailed += 1;
        continue;
      }

      failed += 1;
      remaining.push(pendingWrite);
    }
  }

  if (remaining.length === 0) {
    clearPendingWrites();
  } else {
    writeJson(PENDING_WRITES_KEY, remaining);
  }

  return {
    synced,
    failed,
    remaining: remaining.length,
    validationFailed,
  };
}

export function createPendingWrite(
  payload: WellnessEntryUpsert,
  idempotencyKey: string,
): PendingWellnessWrite {
  return {
    id: crypto.randomUUID(),
    payload,
    idempotencyKey,
    createdAt: new Date().toISOString(),
  };
}
