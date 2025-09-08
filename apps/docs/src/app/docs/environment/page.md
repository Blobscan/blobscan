---
title: Environment variables
nextjs:
  metadata:
    title: Environment variables
    description: How to configure your Blobscan instance
---

## Blobscan Web

| Variable                               | Description                                                                                 | Required | Default value              |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | -------- | -------------------------- |
| `BLOB_DATA_API_KEY`                    | API key used to authenticate requests to retrieve blob data from the Blobscan API           | No       | (empty)                    |
| `DATABASE_URL`                         | PostgreSQL database URI                                                                     | Yes      | (empty)                    |
| `DIRECT_URL`                           | Direct connection to the database used by Prisma CLI for e.g. migrations.                   | Yes      | (empty)                    |
| `FEEDBACK_WEBHOOK_URL`                 | Discord webhook URL for feedback                                                            | No       | (empty)                    |
| `PUBLIC_NETWORK_NAME`                  | Network name                                                                                | No       | mainnet                    |
| `PUBLIC_EXPLORER_BASE_URL`             | Block explorer URL                                                                          | No       | `https://etherscan.io`     |
| `PUBLIC_BEACON_BASE_URL`               | Beacon explorer URL                                                                         | No       | `https://beaconcha.in/`    |
| `NEXT_PUBLIC_BLOBSCAN_RELEASE`         | Blobscan version                                                                            | No       | (empty)                    |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` | Enable Vercel analytics                                                                     | No       | `false`                    |
| `PUBLIC_SENTRY_DSN_WEB`                | Sentry DSN                                                                                  | No       | (empty)                    |
| `NODE_ENV`                             | Used in Node.js applications to specify the environment in which the application is running | No       | (empty)                    |
| `SENTRY_PROJECT`                       | Sentry project name                                                                         | No       | (empty)                    |
| `SENTRY_ORG`                           | Sentry organization                                                                         | No       | (empty)                    |
| `METRICS_ENABLED`                      | Expose the /metrics endpoint                                                                | No       | `false`                    |
| `TRACES_ENABLED`                       | Enable instrumentation of functions and sending traces to a collector                       | No       | `false`                    |
| `PUBLIC_POSTHOG_ID`                    | PostHog project API key used for tracking events and analytics                              | No       | (empty)                    |
| `PUBLIC_POSTHOG_HOST`                  | Host URL for the PostHog instance used for analytics tracking                               | No       | `https://us.i.posthog.com` |

## Blobscan API

| Variable                                               | Description                                                                                               | Required                        | Default value                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------- |
| `BLOB_DATA_API_ENABLED`                                | Controls whether the blob data API endpoint is enabled                                                    | No                              | `true`                                       |
| `BLOB_DATA_API_KEY`                                    | API key used to authenticate requests to retrieve blob data from the blobscan API                         | No                              | (empty)                                      |
| `CHAIN_ID`                                             | EVM chain id                                                                                              | Yes                             | `1`                                          |
| `DATABASE_URL`                                         | Postgresql database URI                                                                                   | Yes                             | (empty)                                      |
| `DIRECT_URL`                                           | Direct connection to the database used by Prisma CLI for e.g. migrations.                                 | Yes                             | (empty)                                      |
| `REDIS_URI`                                            | Redis host                                                                                                | Yes                             | `redis://localhost:6379/1`                   |
| `SECRET_KEY`                                           | Shared key used for JWT authentication with the indexer                                                   | Yes                             | (empty)                                      |
| `NETWORK_NAME`                                         | Network's name (valid values are: `mainnet`, `holesky`, `hoodi`, `sepolia`, `gnosis`, `chiado`, `devnet`) | No                              | `mainnet`                                    |
| `BLOBSCAN_API_BASE_URL`                                | API domain                                                                                                | No                              | `http://localhost:3001`                      |
| `BLOBSCAN_API_PORT`                                    | API port                                                                                                  | No                              | `3001`                                       |
| `DENCUN_FORK_SLOT`                                     | Custom slot when blobs are activated (use when `NETWORK_NAME=devnet`)                                     | No                              | (empty)                                      |
| `METRICS_ENABLED`                                      | Expose the /metrics endpoint                                                                              | No                              | `false`                                      |
| `TRACES_ENABLED`                                       | Enable instrumentation of functions and sending traces to a collector                                     | No                              | `false`                                      |
| `NODE_ENV`                                             | Used in Node.js applications to specify the environment in which the application is running               | No                              | (empty)                                      |
| `SENTRY_DSN_API`                                       | Sentry DSN                                                                                                | No                              | (empty)                                      |
| `PRIMARY_BLOB_STORAGE`                                 | Storage where blobs are initially stored before being propagated to other storages                        | No                              | postgres                                     |
| `GOOGLE_SERVICE_KEY`                                   | Google Cloud service key                                                                                  | No                              | (empty)                                      |
| `GOOGLE_STORAGE_ENABLED`                               | Store blobs in Google Cloud Storage                                                                       | No                              | `false`                                      |
| `GOOGLE_STORAGE_API_ENDPOINT`                          | Google Cloud API endpoint (for development)                                                               | No                              | (empty)                                      |
| `GOOGLE_STORAGE_BUCKET_NAME`                           | Google Cloud Storage bucket name                                                                          | No                              | (empty)                                      |
| `GOOGLE_STORAGE_PROJECT_ID`                            | Google Cloud project ID                                                                                   | No                              | (empty)                                      |
| `POSTGRES_STORAGE_ENABLED`                             | Store blobs in postgres database (default storage)                                                        | No                              | `false`                                      |
| `SWARM_DEFERRED_UPLOAD`                                | Determines if the uploaded data should be sent to the network immediately or in a deferred fashion        | No                              | `true`                                       |
| `SWARM_STORAGE_ENABLED`                                | Store blobs in Ethereum Swarm                                                                             | No                              | `false`                                      |
| `SWARM_BATCH_ID`                                       | Batch ID of the Ethereum Swarm stamp                                                                      | If `SWARM_STORAGE_ENABLED=true` | (empty)                                      |
| `BEE_ENDPOINT`                                         | Bee endpoint                                                                                              | No                              | (empty)                                      |
| `SWARM_CHUNKSTORM_ENABLED`                             | Use Chunkstorm to distribute chunks among multiple nodes (increases upload speed)                         | No                              | `false`                                      |
| `SWARM_CHUNKSTORM_URL`                                 | Chunkstorm server API base url                                                                            | No                              | (empty)                                      |
| `S3_STORAGE_ENABLED`                                   | Store blobs in AWS S3 or compatible storage                                                               | No                              | `false`                                      |
| `S3_STORAGE_REGION`                                    | AWS region for S3 storage                                                                                 | If `S3_STORAGE_ENABLED=true`    | (empty)                                      |
| `S3_STORAGE_BUCKET_NAME`                               | S3 bucket name for blob storage                                                                           | If `S3_STORAGE_ENABLED=true`    | (empty)                                      |
| `S3_STORAGE_ACCESS_KEY_ID`                             | AWS access key ID for S3 authentication                                                                   | No                              | (empty)                                      |
| `S3_STORAGE_SECRET_ACCESS_KEY`                         | AWS secret access key for S3 authentication                                                               | No                              | (empty)                                      |
| `S3_STORAGE_ENDPOINT`                                  | Custom S3 endpoint URL (for S3-compatible services like MinIO, DigitalOcean Spaces, etc.)                 | No                              | (empty)                                      |
| `S3_STORAGE_FORCE_PATH_STYLE`                          | Forces path-style addressing for S3 URLs (required for some S3-compatible services)                       | No                              | `false`                                      |
| `WEAVEVM_STORAGE_ENABLED`                              | Weavevm storage usage                                                                                     | No                              | `false`                                      |
| `WEAVEVM_STORAGE_API_BASE_URL`                         | Weavevm API base url                                                                                      | No                              | `https://blobscan.wvm.network`               |
| `WEAVEVM_API_KEY`                                      | API key required to authenticate requests to the WeaveVM blob storage reference updater endpoint          | No                              | (empty)                                      |
| `STATS_SYNCER_DAILY_CRON_PATTERN`                      | Cron pattern for the daily stats job                                                                      | No                              | `30 0 * * * *`                               |
| `STATS_SYNCER_OVERALL_CRON_PATTERN`                    | Cron pattern for the overall stats job                                                                    | No                              | `*/15 * * * *`                               |
| `ETH_PRICE_SYNCER_ENABLED`                             | Enable the ETH price syncer job                                                                           | No                              | `false`                                      |
| `ETH_PRICE_SYNCER_CRON_PATTERN`                        | Cron pattern for the job that periodically stores ETH price in database                                   | No                              | `* * * * *` (every minute)                   |
| `ETH_PRICE_SYNCER_CHAIN_ID`                            | ID of the chain where price feed contract is deployed on (default is Polygon)                             | No                              | `137`                                        |
| `ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL`                  | RPC endpoint for the chain specified in ETH_PRICE_SYNCER_CHAIN_ID (e.g., Polygon RPC)                     | Yes                             | (empty)                                      |
| `ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS` | Contract address for the Chainlink ETH/USD price feed on the specified chain                              | No                              | `0xF9680D99D6C9589e2a93a78A04A279e509205945` |
| `ETH_PRICE_SYNCER_TIME_TOLERANCE`                      | Maximum allowed age (in seconds) of the fetched price before it's considered stale                        | No                              |                                              |
| `SWARM_STAMP_CRON_PATTERN`                             | Cron pattern for swarm job                                                                                | No                              | `*/15 * * * *`                               |
| `BLOB_PROPAGATOR_COMPLETED_JOBS_AGE`                   | Remove completed jobs after the specified number of seconds (default: 1 day)                              | No                              | `86400`                                      |
| `BLOB_PROPAGATOR_FAILED_JOBS_AGE`                      | Remove completed jobs after the specified number of seconds (default: 7 days)                             | No                              | `604800`                                     |
| `BLOB_RECONCILER_CRON_PATTERN`                        | Cron pattern for the blob reconciler worker                                                              | No                              | `0 * * * *` (every 1 hour)                   |
| `BLOB_RECONCILER_BATCH_SIZE`                          | Maximum number of blobs to process during each run                                                        | No                              | 200                                          |
| `VITEST_MAINNET_FORK_URL`                              | Mainnet JSON-RPC URL used for starting a local Anvil instance to run tests against                        | No                              | `https://eth.llamarpc.com`                   |

## Blobscan indexer

| Variable                  | Description                                                                                                                                            | Required | Default value       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------- |
| `BEACON_NODE_ENDPOINT`    | Beacon node RPC endpoint                                                                                                                               | Yes      | (empty)             |
| `BLOBSCAN_API_ENDPOINT`   | Blobscan API endpoint                                                                                                                                  | Yes      | (empty)             |
| `EXECUTION_NODE_ENDPOINT` | Execution node RPC endpoint                                                                                                                            | Yes      | (empty)             |
| `SECRET_KEY`              | Shared key used for JWT authentication with API                                                                                                        | Yes      | (empty)             |
| `NETWORK_NAME`            | Automatically start from the slot when blobs were activated (valid values are: `mainnet`, `holesky`, `hoodi`, `sepolia`, `gnosis`, `chiado`, `devnet`) | No       | `mainnet`           |
| `DENCUN_FORK_SLOT`        | Custom slot when blobs are activated (use when `NETWORK_NAME=devnet`)                                                                                  | No       | (empty)             |
| `RUST_LOG`                | Configure logger                                                                                                                                       | No       | `blob-indexer=INFO` |
| `SENTRY_DSN`              | Sentry DSN                                                                                                                                             | No       | (empty)             |

## Docker

These variables are used in the docker compose files we provide.

| Variable            | Description                                   | Required | Default value |
| ------------------- | --------------------------------------------- | -------- | ------------- |
| `EXTERNAL_API_PORT` | Blobscan API will be exposed on this port     | Yes      | (empty)       |
| `EXTERNAL_WEB_PORT` | Blobscan website will be exposed on this port | Yes      | (empty)       |
| `BLOBSCAN_TAG`      | Blobscan docker image tag                     | Yes      | (empty)       |
| `INDEXER_TAG`       | Blobscan-indexer docker image tag             | Yes      | (empty)       |
