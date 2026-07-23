import type { HabitKey } from "@/types/wellness";

type HabitIconProps = {
  habit: HabitKey;
};

export default function HabitIcon({ habit }: HabitIconProps) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (habit === "exercise") {
    return (
      <svg {...commonProps}>
        <path d="M6 12h12" />
        <path d="M8 8v8" />
        <path d="M16 8v8" />
        <path d="M5 10l2 2-2 2" />
        <path d="M19 10l-2 2 2 2" />
      </svg>
    );
  }

  if (habit === "hydration") {
    return (
      <svg {...commonProps}>
        <path d="M12 3C8.5 7.1 6.5 9.8 6.5 13a5.5 5.5 0 0 0 11 0c0-3.2-2-5.9-5.5-10Z" />
        <path d="M10.2 14.7c.4.8 1.2 1.3 2 1.3" />
      </svg>
    );
  }

  if (habit === "sleep") {
    return (
      <svg {...commonProps}>
        <path d="M15.5 4.5a7 7 0 1 0 4 12.6A8 8 0 1 1 15.5 4.5Z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 4c3 2.4 4.5 5.2 4.5 7.5 0 2.8-2 5-4.5 5s-4.5-2.2-4.5-5C7.5 9.2 9 6.4 12 4Z" />
      <path d="M12 16.5V20" />
      <path d="M9.2 11.5c.9 1 2 1.5 2.8 1.5" />
    </svg>
  );
}
