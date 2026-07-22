import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@repo/db";
import { getDodo, productIdForPlan } from "@/lib/dodo";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) {
    return corsJson({ error: "Profile not found" }, { status: 404 });
  }

  // Billing processor is fixed by signup platform for the account's whole
  // lifetime — a non-web signup can never check out through Dodo.
  if (profile.signupPlatform !== "WEB") {
    return corsJson({ error: "This account subscribes through its mobile app." }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const plan = formData?.get("plan");
  const resolvedPlan = plan === "ANNUAL" ? "ANNUAL" : "MONTHLY";

  const productId = productIdForPlan(resolvedPlan);
  if (!productId) {
    return corsJson({ error: "Billing is not configured yet." }, { status: 500 });
  }

  const origin = req.nextUrl.origin;

  const session = await getDodo().checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email: profile.email },
    metadata: { clerkUserId: userId },
    return_url: `${origin}/dashboard`,
  });

  if (!session.checkout_url) {
    return corsJson({ error: "Could not start checkout." }, { status: 502 });
  }

  return Response.redirect(session.checkout_url, 303);
}
