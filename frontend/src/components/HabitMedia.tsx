import excersiceImage from "@/assets/excersice.png";
import hydrationImage from "@/assets/hydration.png";
import nutritionImage from "@/assets/nutrition.png";
import sleepImage from "@/assets/sleep.png";
import type { HabitKey } from "@/types/wellness";

const HABIT_IMAGES: Record<HabitKey, string> = {
  exercise: excersiceImage,
  hydration: hydrationImage,
  sleep: sleepImage,
  nutrition: nutritionImage,
};

type HabitMediaProps = {
  habit: HabitKey;
  alt?: string;
  className?: string;
};

export default function HabitMedia({ habit, alt = "", className = "habit-media" }: HabitMediaProps) {
  return <img className={className} src={HABIT_IMAGES[habit]} alt={alt} aria-hidden={alt ? undefined : true} />;
}
