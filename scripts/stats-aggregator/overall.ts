import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { BlockNumberRange, prisma } from "@blobscan/db";

import { deleteOptionDef, helpOptionDef } from "./common";

const BEACON_NODE_ENDPOINT = process.env.BEACON_NODE_ENDPOINT;
const DEFAULT_UNPROCESSED_BLOCKS_BATCH_SIZE = 1_000_000;

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

type BlockId = number | "latest" | "finalized";

const overallCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  deleteOptionDef,
  helpOptionDef,
  {
    name: "to",
    alias: "t",
    typeLabel: "{underline block-id}",
    description: `Block identifier up to which to aggregate data. It can be a block number, "latest" or "finalized". It defaults to "finalized"`,
    defaultValue: "finalized",
    type: String,
  },
  {
    name: "batchSize",
    alias: "s",
    typeLabel: "{underline size}",
    description: `Number of blocks to process in a single batch. It defaults to ${DEFAULT_UNPROCESSED_BLOCKS_BATCH_SIZE}`,
    defaultValue: DEFAULT_UNPROCESSED_BLOCKS_BATCH_SIZE,
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

async function getBlockFromBeacon(id: BlockId): Promise<Block> {
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

export async function deleteOverallStats() {
  await prisma.$transaction([
    prisma.blobOverallStats.deleteMany(),
    prisma.blockOverallStats.deleteMany(),
    prisma.transactionOverallStats.deleteMany(),
    prisma.blockchainSyncState.upsert({
      create: {
        lastFinalizedBlock: 0,
        lastSlot: 0,
      },
      update: {
        lastFinalizedBlock: 0,
      },
      where: {
        id: 1,
      },
    }),
  ]);

  console.log("Overall stats delete operation executed: All stats deleted.");
}

export async function incrementOverallStats({
  targetBlockId,
  batchSize = DEFAULT_UNPROCESSED_BLOCKS_BATCH_SIZE,
}: {
  targetBlockId: BlockId;
  batchSize?: number;
}) {
  if (!!BEACON_NODE_ENDPOINT && targetBlockId === "finalized") {
    throw new Error(
      "Couldn't increment overall stats: BEACON_NODE_ENDPOINT not defined"
    );
  }

  const [latestProcessedFinalizedBlock, latestIndexedBlock] = await Promise.all(
    [
      prisma.blockchainSyncState
        .findFirst()
        .then((state) => state?.lastFinalizedBlock ?? 0),
      prisma.block.findLatest().then((b) => b?.number),
    ]
  );

  // If we haven't indexed any blocks yet, don't do anything
  if (!latestIndexedBlock) {
    console.log(
      "Skipping stats aggregation as there are no blocks indexed yet"
    );
    return;
  }

  let toBlockNumber: number;

  if (typeof targetBlockId === "number" || !isNaN(Number(targetBlockId))) {
    toBlockNumber = Number(targetBlockId);
  } else if (targetBlockId === "finalized") {
    toBlockNumber = (await getBlockFromBeacon("finalized")).number;
  } else {
    toBlockNumber = latestIndexedBlock;
  }

  const fromBlockNumber = latestProcessedFinalizedBlock + 1;

  // Process only finalized blocks that were indexed
  if (toBlockNumber > latestIndexedBlock) {
    toBlockNumber = latestIndexedBlock;
  }

  if (fromBlockNumber > toBlockNumber) {
    console.log(
      `Skipping stats aggregation as there are no new finalized blocks (Latest processed finalized block: ${latestProcessedFinalizedBlock})`
    );

    return;
  }

  const unprocessedBlocks = toBlockNumber - fromBlockNumber + 1;
  const batches = Math.ceil(unprocessedBlocks / batchSize);

  for (let i = 0; i < batches; i++) {
    const batchFrom = fromBlockNumber + i * batchSize;
    const batchTo = Math.min(batchFrom + batchSize - 1, toBlockNumber);
    const blockRange: BlockNumberRange = { from: batchFrom, to: batchTo };

    await prisma.$transaction([
      prisma.blockOverallStats.increment(blockRange),
      prisma.transactionOverallStats.increment(blockRange),
      prisma.blobOverallStats.increment(blockRange),
      prisma.blockchainSyncState.upsert({
        create: {
          lastSlot: 0,
          lastFinalizedBlock: batchTo,
        },
        update: {
          lastFinalizedBlock: batchTo,
        },
        where: {
          id: 1,
        },
      }),
    ]);

    if (batches > 1) {
      console.log(
        `Batch ${
          i + 1
        }/${batches} processed. Data aggregated from block ${batchFrom} to ${batchTo}`
      );
    }
  }

  console.log(
    `Overall stats increment operation executed: Data aggregated from block ${fromBlockNumber} to ${toBlockNumber}.`
  );
}

export async function overall(argv?: string[]) {
  const {
    batchSize,
    to,
    delete: delete_,
    help,
  } = commandLineArgs(overallCommandOptDefs, {
    argv,
  }) as {
    batchSize: number;
    to?: string;
    delete?: boolean;
    help: boolean;
  };

  if (help) {
    console.log(overallCommandUsage);

    return;
  }

  if (delete_) {
    return deleteOverallStats();
  }

  let targetBlockId: BlockId;

  if (!isNaN(Number(to))) {
    targetBlockId = Number(to);
  } else if (to === "latest" || to === "finalized") {
    targetBlockId = to;
  } else {
    throw new Error(
      `Invalid \`to\` flag value: Expected a block number, "latest" or "finalized" but got: ${to}`
    );
  }

  return incrementOverallStats({ targetBlockId, batchSize });
}
