"use client";

import { useState } from "react";

export function EmailModal({
  open,
  onCancel,
  onSend,
}: {
  open: boolean;
  onCancel: () => void;
  onSend: (email: string) => void;
}) {
  const [email, setEmail] = useState("");

  if (!open) return null;

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div
      className="animate-fade-scale-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "var(--scrim)" }}
    >
      <div className="animate-fade-scale-in card w-full max-w-sm p-5">
        <h3 className="text-[1rem] font-semibold">Email this recipe</h3>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          Opens your email app with the recipe pre-filled.
        </p>
        <input
          type="email"
          autoFocus
          placeholder="recipient@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field mt-3 w-full"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="button-soft text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSend(email)}
            disabled={!valid}
            className="gradient-button px-3 py-1.5 text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
