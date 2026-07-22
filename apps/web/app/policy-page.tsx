import Link from "next/link";

export function PolicyPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 bg-black px-4 py-16 text-white">
      <Link href="/" className="text-sm text-white/50 hover:text-white">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="text-sm leading-relaxed text-white/70">{children}</div>
    </div>
  );
}
