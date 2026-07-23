import HabitSummary from "./HabitSummary";
import RatingScale from "./RatingScale";
import WellnessProgressChart from "./WellnessProgressChart";
import type { WellnessEntry } from "../types/wellness";
import { formatWellnessDateLabel } from "../utils/wellnessDate";

type WellnessHistorySectionProps = {
  history: WellnessEntry[];
  timezone: string;
};

function HistoryEntryCard({ entry }: { entry: WellnessEntry }) {
  return (
    <article className="history-card">
      <div className="history-card__header">
        <strong>{formatWellnessDateLabel(entry.date)}</strong>
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
              <td>{formatWellnessDateLabel(entry.date)}</td>
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

export default function WellnessHistorySection({
  history,
  timezone,
}: WellnessHistorySectionProps) {
  return (
    <div className="history-panels">
      <HistoryProgressCard history={history} timezone={timezone} />
      <HistoryTableCard history={history} />
    </div>
  );
}
