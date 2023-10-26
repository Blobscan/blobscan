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

{% callout type="warning" title="PostgreSQL databse" %}
You need to have access to a database.
{% /callout %}

You can use the provided docker-compose file to spin up a PostgreSQL service:

```shell
docker compose up -d postgres
```

Configure the [environment variables](/docs/environment) accordingly including the `DATABASE_URL`.

## Run

Then run the development command:

```shell
pnpm dev
```

Lastly, create the database schema:

```shell
cd packages/db
pnpm db:push
```
