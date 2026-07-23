type RatingScaleProps = {
  value: number | null | undefined;
  label: string;
  variant?: "energy" | "emotion";
  interactive?: boolean;
  name?: string;
  onChange?: (value: number) => void;
};

const RATINGS = [1, 2, 3, 4, 5];

export default function RatingScale({
  value,
  label,
  variant = "emotion",
  interactive = false,
  name,
  onChange,
}: RatingScaleProps) {
  const toneClass = `rating-scale--${variant}`;

  if (!interactive) {
    return (
      <div className={`rating-scale ${toneClass}`} aria-label={label}>
        {RATINGS.map((rating) => (
          <span
            key={rating}
            className={`rating-scale__dot${value === rating ? " is-active" : ""}`}
            aria-hidden="true"
          >
            <span className="rating-scale__number">{rating}</span>
          </span>
        ))}
      </div>
    );
  }

  const groupName = name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <fieldset className={`rating-scale rating-scale--interactive ${toneClass}`}>
      <legend className="field-label">{label}</legend>
      <div className="rating-scale__group" role="radiogroup" aria-label={label}>
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            className={`rating-scale__dot${value === rating ? " is-active" : ""}`}
            role="radio"
            aria-checked={value === rating}
            aria-label={`${label}: ${rating}`}
            onClick={() => onChange?.(rating)}
          >
            <span className="rating-scale__number">{rating}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
