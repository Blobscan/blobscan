import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import type { BlockNumberRange, Prisma } from "@blobscan/db";
import { prisma } from "@blobscan/db";

import { CommandError } from "../error";
import type { Command } from "../types";
import { commandLog, deleteOptionDef, helpOptionDef } from "../utils";

type BlockId = number | "latest" | "finalized";

const PRISMA_BLOCKS_BATCH_SIZE = 2_000_000;

class OverallCommandError extends CommandError {
  constructor(operation: string, error: Error | string) {
    super(error instanceof Error ? error.message : error, {
      command: "overall",
      operation,
    });
  }
}

const overallCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  deleteOptionDef,
  helpOptionDef,
  {
    name: "to",
    alias: "t",
    typeLabel: "{underline block-id}",
    description: `Block identifier up to which to aggregate data. It can be a block number, "latest" for the last indexed block or "finalized"  for the chain's most recent finalized block. It defaults to "finalized"`,
    defaultValue: "finalized",
    type: String,
  },
  {
    name: "batchSize",
    alias: "s",
    typeLabel: "{underline size}",
    description: `Number of blocks to process in a single batch. It defaults to ${PRISMA_BLOCKS_BATCH_SIZE}`,
    defaultValue: PRISMA_BLOCKS_BATCH_SIZE,
    type: Number,
  },
];

export const overallCommandUsage = commandLineUsage([
  {
    header: "Overall Command",
    content: "Aggregate overall stats.",
  },
  {
    header: "Options",
    optionList: overallCommandOptDefs,
  },
]);

async function resolveBlockId(blockId: BlockId): Promise<number> {
  try {
    if (typeof blockId === "number" || !isNaN(Number(blockId))) {
      return Number(blockId);
    } else if (blockId === "finalized") {
      const syncState = await prisma.blockchainSyncState.findUnique({
        select: {
          lastFinalizedBlock: true,
        },
        where: {
          id: 1,
        },
      });

      return syncState?.lastFinalizedBlock ?? 0;
    } else {
      return (await prisma.block.findLatest().then((b) => b?.number)) ?? 0;
    }
  } catch (err) {
    const err_ = err as Error;

    throw new OverallCommandError("aggregation", err_);
  }
}

async function deleteOverallStats() {
  const newBlockchainSyncState: Partial<Prisma.BlockchainSyncStateGroupByOutputType> =
    {
      lastAggregatedBlock: null,
    };

  await prisma.$transaction([
    prisma.blobOverallStats.deleteMany(),
    prisma.blockOverallStats.deleteMany(),
    prisma.transactionOverallStats.deleteMany(),
    prisma.blockchainSyncState.upsert({
      create: newBlockchainSyncState,
      update: newBlockchainSyncState,
      where: {
        id: 1,
      },
    }),
  ]);
}

async function incrementOverallStats(
  blockRange: BlockNumberRange,
  {
    batchSize = PRISMA_BLOCKS_BATCH_SIZE,
  }: {
    batchSize?: number;
  }
) {
  const { from, to } = blockRange;
  const unprocessedBlocks = to - from + 1;
  const batches = Math.ceil(unprocessedBlocks / batchSize);

  for (let i = 0; i < batches; i++) {
    const batchFrom = from + i * batchSize;
    const batchTo = Math.min(batchFrom + batchSize - 1, to);
    const blockRange: BlockNumberRange = { from: batchFrom, to: batchTo };
    const newBlockchainSyncState: Partial<Prisma.BlockchainSyncStateGroupByOutputType> =
      {
        lastAggregatedBlock: batchTo,
      };

    await prisma.$transaction([
      prisma.blockOverallStats.increment(blockRange),
      prisma.transactionOverallStats.increment(blockRange),
      prisma.blobOverallStats.increment(blockRange),
      prisma.blockchainSyncState.upsert({
        create: newBlockchainSyncState,
        update: newBlockchainSyncState,
        where: {
          id: 1,
        },
      }),
    ]);

    if (batches > 1) {
      const formattedBlockRange = `${blockRange.from.toLocaleString()}-${blockRange.to.toLocaleString()}`;
      const batch = batches > 1 ? `(batch ${i + 1}/${batches})` : "";

      commandLog(
        "debug",
        "overall",
        "increment",
        `stats calculated for block range ${formattedBlockRange} (${batch})`
      );
    }
  }
}

const overall: Command = async function (argv) {
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
    await deleteOverallStats();

    commandLog(
      "info",
      "overall",
      "deleteMany",
      `All overall stats removed successfully`
    );

    return;
  }

  let targetBlockId: BlockId;

  if (!isNaN(Number(to))) {
    targetBlockId = Number(to);
  } else if (to === "latest" || to === "finalized") {
    targetBlockId = to;
  } else {
    throw new OverallCommandError(
      "aggregation",
      `Invalid \`to\` flag value. Expected a block number, "latest" or "finalized" but got ${to}`
    );
  }
  let targetBlockNumber = await resolveBlockId(targetBlockId);
  const [lastSyncedFinalizedBlock, latestIndexedBlock] = await Promise.all([
    prisma.blockchainSyncState
      .findUnique({
        where: {
          id: 1,
        },
      })
      .then((state) => state?.lastAggregatedBlock ?? 0),
    prisma.block.findLatest().then((b) => b?.number),
  ]);

  // If we haven't indexed any blocks yet, don't do anything
  if (!latestIndexedBlock) {
    commandLog(
      "info",
      "overall",
      "increment",
      "Skipping as there as no blocks have been indexed yet"
    );

    return;
  }

  const fromBlockNumber = lastSyncedFinalizedBlock + 1;

  // Process only finalized blocks that were indexed
  if (targetBlockNumber > latestIndexedBlock) {
    targetBlockNumber = latestIndexedBlock;
  }

  if (fromBlockNumber > targetBlockNumber) {
    commandLog(
      "info",
      "overall",
      "increment",
      `Skipping as there is no new finalized blocks (Last processed finalized block: ${lastSyncedFinalizedBlock.toLocaleString()})`
    );

    return;
  }

  await incrementOverallStats(
    { from: fromBlockNumber, to: targetBlockNumber },
    { batchSize }
  );

  commandLog(
    "info",
    "overall",
    "increment",
    `All stats incremented successfully from block ${fromBlockNumber.toLocaleString()} to ${targetBlockNumber.toLocaleString()}`
  );

  return;
};

export { overall };
