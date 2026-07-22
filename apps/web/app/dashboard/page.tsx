import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">
        Welcome{user?.primaryEmailAddress ? `, ${user.primaryEmailAddress.emailAddress}` : ""}
      </h1>
      <p className="text-sm text-white/60">
        You&apos;re signed in. This is a placeholder home page.
      </p>
      <Link href="/dashboard/recipes" className="text-white underline hover:text-white/70">
        Recipe Generator
      </Link>
      <Link href="/settings" className="text-white underline hover:text-white/70">
        Settings
      </Link>
    </div>
  );
}
