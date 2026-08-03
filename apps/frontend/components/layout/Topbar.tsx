"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/statusBadge";
import { AlertsBell } from "@/components/ui/alertsBell";

interface TopbarProps {
  pharmacyName?: string;
}

export function Topbar({ pharmacyName = "Furqan Medicos" }: TopbarProps) {
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    const updateTimestamp = () => {
      setTimestamp(
        new Date().toLocaleTimeString("en-IN", {
          timeStyle: "short",
        }),
      );
    };

    updateTimestamp();

    const interval = setInterval(updateTimestamp, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-6 py-2">
      <h1 className="text-sm font-semibold text-[var(--color-text)]">
        {pharmacyName}
      </h1>

      <div className="flex items-center gap-5">
        <AlertsBell />
        <StatusBadge label="Online" />
        <span className="text-xs text-[var(--color-text-muted)]">
          {timestamp}
        </span>
      </div>
    </header>
  );
}
