import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    // Prisma CLI commands (migrations, introspection) must use the direct
    // connection, falling back to DATABASE_URL when DIRECT_URL is not set. The
    // application runtime uses DATABASE_URL through the pg driver adapter.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/main.ts",
  },
});
