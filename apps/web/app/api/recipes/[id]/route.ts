import { auth } from "@clerk/nextjs/server";
import { prisma } from "@repo/db";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // deleteMany (not delete) so a missing/not-owned id returns a clean 404
  // instead of Prisma throwing on a no-match delete.
  const result = await prisma.recipe.deleteMany({
    where: { id, clerkUserId: userId },
  });

  if (result.count === 0) {
    return corsJson({ error: "Recipe not found" }, { status: 404 });
  }

  return corsJson({ success: true });
}
