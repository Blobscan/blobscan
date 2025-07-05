---
title: Background jobs
nextjs:
  metadata:
    title: Background jobs
    description: Blobscan background jobs
---

Blobscan requires [BullMQ](https://bullmq.io/) to run the following tasks in the background:

- `DailyStatsCronJob` - calculates metrics for the blobs, block and transactions charts.
- `OverallStatsCronJob` - calculates other metrics such as Total Tx Fees Saved, Total Blocks and Total Blobs.
- `SwarmStampCronJob` - updates TTL for Ethereum Swarm batches.

For more information, check out the [@blobscan/jobs](https://github.com/Blobscan/blobscan/tree/main/apps/jobs) app.

The BullMQ queue is also used to upload blobs in parallel to different Storages.
