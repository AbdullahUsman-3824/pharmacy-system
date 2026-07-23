import { AlertCircle } from "lucide-react";

interface StockErrorProps {
  message: string | null;
}

export function StockError({ message }: StockErrorProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in slide-in-from-top-2 fade-in duration-200">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-red-600 hover:text-red-800 underline text-xs"
      >
        Retry
      </button>
    </div>
  );
}
