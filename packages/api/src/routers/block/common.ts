import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

const blockSelect = Prisma.validator<Prisma.BlockSelect>()({
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
});

export const fullBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  ...blockSelect,
  transactions: {
    select: {
      hash: true,
      fromId: true,
      toId: true,
      blobs: {
        select: {
          blobHash: true,
          index: true,
          blob: {
            select: {
              size: true,
            },
          },
        },
      },
    },
  },
});

export const getBlockOutputSchema = z.object({
  blobAsCalldataGasUsed: z.string(),
  blobGasUsed: z.string(),
  excessBlobGas: z.string(),
  blobGasPrice: z.string(),
  number: z.number(),
  hash: z.string(),
  slot: z.number(),
  timestamp: z.date(),
  transactions: z.array(
    z.object({
      hash: z.string(),
      fromId: z.string(),
      toId: z.string(),
      blobs: z.array(
        z.object({
          blobHash: z.string(),
          index: z.number(),
          blob: z.object({
            size: z.number(),
          }),
        })
      ),
    })
  ),
});
