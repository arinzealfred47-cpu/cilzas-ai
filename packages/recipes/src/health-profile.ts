export type HealthVector = "sugar" | "processedOil" | "transFat";

export interface HealthFlag {
  ingredientName: string;
  vectors: HealthVector[];
}

// Simple keyword heuristic, not nutritional or medical advice — e.g. "vegetable oil"
// always flags as processedOil regardless of actual quality/refinement. Intentionally
// simple: fast, free, deterministic, no extra API call per generation.
const VECTOR_KEYWORDS: Record<HealthVector, string[]> = {
  sugar: [
    "sugar",
    "corn syrup",
    "high fructose corn syrup",
    "cane syrup",
    "agave",
    "syrup",
    "sucrose",
    "dextrose",
    "fructose",
    "maltose",
  ],
  processedOil: [
    "vegetable oil",
    "canola oil",
    "soybean oil",
    "corn oil",
    "palm oil",
    "margarine",
    "shortening",
  ],
  transFat: ["hydrogenated", "partially hydrogenated", "shortening", "margarine"],
};

const VECTORS = Object.keys(VECTOR_KEYWORDS) as HealthVector[];

export function scanForHealthFlags(
  ingredients: { name: string }[],
): HealthFlag[] {
  const flags: HealthFlag[] = [];

  for (const ingredient of ingredients) {
    const lower = ingredient.name.toLowerCase();
    const matchedVectors = VECTORS.filter((vector) =>
      VECTOR_KEYWORDS[vector].some((keyword) => lower.includes(keyword)),
    );

    if (matchedVectors.length > 0) {
      flags.push({ ingredientName: ingredient.name, vectors: matchedVectors });
    }
  }

  return flags;
}
