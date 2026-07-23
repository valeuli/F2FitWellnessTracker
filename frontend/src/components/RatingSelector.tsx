type RatingSelectorProps = {
  label: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  mode?: "select" | "pills";
};

const RATINGS = [1, 2, 3, 4, 5];

export default function RatingSelector({
  label,
  value,
  onChange,
  mode = "select",
}: RatingSelectorProps) {
  if (mode === "pills") {
    return (
      <fieldset className="rating-fieldset">
        <legend className="field-label">{label}</legend>
        <div className="rating-pills" role="radiogroup" aria-label={label}>
          {RATINGS.map((rating) => (
            <button
              key={rating}
              type="button"
              className="rating-pill"
              data-active={value === rating}
              aria-pressed={value === rating}
              onClick={() => onChange(rating)}
            >
              {rating}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="field-label">
      <span>{label}</span>
      <select
        className="rating-select"
        value={value ?? ""}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="">Selecciona</option>
        {RATINGS.map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>
    </label>
  );
}
