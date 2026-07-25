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

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

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

// Recipe History cards default to a short preview; a freshly generated
// recipe (collapsible=false) always renders in full — independent
// per-card expand state, so one card can be open while others stay closed.
const PREVIEW_INGREDIENTS = 3;
const PREVIEW_STEPS = 2;

export function RecipeCard({
  recipe,
  onHealthified,
  onRequestDelete,
  collapsible = false,
}: {
  recipe: SavedRecipe;
  onHealthified?: (recipe: SavedRecipe) => void;
  onRequestDelete?: (recipeId: string) => void;
  collapsible?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const flaggedNames = new Set(
    (recipe.healthFlags ?? []).map((f) => f.ingredientName),
  );
  const hasFlags = flaggedNames.size > 0;
  const displayName = formatRecipeName(recipe.title, recipe.mode);

  const isExpanded = !collapsible || expanded;
  const visibleIngredients = isExpanded
    ? recipe.ingredients
    : recipe.ingredients.slice(0, PREVIEW_INGREDIENTS);
  const visibleSteps = isExpanded
    ? recipe.steps
    : recipe.steps.slice(0, PREVIEW_STEPS);
  const hasMore =
    recipe.ingredients.length > PREVIEW_INGREDIENTS ||
    recipe.steps.length > PREVIEW_STEPS;

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

  function handleConfirmDelete() {
    setDeleteModalOpen(false);
    onRequestDelete?.(recipe.id);
  }

  return (
    <div className="card animate-fade-scale-in flex flex-col gap-3 p-4">
      {recipe.imageDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
        <img
          src={recipe.imageDataUrl}
          alt={displayName}
          className="aspect-square w-full rounded-[var(--radius-btn)] object-cover"
        />
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[1rem] font-semibold">{displayName}</h3>
        <span className="shrink-0 text-xs text-[color:var(--text-faint)]">
          Serves {recipe.servings}
        </span>
      </div>

      <div>
        <p className="section-label">Ingredients</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-[color:var(--text)]">
          {visibleIngredients.map((ing, i) => (
            <li key={i}>
              {formatDualMeasurement(ing.quantity, ing.unit)} {ing.name}
              {flaggedNames.has(ing.name) && (
                <span
                  title="Flagged for containing an unhealthy ingredient vector"
                  className="ml-1"
                  style={{ color: "var(--warn)" }}
                >
                  ⚠
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="section-label">Directions</p>
        <ol className="mt-1 list-decimal pl-5 text-sm text-[color:var(--text)]">
          {visibleSteps.map((step, i) => (
            <li key={i}>{annotateMeasurementsInText(step)}</li>
          ))}
        </ol>
      </div>

      {collapsible && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="button-soft self-start px-3 py-1 text-xs"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}

      <div
        className="flex flex-wrap gap-2 border-t pt-3"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="icon-btn-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className={`icon-btn ${copied ? "copied" : ""}`}
            aria-label="Copy to clipboard"
          >
            <CopyIcon />
          </button>
          <span className="icon-tooltip">{copied ? "Copied!" : "Copy"}</span>
        </span>
        <span className="icon-btn-wrap">
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="icon-btn"
            aria-label="Email recipe"
          >
            <EmailIcon />
          </button>
          <span className="icon-tooltip">Email</span>
        </span>
        {onRequestDelete && (
          <span className="icon-btn-wrap">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="icon-btn icon-btn-danger"
              aria-label="Delete recipe"
            >
              <DeleteIcon />
            </button>
            <span className="icon-tooltip">Delete</span>
          </span>
        )}
      </div>

      {hasFlags && onHealthified && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleHealthify}
            disabled={loading}
            className="gradient-button animate-pulse px-4 py-2 text-sm font-semibold disabled:animate-none"
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
        message={`"${displayName}" will be moved out for 5 minutes so you can undo, then permanently removed.`}
        confirmLabel="Delete"
        confirming={false}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
