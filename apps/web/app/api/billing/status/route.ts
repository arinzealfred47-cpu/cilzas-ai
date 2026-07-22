import { auth } from "@clerk/nextjs/server";
import { getBillingStateForUser } from "@/lib/billing";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const billing = await getBillingStateForUser(userId);
  if (!billing) {
    return corsJson({ error: "Profile not found" }, { status: 404 });
  }

  return corsJson(billing);
}
