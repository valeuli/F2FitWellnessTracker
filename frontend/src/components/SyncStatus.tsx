type SyncStatusProps = {
  title: string;
  message?: string;
};

export default function SyncStatus({ title, message }: SyncStatusProps) {
  return (
    <div>
      <p>{title}</p>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
