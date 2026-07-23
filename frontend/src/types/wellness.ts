export type HabitKey = "exercise" | "hydration" | "sleep" | "nutrition";

export type WellnessHabits = Record<HabitKey, boolean>;

export interface WellnessEntryUpsert {
  date: string;
  physical_energy?: number | null;
  emotional_state?: number | null;
  notes?: string | null;
  habits?: Partial<WellnessHabits>;
  timezone: string;
}

export interface WellnessEntry {
  id: string;
  user_id: string;
  date: string;
  physical_energy: number | null;
  emotional_state: number | null;
  notes: string | null;
  habits: WellnessHabits;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface WellnessHistoryResponse {
  entries: WellnessEntry[];
}

export interface WellnessUpsertResponse extends WellnessEntry {}
