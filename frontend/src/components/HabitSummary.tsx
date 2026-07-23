import HabitMedia from "./HabitMedia";
import type { HabitKey, WellnessEntry } from "../types/wellness";

type HabitSummaryProps = {
  entry: WellnessEntry;
};

export default function HabitSummary({ entry }: HabitSummaryProps) {
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
