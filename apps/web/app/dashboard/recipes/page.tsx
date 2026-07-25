"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomModeInput, QuestionnaireModeInput } from "@repo/recipes";
import { CustomForm } from "./custom-form";
import { QuestionnaireWizard } from "./questionnaire-wizard";
import { PhotoPicker } from "./photo-picker";
import { RecipeCard, type SavedRecipe } from "./recipe-card";
import { DeletionBanner } from "./deletion-banner";

type Mode = "custom" | "questionnaire" | "photo";

const DELETION_UNDO_MS = 5 * 60 * 1000;

type PendingDeletion = {
  title: string;
  expiresAt: number;
};

export default function RecipesPage() {
  const [mode, setMode] = useState<Mode>("custom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedRecipe | null>(null);
  const [history, setHistory] = useState<SavedRecipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pendingDeletions, setPendingDeletions] = useState<
    Record<string, PendingDeletion>
  >({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      if (res.ok) setHistory(data.recipes);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    return () => {
      // Clear any in-flight undo timers on unmount — matches the mockup's
      // own behavior of not persisting pending deletions across sessions.
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  async function handleSubmit(input: CustomModeInput | QuestionnaireModeInput) {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data.recipe);
      loadHistory();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoSuccess(recipe: SavedRecipe) {
    setResult(recipe);
    setError(null);
    loadHistory();
  }

  function handlePhotoError(message: string) {
    setError(message || null);
  }

  function handleHealthified(recipe: SavedRecipe) {
    setResult(recipe);
    loadHistory();
  }

  // Deletion is deferred: confirming starts a 5-minute undo window and only
  // performs the real DELETE call once the timer actually fires. Undo just
  // clears the timer — no network request is ever made in that case.
  function handleRequestDelete(recipeId: string) {
    const recipe = history.find((r) => r.id === recipeId) ?? (result?.id === recipeId ? result : null);
    if (!recipe) return;

    const expiresAt = Date.now() + DELETION_UNDO_MS;
    setPendingDeletions((prev) => ({
      ...prev,
      [recipeId]: { title: recipe.title, expiresAt },
    }));

    timeoutsRef.current[recipeId] = setTimeout(() => {
      finalizeDeletion(recipeId);
    }, DELETION_UNDO_MS);
  }

  async function finalizeDeletion(recipeId: string) {
    delete timeoutsRef.current[recipeId];
    try {
      await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
    } finally {
      setHistory((prev) => prev.filter((r) => r.id !== recipeId));
      setResult((prev) => (prev?.id === recipeId ? null : prev));
      setPendingDeletions((prev) => {
        const next = { ...prev };
        delete next[recipeId];
        return next;
      });
    }
  }

  function handleUndoDelete(recipeId: string) {
    const timeout = timeoutsRef.current[recipeId];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutsRef.current[recipeId];
    }
    setPendingDeletions((prev) => {
      const next = { ...prev };
      delete next[recipeId];
      return next;
    });
  }

  const modeButtons: { key: Mode; label: string }[] = [
    { key: "custom", label: "Custom" },
    { key: "questionnaire", label: "Recommend for me" },
    { key: "photo", label: "From Photo" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16">
      <h1 className="text-[1.25rem] font-bold tracking-[-0.01em]">Generate a recipe</h1>

      <div className="pill-tabs">
        {modeButtons.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`pill-tab ${mode === m.key ? "active" : ""}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "custom" && (
        <CustomForm onSubmit={handleSubmit} submitting={submitting} />
      )}
      {mode === "questionnaire" && (
        <QuestionnaireWizard onSubmit={handleSubmit} submitting={submitting} />
      )}
      {mode === "photo" && (
        <PhotoPicker onSuccess={handlePhotoSuccess} onError={handlePhotoError} />
      )}

      {submitting && (
        <p className="text-sm text-[color:var(--text-muted)]">Generating your recipe...</p>
      )}

      {error && <p className="error-box">{error}</p>}

      {result && !pendingDeletions[result.id] && (
        <div>
          <p className="section-label mb-2">Just generated</p>
          <RecipeCard
            recipe={result}
            onHealthified={handleHealthified}
            onRequestDelete={handleRequestDelete}
          />
        </div>
      )}

      <div id="history" className="history-zone flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[1.0625rem] font-semibold">Recipe History</h2>
          <span className="history-count">{history.length}</span>
        </div>
        {historyLoading && (
          <p className="text-sm text-[color:var(--text-muted)]">Loading...</p>
        )}
        {!historyLoading && history.length === 0 && (
          <p className="text-sm text-[color:var(--text-muted)]">
            No recipes generated yet.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {history.map((r) => {
            const pending = pendingDeletions[r.id];
            if (pending) {
              return (
                <DeletionBanner
                  key={r.id}
                  title={pending.title}
                  expiresAt={pending.expiresAt}
                  onUndo={() => handleUndoDelete(r.id)}
                />
              );
            }
            return (
              <RecipeCard
                key={r.id}
                recipe={r}
                onHealthified={handleHealthified}
                onRequestDelete={handleRequestDelete}
                collapsible
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
