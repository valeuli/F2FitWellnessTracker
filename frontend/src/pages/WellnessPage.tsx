import { useEffect, useMemo, useState } from "react";

import {
  clearDraft,
  createPendingWrite,
  enqueuePendingWrite,
  hasPendingWrites,
  loadDraft,
  saveDraft,
  syncPendingWrites,
} from "../services/offlineStorage";
import { getToday, upsertToday } from "../services/wellnessApi";
import HabitToggle from "../components/HabitToggle";
import RatingSelector from "../components/RatingSelector";
import SyncStatus from "../components/SyncStatus";
import type {
  HabitKey,
  WellnessEntry,
  WellnessEntryUpsert,
  WellnessHabits,
} from "../types/wellness";

const HABITS: Array<{ key: HabitKey; label: string }> = [
  { key: "exercise", label: "Ejercicio" },
  { key: "hydration", label: "Hidratación" },
  { key: "sleep", label: "Sueño" },
  { key: "nutrition", label: "Alimentación" },
];

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function createEmptyHabits(): WellnessHabits {
  return {
    exercise: false,
    hydration: false,
    sleep: false,
    nutrition: false,
  };
}

function createInitialForm(date: string, timezone: string): WellnessEntryUpsert {
  return {
    date,
    physical_energy: null,
    emotional_state: null,
    notes: "",
    habits: createEmptyHabits(),
    timezone,
  };
}

export default function WellnessPage() {
  const today = useMemo(() => getTodayDate(), []);
  const timezone = useMemo(() => getTimezone(), []);

  const [form, setForm] = useState<WellnessEntryUpsert>(() => {
    return loadDraft() ?? createInitialForm(today, timezone);
  });
  const [currentEntry, setCurrentEntry] = useState<WellnessEntry | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<
    "en_reposo" | "guardando" | "pendiente" | "sincronizado"
  >("en_reposo");

  useEffect(() => {
    saveDraft(form);
  }, [form]);

  useEffect(() => {
    let active = true;

    async function loadEntry(): Promise<void> {
      try {
        setLoading(true);
        const entry = await getToday(today);

        if (!active) {
          return;
        }

        setCurrentEntry(entry);
        setForm({
          date: entry.date,
          physical_energy: entry.physical_energy,
          emotional_state: entry.emotional_state,
          notes: entry.notes ?? "",
          habits: entry.habits,
          timezone: entry.timezone,
        });
      } catch {
        if (!active) {
          return;
        }

        setCurrentEntry(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadEntry();

    return () => {
      active = false;
    };
  }, [today]);

  useEffect(() => {
    async function trySyncPending(): Promise<void> {
      if (!hasPendingWrites()) {
        return;
      }

      const result = await syncPendingWrites();
      if (result.synced > 0) {
        setSyncState("sincronizado");
        setMessage("Cambios sincronizados.");
      }
    }

    void trySyncPending();

    window.addEventListener("focus", trySyncPending);
    window.addEventListener("online", trySyncPending);

    return () => {
      window.removeEventListener("focus", trySyncPending);
      window.removeEventListener("online", trySyncPending);
    };
  }, []);

  const updateScore = (field: "physical_energy" | "emotional_state", value: number) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateHabit = (habit: HabitKey, value: boolean) => {
    setForm((current) => ({
      ...current,
      habits: {
        ...(current.habits ?? createEmptyHabits()),
        [habit]: value,
      },
    }));
  };

  const updateNotes = (notes: string) => {
    setForm((current) => ({
      ...current,
      notes,
    }));
  };

  const handleSave = async () => {
    if (!form.date || !form.timezone) {
      setMessage("Faltan datos obligatorios.");
      return;
    }

    const payload: WellnessEntryUpsert = {
      ...form,
      habits: form.habits ?? createEmptyHabits(),
    };

    setSyncState("guardando");
    setMessage("");
    const idempotencyKey = crypto.randomUUID();

    try {
      const result = await upsertToday(payload, idempotencyKey);
      setCurrentEntry(result);
      clearDraft();
      setSyncState("sincronizado");
      setMessage("Guardado correctamente.");
    } catch {
      enqueuePendingWrite(createPendingWrite(payload, idempotencyKey));
      setSyncState("pendiente");
      setMessage("Pendiente de sincronización ⏳");
    }
  };

  const actionLabel = currentEntry ? "Actualizar bienestar" : "Registrar bienestar";

  const statusTitle = (() => {
    if (syncState === "guardando") {
      return "Guardando...";
    }

    if (syncState === "pendiente") {
      return "Pendiente de sincronización ⏳";
    }

    if (syncState === "sincronizado") {
      return "Sincronizado ✓";
    }

    return currentEntry ? "Bienestar registrado hoy" : "¿Cómo te sientes hoy? 🌸";
  })();

  const statusMessage = (() => {
    if (syncState === "guardando") {
      return "Estamos guardando tus cambios.";
    }

    if (syncState === "pendiente") {
      return "Se guardó localmente y se enviará cuando vuelva la conexión.";
    }

    if (syncState === "sincronizado") {
      return currentEntry
        ? "Tu bienestar de hoy ya está guardado."
        : "Tus cambios ya están al día.";
    }

    return currentEntry
      ? "Tu bienestar de hoy ya está guardado."
      : "Aún no has registrado tu bienestar de hoy. Tómate un minuto para conectar contigo misma.";
  })();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Wellness check-in</h1>
      <p>Registro rápido de bienestar diario.</p>

      {loading ? <p>Cargando registro del día...</p> : null}
      <SyncStatus title={statusTitle} message={message || statusMessage} />

      <section>
        <RatingSelector
          label="Energía física"
          value={form.physical_energy}
          onChange={(value) => updateScore("physical_energy", value)}
        />
      </section>

      <section>
        <RatingSelector
          label="Estado emocional"
          value={form.emotional_state}
          onChange={(value) => updateScore("emotional_state", value)}
        />
      </section>

      <section>
        <label>
          Notas
          <textarea
            maxLength={100}
            value={form.notes ?? ""}
            onChange={(event) => updateNotes(event.target.value)}
            placeholder="Opcional, máximo 100 caracteres"
          />
        </label>
      </section>

      <section>
        <h2>Hábitos</h2>
        {HABITS.map((habit) => (
          <HabitToggle
            key={habit.key}
            habit={habit.key}
            label={habit.label}
            checked={form.habits?.[habit.key] ?? false}
            onChange={updateHabit}
          />
        ))}
      </section>

      <button onClick={handleSave}>{actionLabel}</button>

      {currentEntry ? (
        <section>
          <h2>Resumen de hoy</h2>
          <p>Energía física: {currentEntry.physical_energy ?? "—"}</p>
          <p>Estado emocional: {currentEntry.emotional_state ?? "—"}</p>
          <p>Notas: {currentEntry.notes ?? "Sin notas"}</p>
        </section>
      ) : null}
    </main>
  );
}
