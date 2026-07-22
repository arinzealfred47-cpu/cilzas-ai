"use client";

import { useState } from "react";
import type { CustomModeInput, IngredientInput } from "@repo/recipes";

const EMPTY_ROW: IngredientInput = { name: "", quantity: 1, unit: "" };

export function CustomForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: CustomModeInput) => void;
  submitting: boolean;
}) {
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { ...EMPTY_ROW },
  ]);
  const [servings, setServings] = useState(2);

  const valid =
    servings > 0 &&
    ingredients.length > 0 &&
    ingredients.every((i) => i.name.trim() && i.quantity > 0 && i.unit.trim());

  function updateRow(index: number, patch: Partial<IngredientInput>) {
    setIngredients((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setIngredients((rows) => [...rows, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setIngredients((rows) => rows.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      mode: "custom",
      ingredients: ingredients.map((i) => ({
        ...i,
        name: i.name.trim(),
        unit: i.unit.trim(),
      })),
      servings,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded border border-white/15 p-4"
    >
      <div className="flex flex-col gap-2">
        {ingredients.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={row.quantity}
              onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
              className="input-dark w-16 px-2 py-1.5"
            />
            <input
              type="text"
              placeholder="unit (cups, g, tbsp...)"
              value={row.unit}
              onChange={(e) => updateRow(i, { unit: e.target.value })}
              className="input-dark w-32 px-2 py-1.5"
            />
            <input
              type="text"
              placeholder="ingredient name"
              value={row.name}
              onChange={(e) => updateRow(i, { name: e.target.value })}
              className="input-dark flex-1 px-2 py-1.5"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={ingredients.length === 1}
              className="button-outline px-2 text-sm disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start text-sm text-white/60 underline hover:text-white/80"
        >
          + Add ingredient
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-white/80">
        Servings
        <input
          type="number"
          min={1}
          value={servings}
          onChange={(e) => setServings(Number(e.target.value))}
          className="input-dark w-20 px-2 py-1.5"
        />
      </label>

      <button
        type="submit"
        disabled={!valid || submitting}
        className="gradient-button self-start px-4 py-1.5 text-sm"
      >
        Generate recipe
      </button>
    </form>
  );
}
