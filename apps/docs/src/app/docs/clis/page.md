---
title: Command line interface
nextjs:
  metadata:
    title: Command line interface
    description: Blobscan CLI
---

Blobscan offers the following commands:

- [`@blobscan/blob-propagation-jobs-cli`](https://github.com/Blobscan/blobscan/tree/next/clis/blob-propagation-jobs-cli): to run the blob propagation jobs.
- [`@blobscan/stats-aggregation-cli`](https://github.com/Blobscan/blobscan/tree/next/clis/stats-aggregation-cli): to run the stats aggregation jobs.

## Blob propagation

You can use the blob propagation CLI to propagate blobs across different storage systems. There are three commands available: `create`, `remove`, and `retry`.

To run the CLI, use the following command:

```bash
cd clis/blob-propagation-jobs-cli
pnpm start <command>
```

### Create Command

Following is the usage guide for the create command:

```bash
Create Command

  Create propagation jobs for blobs.

Options

  -h, --help                 Print this usage guide.
  -b, --blobHash blob-hash   Blob hash of the blobs to create jobs for.
  -s, --storage storage      Storage used to propagate the selected blobs.
                             Valid values are google, postgres or swarm.
  -f, --from from            Date from which to retrieve blobs to create jobs
                             for.
  -t, --to to                Date to which to retrieve blobs to create jobs
                             for.
```

### Remove Command

Following is the usage guide for the remove command:

```bash
Remove Command

  Removes failed jobs.

Options

  -h, --help                 Print this usage guide.
  -q, --queue queue          Queue to retry failed jobs from. Valid values are
                             finalizer, google, postgres or swarm.
  -b, --blobHash blob-hash   Blob hash of the failed jobs to retry.
  -f, --force                Force removal of jobs by obliterating the selected
                             queues.
```

### Retry Command

Following is the usage guide for the retry command:

```bash
Retry Command

  Retries failed jobs.

Options

  -h, --help                 Print this usage guide.
  -q, --queue queue          Queue to retry failed jobs from. Valid values are
                             finalizer, google, postgres or swarm.
  -b, --blobHash blob-hash   Blob hash of the failed jobs to retry.
```

## Stats aggregation

You can use the stats aggregation CLI to aggregate daily and overall stats. There are two commands available: `daily`, `overall`.

To run the CLI, use the following command:

```bash
cd clis/stats-aggregation-cli
pnpm start <command>
```

### Daily Command

Following is the usage guide for the daily command:

```bash
Daily Command

  Aggregate daily stats.

Options

  -d, --delete        Delete existing stats.
  -h, --help          Print this usage guide.
  -e, --entity type   Entity type to aggregate. Valid values are blob, block or
                      tx.
  -f, --from date     Start date in ISO 8601 format.
  -t, --to date       End date in ISO 8601 format.

```

### Overall Command

Following is the usage guide for the overall command:

```bash
Overall Command

  Aggregate overall stats.

Options

  -d, --delete           Delete existing stats.
  -h, --help             Print this usage guide.
  -t, --to block-id      Block identifier up to which to aggregate data. It can
                         be a block number, "latest" for the last indexed
                         block or "finalized"  for the chain's most recent
                         finalized block. It defaults to "finalized"
  -s, --batchSize size   Number of blocks to process in a single batch. It
                         defaults to 100000
```
