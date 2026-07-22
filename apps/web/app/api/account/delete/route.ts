import { auth } from "@clerk/nextjs/server";
import { runTotalWipeoutProtocol } from "@/lib/account-wipeout";
import { corsJson, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return corsJson({ error: "Unauthorized" }, { status: 401 });
  }

  const { refund } = await runTotalWipeoutProtocol(userId, { attemptRefund: true });
  return corsJson({ refund });
}
