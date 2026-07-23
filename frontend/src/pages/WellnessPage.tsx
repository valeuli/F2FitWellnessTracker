import { useEffect, useMemo, useState } from "react";

import {
  clearDraft,
  createPendingWrite,
  enqueuePendingWrite,
  hasPendingWrites,
  loadDraft,
  saveDraft,
  syncPendingWrites,
} from "@/services/offlineStorage";
import { WellnessApiError, getHistory, getToday, upsertToday } from "@/services/wellnessApi";
import SyncStatus from "@/components/SyncStatus";
import WellnessModal from "@/components/WellnessModal";
import { getStatusCopy, type WellnessSyncState } from "@/utils/wellnessCopy";
import type {
  HabitKey,
  WellnessEntry,
  WellnessEntryUpsert,
  WellnessHabits,
  WellnessHistoryResponse,
} from "@/types/wellness";

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

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatHabits(entry: WellnessEntry): string {
  const habits = [
    entry.habits.exercise ? "Ejercicio" : null,
    entry.habits.hydration ? "Hidratación" : null,
    entry.habits.sleep ? "Sueño" : null,
    entry.habits.nutrition ? "Alimentación" : null,
  ].filter(Boolean);

  return habits.length > 0 ? habits.join(" · ") : "Sin hábitos marcados";
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden="true">
      <circle cx="160" cy="120" r="92" fill="rgba(255,255,255,0.7)" />
      <circle cx="118" cy="82" r="36" fill="rgba(249,168,212,0.42)" />
      <circle cx="210" cy="150" r="42" fill="rgba(125,211,192,0.46)" />
      <ellipse cx="162" cy="150" rx="68" ry="56" fill="#FFFFFF" opacity="0.92" />
      <path
        d="M137 132c6-17 18-27 31-27 15 0 28 12 35 30 6 16 7 31 7 31H129s1-15 8-34Z"
        fill="#C084FC"
        opacity="0.22"
      />
      <path
        d="M137 134c6-16 18-24 31-24 14 0 27 10 34 27 4 11 5 20 5 20H131s1-10 6-23Z"
        fill="#F9A8D4"
        opacity="0.42"
      />
      <circle cx="168" cy="110" r="20" fill="#FFE4EC" />
      <path
        d="M154 110c0-7 6-13 14-13s14 6 14 13"
        stroke="#3F3D56"
        strokeOpacity="0.45"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M138 165h90"
        stroke="#E9D5FF"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M206 96c12 2 21 11 21 23 0 6-2 11-6 15"
        stroke="#7DD3C0"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M99 97c-8 6-12 13-12 22 0 5 1 9 4 13"
        stroke="#F9A8D4"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WellnessPage() {
  const today = useMemo(() => getTodayDate(), []);
  const timezone = useMemo(() => getTimezone(), []);

  const [form, setForm] = useState<WellnessEntryUpsert>(() => {
    return loadDraft() ?? createInitialForm(today, timezone);
  });
  const [currentEntry, setCurrentEntry] = useState<WellnessEntry | null>(null);
  const [history, setHistory] = useState<WellnessEntry[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loadingToday, setLoadingToday] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<WellnessSyncState>("en_reposo");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    saveDraft(form);
  }, [form]);

  useEffect(() => {
    if (form.timezone === timezone) {
      return;
    }

    setForm((current) => ({
      ...current,
      timezone,
    }));
  }, [form.timezone, timezone]);

  useEffect(() => {
    let active = true;

    async function loadTodayEntry(): Promise<void> {
      try {
        setLoadingToday(true);
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
          setLoadingToday(false);
        }
      }
    }

    async function loadHistoryEntries(): Promise<void> {
      try {
        setLoadingHistory(true);
        const response: WellnessHistoryResponse = await getHistory({
          days: 7,
          timezone,
        });

        if (!active) {
          return;
        }

        setHistory(response.entries);
      } catch {
        if (!active) {
          return;
        }

        setHistory([]);
      } finally {
        if (active) {
          setLoadingHistory(false);
        }
      }
    }

    void loadTodayEntry();
    void loadHistoryEntries();

    return () => {
      active = false;
    };
  }, [today, timezone]);

  useEffect(() => {
    async function trySyncPending(): Promise<void> {
      if (!hasPendingWrites()) {
        return;
      }

      const result = await syncPendingWrites();
      if (result.validationFailed > 0) {
        setSyncState("error");
        setMessage("Hay un pendiente que no pasó validación. Revísalo y vuelve a guardar.");
        return;
      }

      if (result.synced > 0) {
        setSyncState("sincronizado");
        setToastMessage("Cambios sincronizados ✓");
        const response = await getHistory({ days: 7, timezone });
        setHistory(response.entries);
      }
    }

    void trySyncPending();

    window.addEventListener("focus", trySyncPending);
    window.addEventListener("online", trySyncPending);

    return () => {
      window.removeEventListener("focus", trySyncPending);
      window.removeEventListener("online", trySyncPending);
    };
  }, [timezone]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastMessage("");
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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

  const openModal = () => {
    setMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (syncState !== "guardando") {
      setIsModalOpen(false);
    }
  };

  const handleSave = async () => {
    if (!form.date || !form.timezone) {
      setMessage("Faltan datos obligatorios.");
      return;
    }

    if (form.physical_energy == null || form.emotional_state == null) {
      setSyncState("error");
      setMessage("Debes seleccionar energía física y estado emocional.");
      return;
    }

    const notesLength = form.notes?.length ?? 0;
    if (notesLength > 100) {
      setMessage("Las notas no pueden superar 100 caracteres.");
      setSyncState("error");
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
      setForm({
        date: result.date,
        physical_energy: result.physical_energy,
        emotional_state: result.emotional_state,
        notes: result.notes ?? "",
        habits: result.habits,
        timezone: result.timezone,
      });
      clearDraft();
      setIsModalOpen(false);
      setSyncState("sincronizado");
      setToastMessage("Guardado correctamente ✓");
      const response = await getHistory({ days: 7, timezone });
      setHistory(response.entries);
    } catch (error) {
      if (error instanceof WellnessApiError) {
        setSyncState("error");
        setMessage("Hay un error con los datos. Revisa los campos y vuelve a intentar.");
        return;
      }

      enqueuePendingWrite(createPendingWrite(payload, idempotencyKey));
      setSyncState("pendiente");
      setToastMessage("Pendiente de sincronización ⏳");
      setIsModalOpen(false);
    }
  };

  const statusCopy = getStatusCopy(syncState, currentEntry);
  const noteLength = form.notes?.length ?? 0;
  const isSaving = syncState === "guardando";
  const canSave =
    form.physical_energy != null &&
    form.emotional_state != null &&
    !isSaving &&
    noteLength <= 100;
  const statusMessage = message || statusCopy.message;

  return (
    <main className="page-shell">
      {toastMessage ? <div className="toast">{toastMessage}</div> : null}

      <div className="dashboard">
        <section className="card hero-card" aria-label="Bienvenida">
          <div className="hero-copy">
            <h1>Tu bienestar es mucho más que el ejercicio.</h1>
            <p>Registra cómo te sientes hoy y descubre tu progreso con el tiempo.</p>
          </div>
          <div className="illustration" aria-hidden="true">
            <HeroIllustration />
          </div>
        </section>

        <section className="card">
          <div className="today-grid">
            <div className="today-summary">
              <div>
                <p className="eyebrow">Today&apos;s Wellness</p>
                <h2 className="section-title">Registro de hoy</h2>
                <p className="section-subtitle">
                  {currentEntry
                    ? "Ya registraste tu bienestar de hoy. Puedes editarlo si lo necesitas."
                    : "¿Cómo te sientes hoy? Aún no has registrado tu bienestar de hoy. Solo te tomará unos segundos."}
                </p>
              </div>

              <div className="status-pill" aria-live="polite">
                <SyncStatus
                  title={statusCopy.title}
                  message={statusMessage}
                  variant={
                    syncState === "guardando"
                      ? "saving"
                      : syncState === "pendiente"
                        ? "pending"
                        : syncState === "sincronizado"
                          ? "synced"
                          : syncState === "error"
                            ? "error"
                            : "idle"
                  }
                />
              </div>

              <div className="summary-actions">
                <button className="primary-button" type="button" onClick={openModal}>
                  {currentEntry ? "Editar registro" : "Registrar bienestar"}
                </button>
              </div>
            </div>

            <div className="summary-stat" aria-label="Resumen del registro de hoy">
              <strong>Estado actual</strong>
              {currentEntry ? (
                <>
                  <span>Energía: {currentEntry.physical_energy ?? "—"}</span>
                  <span>Emoción: {currentEntry.emotional_state ?? "—"}</span>
                  <span>Hábitos: {formatHabits(currentEntry)}</span>
                  <span>Notas: {currentEntry.notes ? currentEntry.notes : "Sin notas"}</span>
                  <span className="summary-note">
                    Actualizado: {formatUpdatedAt(currentEntry.updated_at)}
                  </span>
                </>
              ) : (
                <>
                  <span className="summary-note">
                    Aún no has registrado tu bienestar de hoy.
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="history-grid">
            <p className="eyebrow">Historial</p>
            <h2 className="section-title">Historial – últimos 7 días</h2>
            <p className="section-subtitle">
              Un resumen limpio para ver energía, emoción, hábitos y notas.
            </p>

            {loadingHistory ? <p>Cargando historial...</p> : null}

            {history.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Energy</th>
                    <th>Emotion</th>
                    <th>Habits</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateLabel(entry.date)}</td>
                      <td>{entry.physical_energy ?? "—"}</td>
                      <td>{entry.emotional_state ?? "—"}</td>
                      <td>{formatHabits(entry)}</td>
                      <td>{entry.notes ?? "Sin notas"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay historial para mostrar todavía.</p>
            )}
          </div>
        </section>
      </div>

      <WellnessModal
        isOpen={isModalOpen}
        mode={currentEntry ? "edit" : "create"}
        form={form}
        onClose={closeModal}
        onSave={handleSave}
        onUpdateScore={updateScore}
        onUpdateHabit={updateHabit}
        onUpdateNotes={updateNotes}
        isSaving={isSaving}
        canSave={canSave}
        noteLength={noteLength}
      />

      {!canSave ? (
        <p className="section-subtitle">Selecciona energía física y estado emocional para guardar.</p>
      ) : null}
      {!isOnline ? <p className="section-subtitle">Estás sin conexión. Los cambios quedarán pendientes.</p> : null}
      {loadingToday ? <p className="section-subtitle">Cargando registro de hoy...</p> : null}
    </main>
  );
}
