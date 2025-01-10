---
title: Available storages
nextjs:
  metadata:
    title: Available storages
    description: Supported storages for blobs
---

## Blob storages

Blobscan can be configured to use any of the following blob storages:

- [Ethereum Swarm](https://www.ethswarm.org/)
- File system
- Google Cloud Storage
- Postgres
- [Weavevm](https://www.wvm.dev/) (currently supports blob reading only)

By default all storages are disabled and you must enable at least one in order to run Blobscan. This is done using [environment variables](/docs/environment).

Note that the database size can grow quickly. For this reason, it is not recommended to choose Postgres in production.
