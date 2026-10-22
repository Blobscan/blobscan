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

Run the development command:

```shell
pnpm dev
```

Lastly, apply all database migrations and optionally, add some fixture data:

```shell
cd packages/db
pnpm db:migrate
pnpm db:seed
```

## Metrics aggregation

Dagster calculates the metrics. To calculate the metrics during development, run Dagster and do a backfill of the metrics assets. For the procedure, refer to the [`apps/dagster`](https://github.com/Blobscan/blobscan/tree/main/apps/dagster) README.
