---
title: Indexer
nextjs:
  metadata:
    title: Indexer
    description: Blobscan indexer
---

Here you can find information related to the indexer used by the Blobscan explorer.

See the repository [here](https://github.com/Blobscan/blobscan-indexer.rs/tree/master).

## How it works?

The indexer traverses the Ethereum blockchain, retrieving data from both the Execution and Consensus layer clients. It examines each slot's execution payload in the Consensus Layer to identify blocks with blob versioned hashes. Afterward, it retrieves the blob data from the Consensus Layer, the remaining block and tx data from the Execution Layer client, and forwards it to the Blobscan API. The data is then stored in a PostgreSQL database, while the blobs are persisted in alternative storage solutions.

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

3. Set the [environment variables](/docs/environment#indexer).

The indexer interacts with other services (such as the execution and consensus clients). In a system where the defaults are not correct, they can be configured
by using environment variables or by creating a `.env` file. You can use the `.env.example` file as a reference.

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

## Docker images

For convenience, we also provide docker images for blobscan-indexer.

Running with defaults

```bash
docker run --rm blossomlabs/blobscan-indexer:master
```

Using environment variables

```bash
docker run --rm \
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

- `-n, --num-threads NUM_THREADS`: Use `NUM_THREADS` threads to index the blockchain. If the argument is not provided, the number of cores of the machine will be used.

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
