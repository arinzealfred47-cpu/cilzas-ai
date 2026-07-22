import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@repo/db";
import type { RecipeIngredientOutput } from "@repo/recipes";
import { getResend } from "@/lib/resend";
import { buildRecipeEmailHtml } from "@/lib/recipe-email";
import { corsJson, corsOptions } from "@/lib/cors";

const BodySchema = z.object({
  recipientEmail: z.string().email(),
});

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return corsJson(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id, clerkUserId: userId },
  });
  if (!recipe) {
    return corsJson({ error: "Recipe not found" }, { status: 404 });
  }

  const signUpUrl = `${req.nextUrl.origin}/get-app`;
  const html = buildRecipeEmailHtml(
    {
      title: recipe.title,
      servings: recipe.servings,
      ingredients: recipe.ingredients as unknown as RecipeIngredientOutput[],
      steps: recipe.steps as unknown as string[],
    },
    { imageDataUrl: recipe.imageDataUrl, signUpUrl },
  );

  try {
    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "",
      to: parsed.data.recipientEmail,
      subject: recipe.title,
      html,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("Recipe email send failed:", err);
    return corsJson(
      { error: "Could not send the email. Please try again." },
      { status: 502 },
    );
  }

  return corsJson({ success: true });
}
