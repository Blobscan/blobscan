---
title: Indexer
nextjs:
  metadata:
    title: Indexer
    description: Blobscan indexer
---

Here you can find information related to the indexer used by the Blobscan explorer.

Check out the repository [here](https://github.com/Blobscan/blobscan-indexer.rs).

## How it works?

The indexer traverses the Ethereum blockchain, retrieving data from both the Execution and Consensus layer clients.
It examines each slot's execution payload in the Consensus Layer to identify blocks with blob versioned hashes.
Afterward, it retrieves the blob data from the Consensus Layer, the remaining block and transaction data from the Execution Layer client,
and forwards it to the Blobscan API. The metadata is stored in the PostgreSQL database, while the workers will receive the task of persisting
the blobs to the configured storages.

## How to run locally?

1. Install dependencies

```bash
sudo apt install libssl-dev
```

2. Git clone this repository.

```bash
git clone https://github.com/Blobscan/blobscan-indexer.rs.git
cd blobscan-indexer.rs
```

3. Set the [environment variables](#environment-variables).

The indexer interacts with other services (such as the execution and consensus clients). They can be configured
by creating a `.env` file. You can use the `.env.example` file as a reference.

```bash
echo "SECRET_KEY=$(openssl rand -base64 32)" > .env
```

4. Run the indexer.

```bash
cargo run
```

5. Build a release

```bash
cargo build -r
```

## Environment variables

Below you can find a list of supported variables:

| Name                      | Required | Description                                        | Default value           |
| ------------------------- | -------- | -------------------------------------------------- | ----------------------- |
| `SECRET_KEY`              | **Yes**  | Shared secret key Blobscan API JWT authentication. |                         |
| `BLOBSCAN_API_ENDPOINT`   | No       | Endpoint for the Blobscan API.                     | `http://localhost:3001` |
| `BEACON_NODE_ENDPOINT`    | No       | A consensus node REST endpoint.                    | `http://localhost:3500` |
| `EXECUTION_NODE_ENDPOINT` | No       | An execution node RPC endpoint.                    | `http://localhost:8545` |
| `SENTRY_DSN`              | No       | Sentry client key.                                 |                         |

## Docker images

For convenience, we also provide docker images for blobscan-indexer.

Running with defaults

```bash
docker run --rm blossomlabs/blobscan-indexer:master
```

Using environment variables

```bash
docker run --rm \
  -e SECRET_KEY=supersecret \
  -e BLOBSCAN_API_ENDPOINT=http://blobscan-api:3001 \
  -e BEACON_NODE_ENDPOINT=http://beacon:3500 \
  -e EXECUTION_NODE_ENDPOINT=http://execution:8545 \
  blossomlabs/blobscan-indexer:master
```

Or directly using the .env file

```bash
docker run --env-file=.env --rm blossomlabs/blobscan-indexer:master
```

For more information, check out [Docker Hub](https://hub.docker.com/r/blossomlabs/blobscan-indexer).

## Command-Line Arguments

The indexer supports the following command-line arguments for configuring the indexing process:

- `-f, --from-slot SLOT`: Start indexing from slot `SLOT`. If the argument is not provided, the indexer will start from the latest slot in the database.

- `-n, --num-threads NUM_THREADS`: Use `NUM_THREADS` threads to index the blockchain. It allows you to specify the number of threads that will be utilized to parallelize the indexing process. Default: the number of CPU cores.

- `-s, --slots-per-save SLOTS_PER_SAVE`: Save the latest slot in the database every `SLOTS_PER_SAVE` slots. If the argument is not provided, the default value is 1000.

### Example usage

```bash
cargo run -- -f 1000 -n 10
```

## A note on tracing

The indexer uses the [`EnvFilter`](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/filter/struct.EnvFilter.html) and [`Bunyan`](https://docs.rs/tracing-bunyan-formatter/0.1.6/tracing_bunyan_formatter/struct.BunyanFormattingLayer.html) tracing layers to provide more customizable and legible events by using the bunyan format.

To display the formatted logs you'll need to have the bunyan CLI [installed](https://github.com/LukeMathWalker/bunyan#how-to-install) and pipe the indexer's output to the bunyan cli as shown below:

```sh
cargo run -q | bunyan
```

To filter spans and events through the `EnvFilter` layer you can use the default env variable `RUST_LOG` to define the directives to be used.

For example:

```sh
RUST_LOG=blob_indexer[span{field=value}]=level cargo run
```
