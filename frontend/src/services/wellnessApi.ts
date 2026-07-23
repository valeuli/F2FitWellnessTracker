import type {
  WellnessEntry,
  WellnessEntryUpsert,
  WellnessHistoryResponse,
} from "../types/wellness";

const DEFAULT_BASE_URL = "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 3000;

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;
}

export class WellnessApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WellnessApiError";
    this.status = status;
  }
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response
        .json()
        .catch(() => ({ detail: response.statusText }));

      throw new WellnessApiError(detail.detail ?? "Request failed", response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getToday(date: string): Promise<WellnessEntry> {
  const url = new URL("/api/wellness/today", getBaseUrl());
  url.searchParams.set("date", date);

  return requestJson<WellnessEntry>(url);
}

export async function upsertToday(
  payload: WellnessEntryUpsert,
  idempotencyKey: string,
): Promise<WellnessEntry> {
  return requestJson<WellnessEntry>(`${getBaseUrl()}/api/wellness/today`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export async function getHistory(params: {
  date?: string;
  days?: number;
  timezone?: string;
} = {}): Promise<WellnessHistoryResponse> {
  const url = new URL("/api/wellness/history", getBaseUrl());

  if (params.date) {
    url.searchParams.set("date", params.date);
  }

  if (typeof params.days === "number") {
    url.searchParams.set("days", String(params.days));
  }

  if (params.timezone) {
    url.searchParams.set("timezone", params.timezone);
  }

  return requestJson<WellnessHistoryResponse>(url);
}
