import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Prisma } from "@repo/db";
import { AnalyzeImageRequestSchema, scanForHealthFlags } from "@repo/recipes";
import { analyzeRecipeImage, generateDishImage } from "@/lib/recipe-orchestrator";
import { getBillingStateForUser } from "@/lib/billing";
import { corsJson, corsOptions } from "@/lib/cors";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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

  const contentType = req.headers.get("content-type") ?? "";
  let dataUrl: string;

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const parsed = AnalyzeImageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return corsJson(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { image, mimeType } = parsed.data;
    dataUrl = image.startsWith("data:")
      ? image
      : `data:${mimeType ?? "image/jpeg"};base64,${image}`;
  } else if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await req.arrayBuffer());
    dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
  } else {
    return corsJson(
      {
        error:
          "Unsupported content type. Send JSON { image } or a raw image/* body.",
      },
      { status: 400 },
    );
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    return corsJson({ error: "Invalid image data." }, { status: 400 });
  }

  const [, , base64Data] = match;
  const approxBytes = (base64Data.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    return corsJson(
      { error: "Image too large (max 8MB)." },
      { status: 400 },
    );
  }

  let recipe;
  try {
    recipe = await analyzeRecipeImage(dataUrl);
  } catch (err) {
    console.error("Recipe image analysis failed:", err);
    return corsJson(
      { error: "Recipe analysis failed. Please try again." },
      { status: 502 },
    );
  }

  // Post-processor: cross-examine ingredients for unhealthy vectors before
  // this recipe is ever sent to the frontend.
  const healthFlags = scanForHealthFlags(recipe.ingredients);

  // Best-effort — a failed image generation should never fail the recipe
  // itself, since the text recipe already succeeded. This is a freshly
  // generated illustrative photo, not the user's uploaded photo.
  let imageDataUrl: string | null = null;
  try {
    imageDataUrl = await generateDishImage(recipe.title);
  } catch (err) {
    console.error("Dish image generation failed:", err);
  }

  const saved = await prisma.recipe.create({
    data: {
      clerkUserId: userId,
      mode: "image",
      title: recipe.title,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      // Not storing the user's uploaded photo — would bloat the table for no
      // functional benefit; a marker is enough to know how this row was made.
      inputPayload: { mode: "image" },
      healthFlags: healthFlags as unknown as Prisma.InputJsonValue,
      imageDataUrl,
    },
  });

  return corsJson({ recipe: saved });
}
