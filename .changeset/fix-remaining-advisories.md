---
"@blobscan/api": patch
"@blobscan/auth": patch
"@blobscan/blob-storage-manager": patch
"@blobscan/db": patch
"@blobscan/docs": patch
"@blobscan/env": patch
"@blobscan/open-telemetry": patch
"@blobscan/rest-api-server": patch
"@blobscan/web": patch
"@blobscan/zod": patch
---

Resolve the remaining dependency advisories.

- Upgrade Next.js, Zod, ECharts, Turborepo, T3 env, Prisma, and Prisma instrumentation
- Align Prisma Client and `@prisma/instrumentation` on 6.19.3
- Move Prisma CLI configuration to `prisma.config.ts` so Prisma 6 resolves the existing migrations directory
- Override Prisma's `deepmerge-ts` dependency with a patched version
- Handle Prisma 6 `Uint8Array` byte fields
- Patch `trpc-openapi` for Zod 4 schema introspection and OpenAPI generation
- Patch generated Prisma Zod schemas for Zod 4 compatibility
- Migrate chart typings, env defaults, and generated error snapshots
- Add regression coverage for env validation in Vitest/CI runs
