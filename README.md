# Blobscan <a href="#"><img align="right" src=".github/assets/blobi.jpeg" height="80px" /></a>

Blobscan is the first blockchain explorer that helps to navigate and visualize those [EIP-4844](https://www.eip4844.com) blobs, providing the necessary infrastructure to scale Ethereum.

The architecture of our system has the following parts:

- Modified consensus and execution layer clients
- A blockchain indexer that saves the data in a MongoDB database (we are migrating to PostgreSQL)
- A frontend that allows navigating the data, having specific pages for blocks, transactions, addresses, and blobs.

Blobscan was one of the [finalists](https://twitter.com/ETHGlobal/status/1579249265557192704) of the [ETHBogota hackathon](https://bogota.ethglobal.com/) in 2022,
and it is currently [funded](https://blog.ethereum.org/2023/02/14/layer-2-grants-roundup#-data-visualization) by the Ethereum Foundation.

## Deployments

We have two active deployments:

- Staging: points `next` branch, will have the latest changes (expect things to break). Deployed at https://staging.
- Production: points `master` branch, stable version. Deployed at https://www.blobscan.com.

## How to run it?

Some environment variables are necessary to connect to the database that stores transactions, blocks and blobs data. Just copy `.env.example` to `.env` or use the following example:

```
DATABASE_URL=postgresql://blobscan:secret@postgres:5432/blobscan_dev?schema=public

# DEPRECATED
MONGODB_URI=mongodb+srv://<user>:<pass>@<host>/?retryWrites=true&w=majority
MONGODB_DB=<db-name>
```

Then run the following commands:

```
pnpm install
pnpm dev
```

The database can be filled running the script in the [blobscan-indexer](https://github.com/Blobscan/blobscan-indexer) repository. If you prefer to use docker we have created an image for the indexer at [blossomlabs/blobscan-indexer](https://hub.docker.com/repository/docker/blossomlabs/blobscan-indexer/general).

### Docker

Docker images are automatically published.

A docker-compose file is provided to set up the whole blobscan project with its dependencies (MongoDB and [blobscan-indexer](https://github.com/Blobscan/blobscan-indexer/)):

```
docker-compose up -d  # or 'make up'
```

Note that you also need to run your own [devnet-v4 node](https://github.com/Blobscan/devnet-v4) or connect to any of the existing ones.

# About Blossom Labs

![blossom labs](https://blossom.software/img/logo.svg)

Blobscan is being developed by [Blossom Labs](https://blossom.software/), a developer team specialized in building blockchain-based infrastructure for online communities.
