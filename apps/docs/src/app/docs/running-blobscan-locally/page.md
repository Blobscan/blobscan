---
title: Running locally
nextjs:
  metadata:
    title: Running locally
    description: How to run your own instance of Blobscan
---

## Requirements

- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [docker compose](https://docs.docker.com/compose/)

## Installing dependencies

Install a recent Node.js version and pnpm:

```shell
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Git clone the repository:

```shell
git clone https://github.com/Blobscan/blobscan.git
cd blobscan
```

Install all the Node.js dependencies:

```shell
pnpm fetch -r
pnpm install -r
SKIP_ENV_VALIDATION=true npm run build
```

## Setup environment variables

{% callout type="warning" title="PostgreSQL database" %}
You need to have access to a database.
{% /callout %}

You can use the provided docker-compose file to spin up the required databases (Postgres and Redis):

```shell
docker compose -f docker-compose.local.yml up -d postgres redis
```

Configure the [environment variables](/docs/environment) accordingly, including the `DATABASE_URL`.

## Run

Then run the development command:

```shell
pnpm dev
```

Lastly, create the database schema:

```shell
pnpm db:generate
```

## Metrics aggregation

Metrics are recalculated every 15 minutes by a background process.

During development, you may want to force backfilling all the data, which can
be achieved using the following commands:

```shell
# Aggregates all blob data since the beginning
cd clis/stats-aggregation-cli
pnpm start overall
```

```shell
# Aggregates all blob data for yesterday
cd clis/stats-aggregation-cli
pnpm start daily
```

In case you need to delete aggregated metrics, you can use the stats aggregation cli:

```shell
cd clis/stats-aggregation-cli
pnpm start daily --delete
pnpm start overall --delete
```
