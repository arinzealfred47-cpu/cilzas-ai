import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` (run from packages/db's postinstall script) doesn't
// need a real database connection — only `migrate`/`db push` do. The
// fallback here keeps `generate` working in environments (like a fresh
// Vercel install) where DATABASE_URL hasn't been set yet.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
