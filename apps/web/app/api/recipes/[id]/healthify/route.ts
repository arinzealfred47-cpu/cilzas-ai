import { auth } from "@clerk/nextjs/server";
import { prisma, Prisma } from "@repo/db";
import {
  scanForHealthFlags,
  type HealthFlag,
  type RecipeIngredientOutput,
  type RecipeOutput,
} from "@repo/recipes";
import { healthifyRecipe } from "@/lib/recipe-orchestrator";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const original = await prisma.recipe.findFirst({
    where: { id, clerkUserId: userId },
  });

  if (!original) {
    return corsJson({ error: "Recipe not found" }, { status: 404 });
  }

  const existingFlags = (original.healthFlags as unknown as HealthFlag[]) ?? [];
  if (existingFlags.length === 0) {
    return corsJson(
      { error: "This recipe has no flagged ingredients." },
      { status: 400 },
    );
  }

  const originalOutput: RecipeOutput = {
    title: original.title,
    servings: original.servings,
    ingredients: original.ingredients as unknown as RecipeIngredientOutput[],
    steps: original.steps as unknown as string[],
  };

  let healthy;
  try {
    healthy = await healthifyRecipe(originalOutput, existingFlags);
  } catch (err) {
    console.error("Recipe healthify failed:", err);
    return corsJson(
      { error: "Could not generate a healthy version. Please try again." },
      { status: 502 },
    );
  }

  const newFlags = scanForHealthFlags(healthy.ingredients);

  const saved = await prisma.recipe.create({
    data: {
      clerkUserId: userId,
      mode: "healthified",
      title: healthy.title,
      servings: healthy.servings,
      ingredients: healthy.ingredients,
      steps: healthy.steps,
      inputPayload: { basedOnRecipeId: original.id },
      healthFlags: newFlags as unknown as Prisma.InputJsonValue,
      basedOnRecipeId: original.id,
    },
  });

  return corsJson({ recipe: saved });
}
