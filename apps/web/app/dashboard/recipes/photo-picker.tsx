"use client";

import { useState } from "react";
import type { SavedRecipe } from "./recipe-card";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PhotoPicker({
  onSuccess,
  onError,
}: {
  onSuccess: (recipe: SavedRecipe) => void;
  onError: (message: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(file: File) {
    onError("");
    setSubmitting(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch("/api/recipe/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        onError(data.error ?? "Something went wrong.");
        return;
      }

      onSuccess(data.recipe);
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  return (
    <div className="animate-fade-scale-in flex flex-col gap-4 rounded border border-white/15 p-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white/90">Upload a photo</span>
        <input
          type="file"
          accept="image/*"
          disabled={submitting}
          onChange={onChange}
          className="text-sm text-white/70 file:mr-3 file:rounded file:border file:border-white/20 file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-white file:transition-transform hover:file:scale-[1.02]"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white/90">Take a photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={submitting}
          onChange={onChange}
          className="text-sm text-white/70 file:mr-3 file:rounded file:border file:border-white/20 file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-white file:transition-transform hover:file:scale-[1.02]"
        />
      </label>

      {submitting && (
        <p className="text-sm text-white/60">Analyzing your photo...</p>
      )}
    </div>
  );
}
