import Link from "next/link";

export function PolicyPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
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
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
          Effective {effectiveDate}
        </p>
      </div>
      <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
        {heading}
      </h2>
      {children}
    </section>
  );
}
