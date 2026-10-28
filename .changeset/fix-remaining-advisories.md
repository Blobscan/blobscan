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
- Override Prisma's `deepmerge-ts` dependency with the fixed `8.0.2` release
- Handle Prisma 6 `Uint8Array` byte fields
- Replace the unmaintained `zod-prisma` generator with `zod-prisma-types` for native Zod 4 support and update API imports to the generated `*Schema` names
- Migrate chart typings, env defaults, and generated error snapshots
- Add regression coverage for env validation in Vitest/CI runs
