"use client";

import { StatusBadge } from "@/components/ui/statusBadge";
import { AlertsBell } from "@/components/ui/alertsBell";
import { Clock } from "@/components/ui/clock";
import { KeyboardShortcuts } from "@/components/ui/keyboardShortcuts";

interface TopbarProps {
  pharmacyName?: string;
}

export function Topbar({ pharmacyName = "Furqan Medicos" }: TopbarProps) {
  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-6 py-2">
      <h1 className="text-sm font-semibold text-[var(--color-text)]">
        {pharmacyName}
      </h1>

      <div className="flex items-center gap-5">
        <KeyboardShortcuts />
        <AlertsBell />
        <StatusBadge label="Online" />
        <Clock />
      </div>
    </header>
  );
}
