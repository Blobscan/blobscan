---
title: Background jobs
nextjs:
  metadata:
    title: Background jobs
    description: Blobscan background jobs
---

Blobscan requires [BullMQ](https://bullmq.io/) to run the following tasks in the background:

- `DailyStatsSyncer` - calculates metrics for the blobs, block and transactions charts.
- `OverallStatsSyncer` - calculates other metrics such as Total Tx Fees Saved, Total Blocks and Total Blobs.
- `SwarmStampSyncer` - updates TTL for Ethereum Swarm batches.

For more information, check out the [@blobscan/syncers](https://github.com/Blobscan/blobscan/tree/next/packages/syncers/src/syncers) package.

The BullMQ queue is also used to upload blobs in parallel to different Storages.
