import { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import {
  blobReferenceSelect,
  transactionReferenceSelect,
} from "../../../utils";

export const baseBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
});

export function createBlockSelect(expands: Expands) {
  return Prisma.validator<Prisma.BlockSelect>()({
    ...baseBlockSelect,
    transactions: {
      select: {
        ...transactionReferenceSelect,
        ...(expands.transaction?.select ?? {}),
        // We need to select the rollup field to filter by it later if needed
        rollup: true,
        blobs: {
          select: {
            index: true,
            blobHash: true,
            blob: {
              select: {
                ...blobReferenceSelect,
                ...(expands.blob?.select ?? {}),
              },
            },
          },
          orderBy: {
            index: "asc",
          },
        },
      },
      orderBy: {
        index: "asc",
      },
    },
  });
}
