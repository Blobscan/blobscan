import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    // Prisma CLI commands (migrations, introspection) must use the direct
    // connection. The application runtime uses DATABASE_URL through the pg
    // driver adapter.
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/main.ts",
  },
});
