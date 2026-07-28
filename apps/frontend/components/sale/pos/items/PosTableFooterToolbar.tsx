import { Pause, RotateCcw, Trash2 } from "lucide-react";

interface PosTableFooterToolbarProps {
  heldCount: number;
  onHold: () => void;
  onRecallHeld: () => void;
  onClear: () => void;
  hasItems: boolean;
}

export function PosTableFooterToolbar({
  heldCount,
  onHold,
  onRecallHeld,
  onClear,
  hasItems,
}: PosTableFooterToolbarProps) {
  return (
    <>
      {/* Action row — sits in the empty space below the items table */}
      <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
        <button
          type="button"
          onClick={onHold}
          disabled={!hasItems}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pause className="h-4 w-4" />
          Hold invoice
          <kbd className="ml-1 rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
            F6
          </kbd>
        </button>

        <button
          type="button"
          onClick={onRecallHeld}
          className="relative flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          Recall held
          {heldCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {heldCount}
            </span>
          )}
          <kbd className="ml-1 rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
            F9
          </kbd>
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasItems}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Clear sale
            <kbd className="ml-1 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-xs text-red-500">
              Ctrl+Del
            </kbd>
          </button>
        </div>
      </div>

      {/* Shortcut hints strip — bottom edge of the panel */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-gray-100 bg-gray-50/60 px-6 py-2.5 text-xs text-gray-400">
        <ShortcutHint keys="/" label="Search product" />
        <ShortcutHint keys="F5" label="Complete sale" />
        <ShortcutHint keys="F6" label="Hold" />
        <ShortcutHint keys="F9" label="Recall" />
        <ShortcutHint keys="Del" label="Remove line" />
        <ShortcutHint keys="↑ ↓" label="Navigate rows" />
      </div>
    </>
  );
}

function ShortcutHint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
        {keys}
      </kbd>
      {label}
    </span>
  );
}
