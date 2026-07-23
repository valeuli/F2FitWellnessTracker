import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WellnessEntry } from "../types/wellness";

type WellnessProgressChartProps = {
  entries: WellnessEntry[];
  timezone: string;
};

type ChartPoint = {
  day: string;
  fullLabel: string;
  energy: number | null;
  emotion: number | null;
};

const MAX_SCORE = 5;
const DAYS = 7;

function toDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function formatDayLabel(dateKey: string): string {
  const value = new Date(`${dateKey}T00:00:00`);

  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
  })
    .format(value)
    .replace(".", "")
    .slice(0, 3);
}

function buildChartData(entries: WellnessEntry[], timezone: string): ChartPoint[] {
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const now = new Date();

  return Array.from({ length: DAYS }, (_, index) => {
    const offset = DAYS - 1 - index;
    const day = new Date(now);
    day.setDate(now.getDate() - offset);

    const dateKey = toDateKey(day, timezone);
    const entry = entriesByDate.get(dateKey);

    return {
      day: formatDayLabel(dateKey),
      fullLabel: new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }).format(new Date(`${dateKey}T00:00:00`)),
      energy: entry?.physical_energy ?? null,
      emotion: entry?.emotional_state ?? null,
    };
  });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | null; payload?: ChartPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const dayLabel = payload[0]?.payload?.fullLabel ?? label;

  return (
    <div className="progress-tooltip">
      <p className="progress-tooltip__label">{dayLabel}</p>
      {payload.map((item) => (
        <p key={item.name} className="progress-tooltip__item">
          {item.name}: {item.value ?? "—"}
        </p>
      ))}
    </div>
  );
}

export default function WellnessProgressChart({
  entries,
  timezone,
}: WellnessProgressChartProps) {
  const data = buildChartData(entries, timezone);
  const hasValues = data.some(
    (item) => item.energy != null || item.emotion != null,
  );

  if (!hasValues) {
    return (
      <div className="progress-empty" role="status" aria-live="polite">
        Aún no hay suficientes datos para mostrar tu progreso.
      </div>
    );
  }

  return (
      <div className="progress-chart">
        <div className="progress-chart__legend" aria-hidden="true">
          <span className="trend-chart__legend-item trend-chart__legend-item--energy">
            <span className="trend-chart__legend-icon" aria-hidden="true">⚡ </span>
            Energía física
          </span>
          <span className="trend-chart__legend-item trend-chart__legend-item--emotion">
            <span className="trend-chart__legend-icon" aria-hidden="true">    🌸 </span>
            Estado emocional
          </span>
        </div>

      <div className="progress-chart__body">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#f2e9ff" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fill: "#6f6986", fontSize: 12 }}
            />
            <YAxis
              domain={[1, MAX_SCORE]}
              ticks={[1, 2, 3, 4, 5]}
              axisLine={false}
              tickLine={false}
              width={28}
              tick={{ fill: "#6f6986", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energía"
              stroke="#FBBF24"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#FBBF24", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="emotion"
              name="Estado emocional"
              stroke="#EC4899"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#EC4899", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
