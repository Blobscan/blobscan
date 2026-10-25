---
"@blobscan/api": minor
"@blobscan/blob-storage-manager": patch
"@blobscan/db": patch
"@blobscan/rest-api-server": patch
"@blobscan/web": patch
---

Migrated the API to tRPC 11 and replaced `trpc-openapi` with `trpc-to-openapi`. Updated the web client to tRPC 11 and React Query 5, removed the temporary `trpc-openapi` patch, and aligned binary/seed data with the TypeScript 5.9 buffer types.
