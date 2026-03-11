export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-surface border border-danger/20 rounded-xl p-6 text-center">
      <p className="text-danger font-semibold text-sm mb-1">
        Error al cargar datos
      </p>
      <p className="text-muted text-xs mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-xs bg-danger/10 text-danger border border-danger/20 rounded-lg hover:bg-danger/20 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
