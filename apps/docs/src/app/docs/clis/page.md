---
title: Command line interface
nextjs:
  metadata:
    title: Command line interface
    description: Blobscan CLI
---

Blobscan offers the following commands:

- [`@blobscan/blob-propagation-jobs-cli`](https://github.com/Blobscan/blobscan/tree/main/clis/blob-propagation-jobs-cli): to run the blob propagation jobs.

## Blob propagation

You can use the blob propagation CLI to propagate blobs across different storage systems. There are three commands available: `create`, `remove`, and `retry`.

To run the CLI, use the following command:

```bash
cd clis/blob-propagation-jobs-cli
pnpm start <command>
```

### Create Command

Following is the usage guide for the `create` command:

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

Following is the usage guide for the `remove` command:

```bash
Remove Command

  Removes failed jobs.

Options

  -h, --help                 Print this usage guide.
  -q, --queue queue          Queue to remove failed jobs from. Valid values are
                             finalizer, google, postgres or swarm.
  -b, --blobHash blob-hash   Blob hash of the failed jobs to retry.
  -f, --force                Force removal of jobs by obliterating the selected
                             queues.
```

### Retry Command

Following is the usage guide for the `retry` command:

```bash
Retry Command

  Retries failed jobs.

Options

  -h, --help                 Print this usage guide.
  -q, --queue queue          Queue to retry failed jobs from. Valid values are
                             finalizer, google, postgres or swarm.
  -b, --blobHash blob-hash   Blob hash of the failed jobs to retry.
```
