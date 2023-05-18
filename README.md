# Blobscan <a href="#"><img align="right" src=".github/assets/blobi.jpeg" height="80px" /></a>

Blobscan is the first blockchain explorer that helps to navigate and visualize those [EIP-4844](https://www.eip4844.com) blobs, providing the necessary infrastructure to scale Ethereum.

The architecture of our system has the following parts:

- Modified consensus and execution layer clients
- A blockchain indexer that saves the data in a PostgreSQL database (we are migrating from MongoDB)
- A frontend that allows navigating the data, having specific pages for blocks, transactions, addresses, and blobs.

Blobscan was one of the [finalists](https://twitter.com/ETHGlobal/status/1579249265557192704) of the [ETHBogota hackathon](https://bogota.ethglobal.com/) in 2022,
and it is currently [funded](https://blog.ethereum.org/2023/02/14/layer-2-grants-roundup#-data-visualization) by the Ethereum Foundation.

## How to run it?

Some environment variables are necessary to connect to the database that stores transactions, blocks and blobs data. Just copy `.env.example` to `.env` or use the following example:

```
DATABASE_URL=postgresql://blobscan:secret@postgres:5432/blobscan_dev?schema=public
```

Install a recent Node.js version and pnpm:

```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Then run the following commands:

```
pnpm install
pnpm dev
```

Lastly, create the database schema:

```
# Update DATABASE_URL
vi .env
pnpm db:push
```

### Docker

**NOTE: Recent versions of docker and docker-compose with BuildKit support are required.**

Docker images are automatically published and a docker-compose file is provided for convenience.

Note that you also need to run your own [devnet-v5 node](https://github.com/Blobscan/devnet-v5) or connect to any of the existing ones.
You can use SSH tunnels like this:

```
ssh -L 3500:localhost:3500 -L 8545:localhost:8545 my-devnet5-node
```

Then spin up the containers:

```
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose up -d --build
```

Create database (only the first time):

```
docker-compose exec web pnpm db:push
```

## Environment variables

Create a `.env` file with environment variables. You can use the `.env.example` file as a reference.

Below you can find a list of optional variables:

### Blobscan Website

| Env variable                    | Description                                                                                     | Default value                                                            |
| -----------------------         | ----------------------------------------------------------------------------------------------- | -----------------------                                                  |
| `DATABASE_URL`                  | Postgresql database URI                                                                         | `postgresql://blobscan:s3cr3t@localhost:5432/blobscan_dev?schema=pbulic` |
| `NEXTAUTH_URL`                  | -                                                                                               | `http://localhost:3000`                                                  |
| `NEXTAUTH_SECRET`               | -                                                                                               | `supersecret`                                                            |
| `NEXT_PUBLIC_BEACON_BASE_URL`   | -                                                                                               | `http://134.209.87.158:8080/`                                            |
| `NEXT_PUBLIC_EXPLORER_BASE_URL` | -                                                                                               | `https://explorer.4844-devnet-5.etpandaops.io/`                          |

### Blobscan API

| Env variable                    | Description                                                                                     | Default value                                                            |
| -----------------------         | ----------------------------------------------------------------------------------------------- | -----------------------                                                  |
| `BLOBSCAN_API_PORT`             | -                                                                                               | `3001`                                                                   |

# About Blossom Labs

![blossom labs](https://blossom.software/img/logo.svg)

Blobscan is being developed by [Blossom Labs](https://blossom.software/), a developer team specialized in building blockchain-based infrastructure for online communities.

[Join us on Discord!](https://discordapp.com/invite/fmqrqhkjHY/)
