"use client";

import { useEffect, useState } from "react";

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function DeletionBanner({
  title,
  expiresAt,
  onUndo,
}: {
  title: string;
  expiresAt: number;
  onUndo: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="animate-fade-scale-in card flex items-center justify-between gap-3 p-4"
      style={{ background: "var(--danger-bg)" }}
    >
      <p className="text-sm" style={{ color: "var(--danger)" }}>
        <span className="font-semibold">{title}</span> will be deleted in{" "}
        <span className="font-variant-numeric-tabular">
          {formatCountdown(expiresAt - now)}
        </span>
        .
      </p>
      <button type="button" onClick={onUndo} className="chip shrink-0">
        Undo
      </button>
    </div>
  );
}
