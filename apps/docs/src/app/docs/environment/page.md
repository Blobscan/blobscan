---
title: Environment variables
nextjs:
  metadata:
    title: Environment variables
    description: How to configure your Blobscan instance
---

## Blobscan Web

| Variable                               | Description                                                                                 | Required | Default value                                                                                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                         | Postgresql database URI                                                                     | Yes      | (empty)                                                                                                                                                                                                                                                        |
| `FEEDBACK_WEBHOOK_URL`                 | Discord webhook URL for feedback                                                            | No       | (empty)                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_NETWORK_NAME`             | Network name                                                                                | No       | mainnet                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_EXPLORER_BASE_URL`        | Block explorer URL                                                                          | No       | `https://etherscan.io`                                                                                                                                                                                                                                         |
| `NEXT_PUBLIC_BEACON_BASE_URL`          | Beacon explorer URL                                                                         | No       | `https://beaconcha.in/`                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_VERSION`                  | Blobscan version                                                                            | No       | (empty)                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_SUPPORTED_NETWORKS`       | Link to other pages from the Network menu                                                   | No       | `[{"label":"Ethereum Mainnet","href":"https://blobscan.com/"},{"label":"Gnosis","href":"https://gnosis.blobscan.com/"},{"label":"Holesky Testnet","href":"https://holesky.blobscan.com/"},{"label":"Sepolia Testnet","href":"https://sepolia.blobscan.com/"}]` |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` | Enable Vercel analytics                                                                     | No       | `false`                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_SENTRY_DSN_WEB`           | Sentry DSN                                                                                  | No       | (empty)                                                                                                                                                                                                                                                        |
| `NODE_ENV`                             | Used in Node.js applications to specify the environment in which the application is running | No       | (empty)                                                                                                                                                                                                                                                        |
| `SENTRY_PROJECT`                       | Sentry project name                                                                         | No       | (empty)                                                                                                                                                                                                                                                        |
| `SENTRY_ORG`                           | Sentry organization                                                                         | No       | (empty)                                                                                                                                                                                                                                                        |
| `METRICS_ENABLED`                      | Expose the /metrics endpoint                                                                | No       | `false`                                                                                                                                                                                                                                                        |
| `TRACES_ENABLED`                       | Enable instrumentation of functions and sending traces to a collector                       | No       | `false`                                                                                                                                                                                                                                                        |
| `BLOB_PROPAGATOR_ENABLED`              | Enable uploading blobs to multiple storages in parallel                                     | No       | `false`                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_POSTHOG_ID`               | PostHog project API key used for tracking events and analytics                              | No       | (empty)                                                                                                                                                                                                                                                        |
| `NEXT_PUBLIC_POSTHOG_HOST`             | Host URL for the PostHog instance used for analytics tracking                               | No       | (empty)                                                                                                                                                                                                                                                        |

## Blobscan API

| Variable                             | Description                                                                                        | Required                        | Default value              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------- |
| `CHAIN_ID`                           | EVM chain id                                                                                       | Yes                             | `1`                        |
| `DATABASE_URL`                       | Postgresql database URI                                                                            | Yes                             | (empty)                    |
| `REDIS_URI`                          | Redis host                                                                                         | Yes                             | `redis://localhost:6379/1` |
| `SECRET_KEY`                         | Shared key used for JWT authentication with the indexer                                            | Yes                             | (empty)                    |
| `NETWORK_NAME`                       | Network's name (valid values are: `mainnet`, `holesky`, `sepolia`, `gnosis`, `chiado`, `devnet`)   | No                              | `mainnet`                  |
| `BLOBSCAN_API_BASE_URL`              | API domain                                                                                         | No                              | `http://localhost:3001`    |
| `BLOBSCAN_API_PORT`                  | API port                                                                                           | No                              | `3001`                     |
| `DENCUN_FORK_SLOT`                   | Custom slot when blobs are activated (use when `NETWORK_NAME=devnet`)                              | No                              | (empty)                    |
| `METRICS_ENABLED`                    | Expose the /metrics endpoint                                                                       | No                              | `false`                    |
| `TRACES_ENABLED`                     | Enable instrumentation of functions and sending traces to a collector                              | No                              | `false`                    |
| `NODE_ENV`                           | Used in Node.js applications to specify the environment in which the application is running        | No                              | (empty)                    |
| `SENTRY_DSN_API`                     | Sentry DSN                                                                                         | No                              | (empty)                    |
| `GOOGLE_SERVICE_KEY`                 | Google Cloud service key                                                                           | No                              | (empty)                    |
| `GOOGLE_STORAGE_ENABLED`             | Store blobs in Google Cloud Storage                                                                | No                              | `false`                    |
| `GOOGLE_STORAGE_API_ENDPOINT`        | Google Cloud API endpoint (for development)                                                        | No                              | (empty)                    |
| `GOOGLE_STORAGE_BUCKET_NAME`         | Google Cloud Storage bucket name                                                                   | No                              | (empty)                    |
| `GOOGLE_STORAGE_PROJECT_ID`          | Google Cloud project ID                                                                            | No                              | (empty)                    |
| `POSTGRES_STORAGE_ENABLED`           | Store blobs in postgres database (default storage)                                                 | No                              | `false`                    |
| `SWARM_DEFERRED_UPLOAD`              | Determines if the uploaded data should be sent to the network immediately or in a deferred fashion | No                              | `true`                     |
| `SWARM_STORAGE_ENABLED`              | Store blobs in Ethereum Swarm                                                                      | No                              | `false`                    |
| `SWARM_BATCH_ID`                     | Batch ID of the Ethereum Swarm stamp                                                               | If `SWARM_STORAGE_ENABLED=true` | (empty)                    |
| `BEE_ENDPOINT`                       | Bee endpoint                                                                                       | No                              | (empty)                    |
| `FILE_SYSTEM_STORAGE_ENABLED`        | Store blobs in filesystem                                                                          | No                              | `false`                    |
| `FILE_SYSTEM_STORAGE_PATH`           | Store blobs in this path                                                                           | No                              | `/tmp/blobscan-blobs`      |
| `STATS_SYNCER_DAILY_CRON_PATTERN`    | Cron pattern for the daily stats job                                                               | No                              | `30 0 * * * *`             |
| `STATS_SYNCER_OVERALL_CRON_PATTERN`  | Cron pattern for the overall stats job                                                             | No                              | `*/15 * * * *`             |
| `SWARM_STAMP_CRON_PATTERN`           | Cron pattern for swarm job                                                                         | No                              | `*/15 * * * *`             |
| `BLOB_PROPAGATOR_ENABLED`            | Enable parallel uploading of blobs to multiple storage locations                                   | No                              | `false`                    |
| `BLOB_PROPAGATOR_COMPLETED_JOBS_AGE` | Remove completed jobs after the specified number of seconds (default: 1 day)                       | No                              | `86400`                    |
| `BLOB_PROPAGATOR_FAILED_JOBS_AGE`    | Remove completed jobs after the specified number of seconds (default: 7 days)                      | No                              | `604800`                   |
| `POSTHOG_ID`                         | PostHog project API key used for tracking events and analytics                                     | No                              | (empty)                    |
| `POSTHOG_HOST`                       | Host URL for the PostHog instance used for analytics tracking                                      | No                              | (empty)                    |

## Blobscan indexer

| Variable                  | Description                                                                                                                                   | Required | Default value       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| `BEACON_NODE_ENDPOINT`    | Beacon node RPC endpoint                                                                                                                      | Yes      | (empty)             |
| `BLOBSCAN_API_ENDPOINT`   | Blobscan API endpoint                                                                                                                         | Yes      | (empty)             |
| `EXECUTION_NODE_ENDPOINT` | Execution node RPC endpoint                                                                                                                   | Yes      | (empty)             |
| `SECRET_KEY`              | Shared key used for JWT authentication with API                                                                                               | Yes      | (empty)             |
| `NETWORK_NAME`            | Automatically start from the slot when blobs were activated (valid values are: `mainnet`, `holesky`, `sepolia`, `gnosis`, `chiado`, `devnet`) | No       | `mainnet`           |
| `DENCUN_FORK_SLOT`        | Custom slot when blobs are activated (use when `NETWORK_NAME=devnet`)                                                                         | No       | (empty)             |
| `RUST_LOG`                | Configure logger                                                                                                                              | No       | `blob-indexer=INFO` |
| `SENTRY_DSN`              | Sentry DSN                                                                                                                                    | No       | (empty)             |

## Docker

These variables are used in the docker compose files we provide.

| Variable            | Description                                   | Required | Default value |
| ------------------- | --------------------------------------------- | -------- | ------------- |
| `EXTERNAL_API_PORT` | Blobscan API will be exposed on this port     | Yes      | (empty)       |
| `EXTERNAL_WEB_PORT` | Blobscan website will be exposed on this port | Yes      | (empty)       |
| `BLOBSCAN_TAG`      | Blobscan docker image tag                     | Yes      | (empty)       |
| `INDEXER_TAG`       | Blobscan-indexer docker image tag             | Yes      | (empty)       |
