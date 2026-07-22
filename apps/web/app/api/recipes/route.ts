import { auth } from "@clerk/nextjs/server";
import { prisma } from "@repo/db";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const recipes = await prisma.recipe.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
  });

  return corsJson({ recipes });
}
