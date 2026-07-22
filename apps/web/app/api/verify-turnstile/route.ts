export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token || typeof token !== "string") {
    return Response.json({ success: false }, { status: 400 });
  }

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  );

  const data = (await verifyRes.json()) as { success: boolean };

  if (!data.success) {
    return Response.json({ success: false }, { status: 400 });
  }

  return Response.json({ success: true });
}
