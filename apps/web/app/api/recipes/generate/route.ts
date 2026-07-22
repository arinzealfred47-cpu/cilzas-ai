import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Prisma } from "@repo/db";
import { RecipeRequestSchema, scanForHealthFlags } from "@repo/recipes";
import { generateRecipe, generateDishImage } from "@/lib/recipe-orchestrator";
import { getBillingStateForUser } from "@/lib/billing";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const billing = await getBillingStateForUser(userId);
  if (!billing || billing.state === "locked") {
    return corsJson({ error: "Subscription required", billingState: "locked" }, { status: 402 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RecipeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return corsJson(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  let recipe;
  try {
    recipe = await generateRecipe(parsed.data);
  } catch (err) {
    console.error("Recipe generation failed:", err);
    return corsJson(
      { error: "Recipe generation failed. Please try again." },
      { status: 502 },
    );
  }

  // Post-processor: cross-examine ingredients for unhealthy vectors before
  // this recipe is ever sent to the frontend.
  const healthFlags = scanForHealthFlags(recipe.ingredients);

  // Best-effort — a failed image generation should never fail the recipe
  // itself, since the text recipe already succeeded.
  let imageDataUrl: string | null = null;
  try {
    imageDataUrl = await generateDishImage(recipe.title);
  } catch (err) {
    console.error("Dish image generation failed:", err);
  }

  const saved = await prisma.recipe.create({
    data: {
      clerkUserId: userId,
      mode: parsed.data.mode,
      title: recipe.title,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      inputPayload: parsed.data,
      healthFlags: healthFlags as unknown as Prisma.InputJsonValue,
      imageDataUrl,
    },
  });

  return corsJson({ recipe: saved });
}
