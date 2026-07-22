import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// A signed, opaque link identifier — NOT an auth credential. Its only job is
// to let /billing/resume look up whose signupPlatform to check against the
// device the link was clicked on. It grants no elevated access and never
// itself initiates a charge; a device match just redirects to /dashboard,
// where the real Clerk-authenticated checkout flow takes over.
function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(payload: string): string {
  const secret = process.env.WINBACK_LINK_SECRET ?? "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createWinbackToken(clerkUserId: string): string {
  const payload = base64url(
    Buffer.from(JSON.stringify({ uid: clerkUserId, exp: Date.now() + TOKEN_TTL_MS })),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyWinbackToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof uid !== "string" || typeof exp !== "number" || Date.now() > exp) {
      return null;
    }
    return uid;
  } catch {
    return null;
  }
}
