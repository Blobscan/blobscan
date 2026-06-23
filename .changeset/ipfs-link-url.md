---
"@blobscan/db": patch
"@blobscan/web": patch
"@blobscan/rest-api-server": patch
---

Fix IPFS storage badge URL in blob explorer

The `blobDataStorageReference` computed `url` field was missing a case
for IPFS, so the IPFS badge in the blob list had no link. Add the
`IPFS` case returning `${gatewayUrl}/ipfs/${dataCid}` and wire
`IPFS_STORAGE_GATEWAY_URL` through the prisma clients in the web app
and REST API server.
