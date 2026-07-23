import type { HabitKey } from "../types/wellness";

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
    <label style={{ display: "block" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(habit, event.target.checked)}
      />
      {label}
    </label>
  );
}
