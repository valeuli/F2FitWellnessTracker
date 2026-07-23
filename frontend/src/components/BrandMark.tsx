import logoImage from "@/assets/LogoF2Fit.png";

type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark${compact ? " brand-mark--compact" : ""}`}>
      <img
        className="brand-mark__icon"
        src={logoImage}
        alt=""
        aria-hidden="true"
      />

      {!compact ? (
        <div className="brand-mark__copy">
          <span>Bienestar integral</span>
        </div>
      ) : null}
    </div>
  );
}
