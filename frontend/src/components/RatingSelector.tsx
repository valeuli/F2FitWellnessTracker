type RatingSelectorProps = {
  label: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
};

const RATINGS = [1, 2, 3, 4, 5];

export default function RatingSelector({
  label,
  value,
  onChange,
}: RatingSelectorProps) {
  return (
    <label>
      {label}
      <select
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
