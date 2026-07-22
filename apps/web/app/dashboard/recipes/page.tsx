"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomModeInput, QuestionnaireModeInput } from "@repo/recipes";
import { CustomForm } from "./custom-form";
import { QuestionnaireWizard } from "./questionnaire-wizard";
import { PhotoPicker } from "./photo-picker";
import { RecipeCard, type SavedRecipe } from "./recipe-card";

type Mode = "custom" | "questionnaire" | "photo";

export default function RecipesPage() {
  const [mode, setMode] = useState<Mode>("custom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedRecipe | null>(null);
  const [history, setHistory] = useState<SavedRecipe[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  function handleDeleted(recipeId: string) {
    setHistory((prev) => prev.filter((r) => r.id !== recipeId));
    setResult((prev) => (prev?.id === recipeId ? null : prev));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recipe Generator</h1>
        <Link href="/dashboard" className="text-sm text-white/60 underline hover:text-white/80">
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            mode === "custom" ? "gradient-button" : "border border-white/20 text-white/70 hover:bg-white/5"
          }`}
        >
          Custom
        </button>
        <button
          type="button"
          onClick={() => setMode("questionnaire")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            mode === "questionnaire" ? "gradient-button" : "border border-white/20 text-white/70 hover:bg-white/5"
          }`}
        >
          Recommend for me
        </button>
        <button
          type="button"
          onClick={() => setMode("photo")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            mode === "photo" ? "gradient-button" : "border border-white/20 text-white/70 hover:bg-white/5"
          }`}
        >
          From Photo
        </button>
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
        <p className="text-sm text-white/60">Generating your recipe...</p>
      )}

      {error && <p className="error-box">{error}</p>}

      {result && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-white/50">
            Just generated
          </p>
          <RecipeCard
            recipe={result}
            onHealthified={handleHealthified}
            onDeleted={handleDeleted}
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase text-white/50">
          Recipe History
        </h2>
        {historyLoading && (
          <p className="text-sm text-white/60">Loading...</p>
        )}
        {!historyLoading && history.length === 0 && (
          <p className="text-sm text-white/60">
            No recipes generated yet.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {history.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onHealthified={handleHealthified}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
