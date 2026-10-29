---
"@blobscan/rest-api-server": patch
---

Replace `@vercel/ncc` with esbuild for the REST API production bundle. The ncc bundle of the tRPC 11 migration crashed at boot with `__webpack_modules__[w].call is not a function`.
