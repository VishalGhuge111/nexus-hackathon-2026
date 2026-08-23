import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorState({
  message,
  onRetry,
  compact = false
}: {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}): React.ReactElement {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <span className="flex items-center gap-2 min-w-0">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="truncate">{message}</span>
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/50 px-8 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900">Something went wrong</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
