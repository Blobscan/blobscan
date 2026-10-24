---
"@blobscan/api": patch
"@blobscan/auth": patch
"@blobscan/db": patch
"@blobscan/docs": patch
"@blobscan/env": patch
"@blobscan/open-telemetry": patch
"@blobscan/rest-api-server": patch
"@blobscan/web": patch
"@blobscan/zod": patch
---

Resolve the remaining dependency advisories.

- Upgrade Next.js, Zod, ECharts, Turborepo, T3 env, and Prisma instrumentation
- Patch `trpc-openapi` for Zod 4 schema introspection and OpenAPI generation
- Patch generated Prisma Zod schemas for Zod 4 compatibility
- Migrate chart typings, env defaults, and generated error snapshots
