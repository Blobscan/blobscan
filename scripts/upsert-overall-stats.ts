import { BlockNumberRange, prisma } from "@blobscan/db";

import { monitorJob } from "../sentry";

const BEACON_NODE_ENDPOINT = process.env.BEACON_NODE_ENDPOINT;

if (!BEACON_NODE_ENDPOINT) {
  throw new Error("BEACON_NODE_ENDPOINT is not set");
}

type BeaconFinalizedBlockResponse = {
  data: {
    message: {
      slot: string;
      body: {
        execution_payload: {
          block_number: string;
        };
      };
    };
  };
};

type Block = {
  number: number;
  slot: number;
};

const UNPROCESSED_BLOCKS_BATCH_SIZE = 1_000_000;

async function getBlockFromBeacon(id: number | "finalized"): Promise<Block> {
  let response: Response;

  try {
    response = await fetch(
      `${BEACON_NODE_ENDPOINT}/eth/v2/beacon/blocks/${id}`
    );
  } catch (err) {
    const err_ = err as Error;

    throw new Error(
      `Failed to fetch block from beacon node: ${err_.cause ?? err_.message}`,
      {
        cause: err_.cause,
      }
    );
  }

  const {
    data: { message },
  } = (await response.json()) as BeaconFinalizedBlockResponse;

  return {
    number: Number(message.body.execution_payload.block_number),
    slot: Number(message.slot),
  };
}

async function main() {
  return monitorJob("upsert-overall-stats", async () => {
    const [syncState, latestIndexedBlock] = await Promise.all([
      prisma.blockchainSyncState.findFirst({
        select: {
          lastFinalizedBlock: true,
        },
      }),
      prisma.block.findLatest(),
    ]);
    const lastFinalizedBlock = syncState?.lastFinalizedBlock ?? 0;

    // If we haven't indexed any blocks yet, don't do anything
    if (!latestIndexedBlock) {
      console.log("Skipping as there are no blocks indexed yet");
      return;
    }

    const { number: currFinalizedBlock } = await getBlockFromBeacon(
      "finalized"
    );

    // Process only finalized blocks that were indexed
    const availableFinalizedBlock = Math.min(
      latestIndexedBlock.number,
      currFinalizedBlock
    );

    if (lastFinalizedBlock >= availableFinalizedBlock) {
      console.log("Skipping as there are no new finalized blocks");

      return;
    }

    const unprocessedBlocks = availableFinalizedBlock - lastFinalizedBlock + 1;
    const batches = Math.ceil(
      unprocessedBlocks / UNPROCESSED_BLOCKS_BATCH_SIZE
    );

    for (let i = 0; i < batches; i++) {
      const from = lastFinalizedBlock + i * UNPROCESSED_BLOCKS_BATCH_SIZE;
      const to = Math.min(
        from + UNPROCESSED_BLOCKS_BATCH_SIZE - 1,
        availableFinalizedBlock
      );
      const blockRange: BlockNumberRange = { from, to };

      const [blockStatsRes, txStatsRes, blobStatsRes, syncStateRes] =
        await prisma.$transaction([
          prisma.blockOverallStats.increment(blockRange),
          prisma.transactionOverallStats.increment(blockRange),
          prisma.blobOverallStats.increment(blockRange),
          prisma.blockchainSyncState.upsert({
            create: {
              lastSlot: 0,
              lastFinalizedBlock: to,
            },
            update: {
              lastFinalizedBlock: to,
            },
            where: {
              id: 1,
            },
          }),
        ]);

      console.log("=====================================");
      console.log(`Overall stats aggregated from block ${from} to ${to}`);
      console.log(
        `Blob overall stats upserted (rows upserted: ${blobStatsRes})`
      );
      console.log(
        `Block overall stats upserted (rows upserted: ${blockStatsRes})`
      );
      console.log(`Tx overall stats upserted (rows upserted: ${txStatsRes})`);
      console.log(
        `Sync state upserted. New finalized block: ${syncStateRes.lastFinalizedBlock}`
      );
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
