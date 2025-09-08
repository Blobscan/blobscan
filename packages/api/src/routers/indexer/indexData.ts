import { logger } from "@blobscan/logger";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";
import { toBigIntSchema } from "../../zod-schemas";
import { INDEXER_PATH } from "./helpers";
import {
  createDBAddresses,
  createDBBlobs,
  createDBBlobsOnTransactions,
  createDBBlock,
  createDBTransactions,
} from "./indexData.utils";

const rawBlockSchema = z.object({
  number: z.coerce.number(),
  hash: z.string(),
  timestamp: z.coerce.number(),
  slot: z.coerce.number(),
  blobGasUsed: toBigIntSchema,
  excessBlobGas: toBigIntSchema,
});

const rawTxSchema = z.object({
  hash: z.string(),
  from: z.string(),
  to: z.string(),
  index: z.coerce.number(),
  blockNumber: z.coerce.number(),
  gasPrice: toBigIntSchema,
  maxFeePerBlobGas: toBigIntSchema,
});

const rawBlobSchema = z.object({
  versionedHash: z.string(),
  commitment: z.string(),
  proof: z.string(),
  data: z.string(),
  txHash: z.string(),
  index: z.coerce.number(),
});

export type RawBlock = z.infer<typeof rawBlockSchema>;
export type RawTx = z.infer<typeof rawTxSchema>;
export type RawBlob = z.infer<typeof rawBlobSchema>;

export const inputSchema = z.object({
  block: rawBlockSchema,
  transactions: z.array(rawTxSchema).nonempty(),
  blobs: z.array(rawBlobSchema).nonempty(),
});

export const outputSchema = z.void();

export type IndexDataInput = z.input<typeof inputSchema>;

export type IndexDataFormattedInput = z.output<typeof inputSchema>;

export const indexData = createAuthedProcedure("indexer")
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/block-txs-blobs`,
      tags: ["indexer"],
      summary: "indexes data in the database.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(async ({ ctx: { prisma, blobPropagator }, input }) => {
    const operations = [];

    // TODO: Create an upsert extension that set the `insertedAt` and the `updatedAt` field
    const now = new Date();

    // 1. Prepare address, block, transaction and blob insertions
    const dbTxs = createDBTransactions(input);
    const dbBlock = createDBBlock(input, dbTxs);
    const dbBlobs = createDBBlobs(input);
    const dbBlobsOnTransactions = createDBBlobsOnTransactions(input);
    const dbAddress = createDBAddresses(input);

    let p0 = performance.now();

    operations.push(
      prisma.block.upsert({
        where: { hash: input.block.hash },
        create: {
          ...dbBlock,
          insertedAt: now,
          updatedAt: now,
        },
        update: {
          ...dbBlock,
          updatedAt: now,
        },
      }),
      prisma.address.upsertMany(dbAddress),
      prisma.transaction.upsertMany(dbTxs),
      prisma.blob.upsertMany(dbBlobs)
    );

    operations.push(
      prisma.blobsOnTransactions.upsertMany(dbBlobsOnTransactions)
    );

    // 2. Execute all database operations in a single transaction
    await prisma.$transaction(operations);

    let p1 = performance.now();

    logger.debug(
      `Block ${input.block.number} stored in DB: ${
        input.transactions.length
      } transactions, ${input.blobs.length} blobs inserted! (${p1 - p0}ms)`
    );

    logger.debug(
      `Storing ${input.blobs.length} blob data on primary blob storage…`
    );

    p0 = performance.now();
    // 3. Propagate blobs
    const propagatorInput = input.blobs.map((b) => ({
      ...b,
      blockNumber: input.block.number,
    }));
    await blobPropagator?.propagateBlobs(propagatorInput);

    p1 = performance.now();

    logger.debug(
      `Block ${input.block.number} blob data stored in primay blob storage: ${
        propagatorInput.length
      } blobs uploaded! (${p1 - p0}ms)`
    );
  });
