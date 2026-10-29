---
"@blobscan/rest-api-server": patch
"@blobscan/web": patch
---

Fix the `web` and `api` images crashing at start with `Cannot find module 'effect'`: copy the runtime dependencies of the Prisma 6.19 CLI that runs `migrate deploy`
