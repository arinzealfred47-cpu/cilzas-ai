"use client";

import { useState } from "react";
import {
  formatDualMeasurement,
  annotateMeasurementsInText,
  formatRecipeName,
  formatRecipeAsText,
} from "@repo/recipes";
import { ConfirmModal } from "@/components/confirm-modal";
import { EmailModal } from "./email-modal";

export type SavedRecipe = {
  id: string;
  mode: string;
  title: string;
  servings: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
  createdAt: string;
  healthFlags?: { ingredientName: string; vectors: string[] }[];
  basedOnRecipeId?: string | null;
  imageDataUrl?: string | null;
};

export function RecipeCard({
  recipe,
  onHealthified,
  onDeleted,
}: {
  recipe: SavedRecipe;
  onHealthified?: (recipe: SavedRecipe) => void;
  onDeleted?: (recipeId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const flaggedNames = new Set(
    (recipe.healthFlags ?? []).map((f) => f.ingredientName),
  );
  const hasFlags = flaggedNames.size > 0;
  const displayName = formatRecipeName(recipe.title, recipe.mode);

  async function handleHealthify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/healthify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onHealthified?.(data.recipe);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(formatRecipeAsText(recipe));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail(recipientEmail: string) {
    setEmailModalOpen(false);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not send the email.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted?.(recipe.id);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not delete this recipe.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  return (
    <div className="animate-fade-scale-in flex flex-col gap-3 rounded border border-white/15 p-4">
      {recipe.imageDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
        <img
          src={recipe.imageDataUrl}
          alt={displayName}
          className="aspect-square w-full rounded object-cover"
        />
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{displayName}</h3>
        <span className="shrink-0 text-xs text-white/50">
          Serves {recipe.servings}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-white/50">
          Ingredients
        </p>
        <ul className="mt-1 list-disc pl-5 text-sm text-white/80">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              {formatDualMeasurement(ing.quantity, ing.unit)} {ing.name}
              {flaggedNames.has(ing.name) && (
                <span
                  title="Flagged for containing an unhealthy ingredient vector"
                  className="ml-1 text-amber-400"
                >
                  ⚠
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-white/50">
          Directions
        </p>
        <ol className="mt-1 list-decimal pl-5 text-sm text-white/80">
          {recipe.steps.map((step, i) => (
            <li key={i}>{annotateMeasurementsInText(step)}</li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/15 pt-3">
        <button
          type="button"
          onClick={handleCopy}
          className="button-outline px-3 py-1 text-xs"
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
        <button
          type="button"
          onClick={() => setEmailModalOpen(true)}
          className="button-outline px-3 py-1 text-xs"
        >
          Email Recipe
        </button>
        {onDeleted && (
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="rounded border border-red-400/40 px-3 py-1 text-xs text-red-400 transition-transform hover:scale-[1.02] hover:bg-red-400/10"
          >
            Delete Recipe
          </button>
        )}
      </div>

      {hasFlags && onHealthified && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleHealthify}
            disabled={loading}
            className="gradient-button animate-pulse rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:scale-105 disabled:animate-none disabled:opacity-60"
          >
            {loading ? "Generating healthy version..." : "Generate Healthy Version"}
          </button>
        </div>
      )}

      {error && <p className="error-box">{error}</p>}

      <EmailModal
        open={emailModalOpen}
        onCancel={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete this recipe?"
        message={`"${displayName}" will be permanently removed from your Recipe History. This can't be undone.`}
        confirmLabel="Delete"
        confirming={deleting}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
