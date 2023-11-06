import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { BlockNumberRange, prisma } from "@blobscan/db";

import { ALL_ENTITIES, commonOptionDefs, Entity } from "./common";

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

type OverallOperation = "deleteMany" | "increment" | "populate";

const UNPROCESSED_BLOCKS_BATCH_SIZE = 1_000_000;
const BEACON_NODE_ENDPOINT = process.env.BEACON_NODE_ENDPOINT;

const overallCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  ...commonOptionDefs,
  {
    name: "full",
    alias: "f",
    description:
      "Performs a full aggregation of all entities, ignoring incremental updates",
    type: Boolean,
  },
  {
    name: "from",
    alias: "fr",
    description:
      "Block number from which to start aggregating data. If not provided it defaults to the last one processed",
  },
  {
    name: "to",
    alias: "t",
    typeLabel: "{underline} block number",
    description:
      "Block number up to which start aggregating data. If not provided it defaults to latest finalized block in the network",
    type: Number,
  },
];

const overallCommandUsage = commandLineUsage([
  {
    header: "Overall Command",
    content: "Aggregate overall stats.",
  },
  {
    header: "Options",
    optionList: overallCommandOptDefs,
  },
]);

async function performOverallStatsOperation(
  entity: Entity,
  operation: OverallOperation,
  params: unknown[] = []
) {
  let overallStatsFn;

  switch (entity) {
    case "blob":
      overallStatsFn = prisma.blobOverallStats[operation];
      break;
    case "block":
      overallStatsFn = prisma.blockOverallStats[operation];
      break;
    case "tx":
      overallStatsFn = prisma.transactionOverallStats[operation];
      break;
  }

  const result = await overallStatsFn(...params).then((res) =>
    typeof res === "number" ? res : res.count
  );

  console.log(
    `Overall ${entity} stats operation \`${operation}\` executed: Total stats affected: ${result}`
  );
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

async function incrementOverallStats() {
  if (!BEACON_NODE_ENDPOINT) {
    throw new Error(
      "Couldn't increment overall stats: BEACON_NODE_ENDPOINT not defined"
    );
  }

  const [lastFinalizedBlock, latestIndexedBlock] = await Promise.all([
    prisma.blockchainSyncState
      .findFirst()
      .then((state) => state?.lastFinalizedBlock ?? 0),
    prisma.block.findLatest(),
  ]);

  // If we haven't indexed any blocks yet, don't do anything
  if (!latestIndexedBlock) {
    console.log("Skipping as there are no blocks indexed yet");
    return;
  }

  const { number: currFinalizedBlock } = await getBlockFromBeacon("finalized");

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
    console.log(`Overall stats aggregated from block ${from} to ${to}`);
    console.log(
      `Overall blob stats operation executed: upserted (rows upserted: ${blobStatsRes})`
    );
    console.log(
      `Block overall stats upserted (rows upserted: ${blockStatsRes})`
    );
    console.log(`Tx overall stats upserted (rows upserted: ${txStatsRes})`);
    console.log(
      `Sync state upserted. New finalized block: ${syncStateRes.lastFinalizedBlock}`
    );
  }
}

export async function overall(argv?: string[]) {
  const {
    full,
    from,
    to,
    entity: entities,
    delete: delete_,
    help,
  } = commandLineArgs(overallCommandOptDefs, {
    argv,
  }) as {
    full: boolean;
    from: Number;
    to: Number;
    delete?: boolean;
    entity?: Entity[];
    help: boolean;
  };

  if (help) {
    console.log(overallCommandUsage);

    return;
  }

  const selectedEntities = entities?.length ? entities : ALL_ENTITIES;
  let operation: OverallOperation = "increment";

  if (full) {
    operation = "populate";
  } else if (delete_) {
    operation = "deleteMany";
  }

  return Promise.all(
    selectedEntities.map((e) => performOverallStatsOperation(e, operation))
  );
}
