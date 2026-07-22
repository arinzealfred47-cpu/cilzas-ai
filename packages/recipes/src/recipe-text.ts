import { formatDualMeasurement, annotateMeasurementsInText } from "./measurement-converter";

export const RECIPE_MODE_LABELS: Record<string, string> = {
  custom: "Custom Ingredients",
  questionnaire: "Recommended",
  image: "From Photo",
  healthified: "Healthified",
};

function modeLabel(mode: string): string {
  return RECIPE_MODE_LABELS[mode] ?? mode;
}

/** "[Prepared food/dish - Recipe generation method]", e.g. "Spaghetti Carbonara - Custom Ingredients". */
export function formatRecipeName(title: string, mode: string): string {
  return `${title} - ${modeLabel(mode)}`;
}

export interface RecipeTextInput {
  title: string;
  mode: string;
  servings: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
}

/**
 * Plain-text representation of a full recipe — used for both "Copy to
 * Clipboard" and the "Email Recipe" body, so the two stay identical. Reuses
 * the same dual-measurement formatting shown on screen (Prompt 6).
 */
export function formatRecipeAsText(recipe: RecipeTextInput): string {
  const lines: string[] = [];

  lines.push(formatRecipeName(recipe.title, recipe.mode));
  lines.push("");
  lines.push(`Serves ${recipe.servings}`);
  lines.push("");
  lines.push("Ingredients:");
  for (const ing of recipe.ingredients) {
    lines.push(`- ${formatDualMeasurement(ing.quantity, ing.unit)} ${ing.name}`);
  }
  lines.push("");
  lines.push("Directions:");
  recipe.steps.forEach((step, i) => {
    lines.push(`${i + 1}. ${annotateMeasurementsInText(step)}`);
  });

  return lines.join("\n");
}
