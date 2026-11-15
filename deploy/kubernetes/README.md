# Transaction backfill Job

Run one backfill Job beside the Blobscan services. The Job needs database and
execution RPC access. It does not need a Service, Ingress, or persistent volume.
Apply the database migrations before starting it. The image does not run
migrations or start an indexer.

## Build the image

CI builds and checks the image on pull requests. After merge to `main`, it
publishes `blossomlabs/blobscan-backfill:<full-commit-sha>` to Docker Hub with the
existing Docker Hub credentials. The CI image uses `linux/amd64`.

To build and push before merge, use a registry you can write to:

```sh
# Run from the repository root. Replace the registry and tag.
docker buildx build --platform linux/amd64 \
  -f Dockerfile.backfill \
  -t YOUR_REGISTRY/blobscan-backfill:YOUR_TAG --push .
```

Use `linux/arm64` instead if the selected Hetzner worker uses Arm. To check:

```sh
kubectl get nodes -L kubernetes.io/arch
```

The image uses Node 24 and a separate locked dependency set in
`docker/backfill`. Update that lockfile when changing Prisma or tsx. Only the
Prisma client generator runs at build time; no live database is needed. The
build context excludes environment files and other local files.

## Configure the Job

Copy `backfill-job.yaml` outside the repository for your deployment. Set its
image tag and inclusive `--from-block` / `--to-block` range. Use a small range
first. The three size options are independent:

| Option               | Default | Meaning                                            |
| -------------------- | ------- | -------------------------------------------------- |
| `--block-range-size` | 100     | Blocks per database read; no transaction cursor    |
| `--batch-size`       | 100     | Transactions per processing and atomic write batch |
| `--rpc-batch-size`   | 20      | RPC calls per HTTP request                         |

Create a Secret named `blobscan-backfill` in the same namespace as the Job.
Use your existing secret management system, or a local file containing only
`DATABASE_URL=...` and `EXECUTION_RPC_URL=...`:

```sh
kubectl -n blobscan create secret generic blobscan-backfill \
  --from-env-file=/secure/path/backfill.env
```

Keep this file out of Git. Use a database endpoint reachable from the cluster,
such as its Kubernetes Service DNS name. The RPC must serve historical
transactions, receipts, and block headers, and accept JSON-RPC batches. Network
policies must permit the Job to reach DNS, PostgreSQL, and that RPC endpoint.
If using a private registry, add the required `imagePullSecrets` to the pod spec.

## Start and monitor

```sh
kubectl -n blobscan apply -f /path/to/backfill-job.yaml
kubectl -n blobscan logs -f job/blobscan-transaction-backfill
kubectl -n blobscan get job blobscan-transaction-backfill
kubectl -n blobscan get pods -l job-name=blobscan-transaction-backfill
```

You can close the terminal or laptop. The cluster keeps the Job running. Logs
show block reads, RPC batches and retry waits, validation progress, and committed
write batches. Use the pod name with `kubectl logs` to inspect a failed attempt.

The Job runs one pod at a time and allows three retries after failures. RPC
requests also have bounded retries, exponential backoff, and `Retry-After`
support. Completed records stay in PostgreSQL. A restart scans the configured
range again and skips complete records in memory; there is no saved block
checkpoint. A failed atomic write batch is rolled back and remains eligible
for the next run.

The manifest has no total execution deadline and does not delete finished pods
automatically. Inspect completion and logs before deleting the Job. To stop:

```sh
kubectl -n blobscan delete job blobscan-transaction-backfill
```

To rerun or change the range, delete the old Job, edit your copy, then apply it
again. Do not run overlapping backfill Jobs. Keep the existing service workloads
running; adjust the batch sizes and resource limits if database or RPC load is
too high.
