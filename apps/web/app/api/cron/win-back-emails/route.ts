import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getResend } from "@/lib/resend";
import { createWinbackToken } from "@/lib/winback-token";
import { buildWinbackEmailHtml } from "@/lib/winback-email";

const TRIAL_DAYS = 3; // mirrors apps/web/lib/billing.ts
const RESEND_INTERVAL_DAYS = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const trialCutoff = new Date(now.getTime() - TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const resendCutoff = new Date(now.getTime() - RESEND_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  // Mirrors billing.ts's "locked" predicate (trial over, no paid access)
  // re-expressed as a Prisma where clause, plus the every-3-days gate.
  const profiles = await prisma.profile.findMany({
    where: {
      trialStartDate: { lt: trialCutoff },
      OR: [
        { subscriptionStatus: { in: ["NONE", "EXPIRED"] } },
        { subscriptionStatus: "CANCELED", subscriptionCurrentPeriodEnd: { lt: now } },
      ],
      AND: [
        { OR: [{ lastWinbackEmailSentAt: null }, { lastWinbackEmailSentAt: { lt: resendCutoff } }] },
      ],
    },
  });

  const origin = req.nextUrl.origin;
  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      const token = createWinbackToken(profile.clerkUserId);
      const checkoutUrl = `${origin}/billing/resume?token=${encodeURIComponent(token)}`;

      const { error } = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "",
        to: profile.email,
        subject: "Your trial has ended",
        html: buildWinbackEmailHtml(checkoutUrl),
      });

      if (error) throw new Error(error.message);

      await prisma.profile.update({
        where: { id: profile.id },
        data: { lastWinbackEmailSentAt: now },
      });
      sent += 1;
    } catch (err) {
      // One bad send/address shouldn't abort the batch — log and continue,
      // this profile is simply picked up again on the next cron run.
      console.error(`Win-back email failed for profile ${profile.id}:`, err);
      failed += 1;
    }
  }

  return Response.json({ processed: profiles.length, sent, failed });
}
