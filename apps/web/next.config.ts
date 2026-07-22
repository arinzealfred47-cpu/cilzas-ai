import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 7's generated ESM client (packages/db/generated/prisma) doesn't
  // bundle reliably under Turbopack — let Node resolve it directly instead.
  serverExternalPackages: ["@repo/db", "@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
