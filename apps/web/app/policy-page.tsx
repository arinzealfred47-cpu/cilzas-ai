import Link from "next/link";

export function PolicyPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-16"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <Link href="/" className="text-sm" style={{ color: "var(--text-faint)" }}>
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </div>
  );
}
