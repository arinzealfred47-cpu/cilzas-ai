// The Future-API `{ error }` return is typed as a flat `ClerkError`, but at
// runtime Clerk API validation failures come back as a `ClerkAPIResponseError`
// with the field-level code nested in `errors[0].code` — the top-level `code`
// is just the generic wrapper `"api_response_error"`. Confirmed against a live
// Clerk instance; checking `error.code` directly never matches.
export function clerkErrorCode(error: unknown): string | undefined {
  const err = error as
    | { code?: string; errors?: { code?: string }[] }
    | null
    | undefined;
  return err?.errors?.[0]?.code ?? err?.code;
}

export function clerkErrorMessage(error: unknown): string {
  const err = error as
    | { message?: string; longMessage?: string; errors?: { message?: string; longMessage?: string }[] }
    | null
    | undefined;
  const first = err?.errors?.[0];
  return first?.longMessage ?? first?.message ?? err?.longMessage ?? err?.message ?? "Something went wrong.";
}
