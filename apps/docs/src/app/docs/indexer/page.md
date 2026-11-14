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

## Backfill execution fees, status, and calldata

The monorepo has a script that reads missing transaction fields from an execution
node. It does not run the indexer or download blobs.

Apply the database migrations first. Set `DATABASE_URL` in the root `.env` file.
The RPC endpoint must serve transactions, receipts, and block headers for the
requested block range. Historical state access is not required.

```sh
pnpm --filter @blobscan/db backfill:transactions --rpc-url https://your-node --dry-run
pnpm --filter @blobscan/db backfill:transactions --rpc-url https://your-node
```

Set `EXECUTION_RPC_URL` instead of `--rpc-url` to keep the URL out of shell history.
Use `--from-block` and `--to-block` for an inclusive block range. Use `--batch-size`
to set the database page size (default: 100; maximum: 1000).

The script reads only stored transactions with missing execution gas, receipt gas
price, execution status, calldata, or block base fee. It processes one transaction at a time, with
three RPC requests per transaction. Each RPC request has a 30-second timeout and
up to three attempts. It checks the transaction hash, block hash, block number,
and blob gas values before it writes data. A database transaction keeps each
update atomic. It skips records that fail validation and exits with a nonzero
status if any record fails. Reorged records can fail the canonical block check.

Run the same command again after an interruption. Completed records are skipped.
Failed records remain eligible for another attempt. A dry run validates the RPC
data but does not write to the database. The script does not change sync state,
blob storage, or the existing calldata cost estimates.

The ingestion API accepts these optional fields for new data:

- Block: `baseFeePerGas`.
- Transaction: `gasUsed`, `effectiveGasPrice`, `executionStatus`, and `input`.

Send gas quantities as decimal or hexadecimal strings. Read `gasUsed` and
`effectiveGasPrice` from the receipt, `baseFeePerGas` from the block, and `input`
from the transaction. Set `executionStatus` to `success` for receipt status `0x1`
and `failed` for `0x0`. Missing or invalid receipt status prevents indexing
and backfill writes. Omitted API fields remain unavailable. Repeated ingestion into
the same block preserves values written by the backfill. If a transaction moves
to another block, ingestion clears its old receipt fields when new values are
not supplied.

The API and transaction page calculate the total fee as execution gas used times
the receipt gas price, plus blob gas used times the block blob gas price. The
priority fee and calldata costs are already part of the execution fee. Missing
execution fields produce a null total fee. Empty calldata is stored as `0x`.
The Status row shows block finality and execution status as separate badges.
If execution status is missing, the page shows only the finality badge.


Run the focused backfill tests with `pnpm --filter @blobscan/db test:backfill`.
To include CLI tests with real database writes, set `TEST_DATABASE_URL` to an
empty test database or schema with the migrations applied. These tests start a
local RPC fixture server. They create and remove test records and do not use a
live Ethereum node.

Deploy the database migration and compatible API before the updated Rust indexer.
The indexer sends receipt values for new transactions. Use the backfill command
for records indexed before that deployment.
