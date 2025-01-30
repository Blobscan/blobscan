import { TRPCError } from "@trpc/server";

import type { Prisma } from "@blobscan/db";
import { hashSchema, z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import type { Filters } from "../../middlewares/withFilters";
import {
  withFilters,
  withTypeFilterSchema,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { calculateDerivedTxBlobGasFields, retrieveBlobData } from "../../utils";
import {
  createBlockSelect,
  serializeBlock,
  serializedBlockSchema,
} from "./common";
import type { QueriedBlock } from "./common";

const blockHashSchema = hashSchema.refine((value) => value.length === 66, {
  message: "Block hashes must be 66 characters long",
});

const blockNumberOrSlotSchema = z.union([
  z
    .string()
    .refine((value) => !hashSchema.safeParse(value).success)
    .pipe(z.coerce.number().positive().int()),
  z.number().positive().int(),
]);
const blockIdSchema = z.union([blockHashSchema, blockNumberOrSlotSchema]);

const inputSchema = z
  .object({
    id: blockIdSchema,
    slot: z.boolean().optional(),
  })
  .merge(withTypeFilterSchema)
  .merge(createExpandsSchema(["transaction", "blob", "blob_data"]));

const outputSchema = serializedBlockSchema;

function buildBlockWhereClause(
  { id, slot: isSlot }: z.output<typeof inputSchema>,
  filters: Filters
): Prisma.BlockWhereInput {
  const blockNumberOrSlotRes = blockNumberOrSlotSchema.safeParse(id);

  if (blockNumberOrSlotRes.success) {
    return {
      [isSlot ? "slot" : "number"]: blockNumberOrSlotRes.data,
      transactionForks: filters.blockType,
    };
  }

  const blockHashResult = blockHashSchema.safeParse(id);

  if (blockHashResult.data) {
    return { hash: blockHashResult.data };
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Invalid block id "${id}"`,
  });
}

export const getByBlockId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{id}`,
      tags: ["blocks"],
      summary: "retrieves block details for given block number or hash.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .use(withFilters)
  .output(outputSchema)
  .query(
    async ({
      ctx: { blobStorageManager, prisma, expands, filters },
      input,
    }) => {
      const where = buildBlockWhereClause(input, filters);

      const queriedBlock = await prisma.block.findFirst({
        select: createBlockSelect(expands),
        where,
      });

      if (!queriedBlock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${input.id}'.`,
        });
      }

      const block: QueriedBlock = queriedBlock;

      if (expands.transaction) {
        block.transactions = block.transactions.map((tx) => {
          const {
            blobAsCalldataGasUsed,
            blobGasUsed,
            gasPrice,
            maxFeePerBlobGas,
          } = tx;
          const derivedFields =
            maxFeePerBlobGas && blobAsCalldataGasUsed && blobGasUsed && gasPrice
              ? calculateDerivedTxBlobGasFields({
                  blobAsCalldataGasUsed,
                  blobGasUsed,
                  gasPrice,
                  blobGasPrice: block.blobGasPrice,
                  maxFeePerBlobGas,
                })
              : {};

          return {
            ...tx,
            ...derivedFields,
          };
        });
      }

      if (expands.blobData) {
        const txsBlobs = block.transactions.flatMap((tx) => tx.blobs);

        await Promise.all(
          txsBlobs.map(async ({ blob }) => {
            if (blob.dataStorageReferences?.length) {
              const data = await retrieveBlobData(blobStorageManager, blob);

              blob.data = data;
            }
          })
        );
      }

      return serializeBlock(block);
    }
  );
