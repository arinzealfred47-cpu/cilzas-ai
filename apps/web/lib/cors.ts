// Permissive CORS for the /api/recipes/* JSON API — it's Bearer-token
// authenticated (no cookies), so a wide-open origin doesn't expose anything;
// this just lets the Expo web target call it directly during development.
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsJson(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...init?.headers },
  });
}

export function corsOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
