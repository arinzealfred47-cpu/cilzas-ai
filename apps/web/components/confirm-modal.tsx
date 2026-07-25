"use client";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirming = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="animate-fade-scale-in fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "var(--scrim)" }}
    >
      <div className="animate-fade-scale-in card w-full max-w-sm p-5">
        <h3 className="text-[1rem] font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">{message}</p>
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
            onClick={onConfirm}
            disabled={confirming}
            className="chip chip-danger px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ background: "var(--danger-fill)" }}
          >
            {confirming ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
