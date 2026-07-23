type SyncStatusProps = {
  title: string;
  message?: string;
  variant?: "idle" | "saving" | "pending" | "synced" | "error";
};

const ICONS = {
  idle: "💖",
  saving: "⏳",
  pending: "🕒",
  synced: "✓",
  error: "⚠️",
} as const;

export default function SyncStatus({ title, message, variant = "idle" }: SyncStatusProps) {
  return (
    <div className="sync-status" aria-live="polite">
      <p className="sync-status__title">
        {ICONS[variant]} {title}
      </p>
      {message ? <p className="sync-status__message">{message}</p> : null}
    </div>
  );
}
