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
import BrandMark from "@/components/BrandMark";
import HabitMedia from "@/components/HabitMedia";
import RatingScale from "@/components/RatingScale";
import SyncStatus from "@/components/SyncStatus";
import WellnessProgressChart from "@/components/WellnessProgressChart";
import WellnessModal from "@/components/WellnessModal";
import meditarImage from "@/assets/meditar.png";
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
  const parts = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(`${value}T00:00:00`));

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return `${day} de ${month}, ${year}`;
}

function formatUpdatedAt(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function HabitSummary({ entry }: { entry: WellnessEntry }) {
  const habits: Array<{ key: HabitKey; label: string; checked: boolean }> = [
    { key: "exercise", label: "Ejercicio", checked: entry.habits.exercise },
    { key: "hydration", label: "Hidratación", checked: entry.habits.hydration },
    { key: "sleep", label: "Sueño", checked: entry.habits.sleep },
    { key: "nutrition", label: "Alimentación", checked: entry.habits.nutrition },
  ];

  return (
    <div className="habit-summary" aria-label="Hábitos">
      {habits.map((habit) => (
        <span
          key={habit.key}
          className={`habit-summary__chip${habit.checked ? " is-active" : ""}`}
        >
          <HabitMedia habit={habit.key} alt="" className="habit-summary__media" />
          <span>{habit.label}</span>
        </span>
      ))}
    </div>
  );
}

function HistoryEntryCard({ entry }: { entry: WellnessEntry }) {
  return (
    <article className="history-card">
      <div className="history-card__header">
        <strong>{formatDateLabel(entry.date)}</strong>
      </div>

      <div className="history-card__row">
        <span className="summary-score__label">Energía física</span>
        <RatingScale value={entry.physical_energy} label="Energía física" variant="energy" />
      </div>

      <div className="history-card__row">
        <span className="summary-score__label">Estado emocional</span>
        <RatingScale value={entry.emotional_state} label="Estado emocional" variant="emotion" />
      </div>

      <div className="history-card__row">
        <span className="summary-score__label">Hábitos</span>
        <HabitSummary entry={entry} />
      </div>

      <div className="history-card__row">
        <span className="summary-score__label">Notas</span>
        <p className="history-card__notes">{entry.notes ?? "Sin notas"}</p>
      </div>
    </article>
  );
}

function ScoreSummary({
  label,
  value,
  variant,
}: {
  label: string;
  value: number | null;
  variant: "energy" | "emotion";
}) {
  const toneClass = variant === "energy" ? "rating-scale--energy" : "rating-scale--emotion";

  return (
    <div className={`summary-score summary-score--${variant}`}>
      <span className="summary-score__label">{label}</span>
      <span className={`summary-score__value ${toneClass}`} aria-hidden="true">
        <span className="rating-scale__number">{value ?? "—"}</span>
      </span>
    </div>
  );
}

function HistoryProgressCard({
  history,
  timezone,
}: {
  history: WellnessEntry[];
  timezone: string;
}) {
  if (history.length < 3) {
    return (
      <section className="history-panel history-panel--progress">
        <p className="eyebrow">Tu progreso</p>
        <h3 className="history-panel__title">Gráfica de bienestar</h3>
        <div className="progress-empty" role="status" aria-live="polite">
          <p className="progress-empty__title">Aún no hay suficientes registros para mostrar una tendencia.</p>
          <p className="progress-empty__text">
            Completa tu bienestar durante algunos días y aquí podrás visualizar tu evolución.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="history-panel history-panel--progress">
      <p className="eyebrow">Tu progreso</p>
      <h3 className="history-panel__title">Gráfica de bienestar</h3>
      <WellnessProgressChart entries={history} timezone={timezone} />
    </section>
  );
}

function HistoryTableCard({ history }: { history: WellnessEntry[] }) {
  return (
    <section className="history-panel history-panel--table">
      <p className="eyebrow">Historial detallado</p>
      <h3 className="history-panel__title">Últimos 7 días</h3>

      <table className="history-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Energía física</th>
            <th>Estado emocional</th>
            <th>Hábitos</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDateLabel(entry.date)}</td>
              <td>
                <RatingScale value={entry.physical_energy} label="Energía física" variant="energy" />
              </td>
              <td>
                <RatingScale value={entry.emotional_state} label="Estado emocional" variant="emotion" />
              </td>
              <td>
                <HabitSummary entry={entry} />
              </td>
              <td className="history-table__notes">{entry.notes ?? "Sin notas"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="history-cards">
        {history.map((entry) => (
          <HistoryEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <img className="hero-illustration__image" src={meditarImage} alt="" aria-hidden="true" />
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
      <header className="app-header">
        <BrandMark />
        <div className="app-header__copy">
          <p className="app-header__eyebrow">Registro de bienestar</p>
          <p className="app-header__subtitle">Calmo, simple y rápido.</p>
        </div>
      </header>

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
                  <div className="summary-scores-row">
                    <ScoreSummary label="Energía física" value={currentEntry.physical_energy} variant="energy" />
                    <ScoreSummary label="Estado emocional" value={currentEntry.emotional_state} variant="emotion" />
                  </div>
                  <div>
                    <span className="summary-score__label">Hábitos</span>
                    <HabitSummary entry={currentEntry} />
                  </div>
                  <span>Notas: {currentEntry.notes ? currentEntry.notes : "Sin notas"}</span>
                  <span className="summary-note summary-note--updated">
                    Actualizado: {formatUpdatedAt(currentEntry.updated_at, currentEntry.timezone)}
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
              <div className="history-panels">
                <HistoryProgressCard history={history} timezone={timezone} />
                <HistoryTableCard history={history} />
              </div>
            ) : null}
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
