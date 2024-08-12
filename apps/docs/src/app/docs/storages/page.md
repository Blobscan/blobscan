---
title: Available storages
nextjs:
  metadata:
    title: Available storages
    description: Supported storages for blobs
---

## Blob storages

Blobscan can be configured to use any of the following blob storages:

- Postgres
- Google Cloud Storage
- Ethereum Swarm
- File system

By default all storages are disabled and you must enable at least one in order to run Blobscan.

Note that the database size can grow quickly. For this reason, it is not recommended to choose Postgres in production.
