"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          timeStyle: "short",
        }),
      );
    };

    update();

    const interval = setInterval(update, 60_000);

    return () => clearInterval(interval);
  }, []);

  return <span className="text-xs text-[var(--color-text-muted)]">{time}</span>;
}
