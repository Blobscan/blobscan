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
- [Load Network (prev. WeaveVM)](https://www.load.network) (currently supports blob reading only)
- Google Cloud Storage
- PostgreSQL

By default all storages are disabled and you must enable at least one in order to run Blobscan. This is done using [environment variables](/docs/environment).

Note that the database size can grow quickly. For this reason, it is not recommended to choose PostgreSQL in production.
