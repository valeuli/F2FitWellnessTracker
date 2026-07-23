import type { HabitKey } from "../types/wellness";
import HabitMedia from "./HabitMedia";

type HabitToggleProps = {
  label: string;
  habit: HabitKey;
  checked: boolean;
  onChange: (habit: HabitKey, checked: boolean) => void;
};

export default function HabitToggle({
  label,
  habit,
  checked,
  onChange,
}: HabitToggleProps) {
  return (
    <label className={`habit-toggle${checked ? " is-active" : ""}`}>
      <input
        className="sr-only"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(habit, event.target.checked)}
      />
      <span className="habit-toggle__icon" aria-hidden="true">
        <HabitMedia habit={habit} alt="" className="habit-toggle__media" />
      </span>
      <span className="habit-toggle__label">{label}</span>
      <span className="habit-toggle__state">{checked ? "Activo" : "Pendiente"}</span>
    </label>
  );
}
