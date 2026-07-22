// Public and unauthenticated on purpose — by the time this renders, the
// Clerk identity that reached this page no longer exists.
export default async function AccountDeletedPage({
  searchParams,
}: {
  searchParams: Promise<{ refund?: string }>;
}) {
  const { refund } = await searchParams;

  if (refund === "denied_window_expired") {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Refund Denied</h1>
        <p className="error-box">
          Your most recent payment was made more than 28 days ago, so it's no longer eligible for an
          automatic refund.
        </p>
        <p className="text-sm text-white/60">
          Your account and all associated data have still been permanently deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Account deleted</h1>
      <p className="text-sm text-white/60">
        {refund === "approved"
          ? "Your account and all associated data have been permanently deleted, and your most recent payment has been refunded."
          : "Your account and all associated data have been permanently deleted."}
      </p>
    </div>
  );
}
