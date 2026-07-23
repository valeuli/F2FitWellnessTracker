import HabitToggle from "./HabitToggle";
import RatingSelector from "./RatingSelector";
import type { HabitKey, WellnessEntryUpsert } from "../types/wellness";

const HABITS: Array<{ key: HabitKey; label: string }> = [
  { key: "exercise", label: "Ejercicio" },
  { key: "hydration", label: "Hidratación" },
  { key: "sleep", label: "Sueño" },
  { key: "nutrition", label: "Alimentación" },
];

type WellnessModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  form: WellnessEntryUpsert;
  onClose: () => void;
  onSave: () => void;
  onUpdateScore: (field: "physical_energy" | "emotional_state", value: number) => void;
  onUpdateHabit: (habit: HabitKey, value: boolean) => void;
  onUpdateNotes: (notes: string) => void;
  isSaving: boolean;
  canSave: boolean;
  noteLength: number;
};

export default function WellnessModal({
  isOpen,
  mode,
  form,
  onClose,
  onSave,
  onUpdateScore,
  onUpdateHabit,
  onUpdateNotes,
  isSaving,
  canSave,
  noteLength,
}: WellnessModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wellness-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mode === "create" ? "Registro de hoy" : "Editar registro"}</p>
            <h3 id="wellness-modal-title">Tu bienestar</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <RatingSelector
              label="Energía física"
              value={form.physical_energy}
              onChange={(value) => onUpdateScore("physical_energy", value)}
              mode="pills"
            />
          </section>

          <section className="modal-section">
            <RatingSelector
              label="Estado emocional"
              value={form.emotional_state}
              onChange={(value) => onUpdateScore("emotional_state", value)}
              mode="pills"
            />
          </section>

          <section className="modal-section">
            <h4>Hábitos</h4>
            <div className="habit-grid">
              {HABITS.map((habit) => (
                <HabitToggle
                  key={habit.key}
                  habit={habit.key}
                  label={habit.label}
                  checked={form.habits?.[habit.key] ?? false}
                  onChange={onUpdateHabit}
                />
              ))}
            </div>
          </section>

          <section className="modal-section">
            <label className="field-label" htmlFor="wellness-notes">
              Notas
            </label>
            <textarea
              id="wellness-notes"
              className="notes-input"
              maxLength={100}
              value={form.notes ?? ""}
              onChange={(event) => onUpdateNotes(event.target.value)}
              placeholder="Opcional, máximo 100 caracteres"
            />
            <p className="field-hint">{noteLength}/100 caracteres</p>
          </section>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="primary-button" onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
