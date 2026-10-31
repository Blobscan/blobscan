---
"@blobscan/db": major
"@blobscan/api": patch
"@blobscan/blob-storage-manager": patch
"@blobscan/open-telemetry": patch
"@blobscan/web": patch
"@blobscan/rest-api-server": patch
"@blobscan/docs": patch
---

Migrate the Prisma runtime and tooling to Prisma 7.

- Generate the client with the `prisma-client` generator and the required `@prisma/adapter-pg` driver adapter.
- Move datasource configuration and migrations to `prisma.config.ts`, and keep generated clients out of version control.
- Replace the removed Prisma `$metrics` client with Prometheus query count and duration metrics.
- Update Docker migration setup so Prisma 7 discovers `prisma.config.ts`, the schema, and the migrations.
- Keep Zod generation multi-file so generated imports resolve correctly with Prisma 7.
