import * as Sentry from "@sentry/node";

import { BlockNumberRange, prisma } from "@blobscan/db";

const BEACON_NODE_ENDPOINT = process.env.BEACON_NODE_ENDPOINT;
const SENTRY_DSN = process.env.SENTRY_DSN;

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

function sentry_init() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }
}

function sentry_ok(checkInId: string) {
  // 🟢 Notify Sentry your job has completed successfully:
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug: "update-overall-stats",
    status: "ok",
  });
}

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
  sentry_init();

  // 🟡 Notify Sentry your job is running:
  const checkInId = Sentry.captureCheckIn({
    monitorSlug: "update-overall-stats",
    status: "in_progress",
  });

  try {

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
      sentry_ok(checkInId);
      return;
    }
  
    const { number: currFinalizedBlock } = await getBlockFromBeacon("finalized");
  
    // Process only finalized blocks that were indexed
    const availableFinalizedBlock = Math.min(
      latestIndexedBlock.number,
      currFinalizedBlock
    );
  
    if (lastFinalizedBlock >= availableFinalizedBlock) {
      sentry_ok(checkInId);
      return;
    }
  
    const unprocessedBlocks = availableFinalizedBlock - lastFinalizedBlock + 1;
    const batches = Math.ceil(unprocessedBlocks / UNPROCESSED_BLOCKS_BATCH_SIZE);
  
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
      console.log(`Data aggregated from block ${from} to ${to}`);
      console.log(`Total Blob overall stats inserted: ${blobStatsRes}`);
      console.log(`Total Block overall stats inserted: ${blockStatsRes}`);
      console.log(`Total tx overall stats inserted: ${txStatsRes}`);
      console.log(`Sync state updated: ${syncStateRes}`);
  }

    sentry_ok(checkInId);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    // 🔴 Notify Sentry your job has failed:
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "update-overall-stats",
      status: "error",
    });
    await prisma.$disconnect();
    process.exit(1);
  });
