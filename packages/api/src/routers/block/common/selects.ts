import { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
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

export function createBlockSelect(expands: Expands, filters?: Filters) {
  return Prisma.validator<Prisma.BlockSelect>()({
    ...baseBlockSelect,
    transactions: {
      select: {
        ...transactionReferenceSelect,
        ...(expands.transaction?.select ?? {}),
        blobs: {
          select: {
            index: !!expands.blob,
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
      where:
        filters?.transactionCategory !== undefined ||
        filters?.transactionAddresses
          ? {
              category: filters.transactionCategory,
              OR: filters.transactionAddresses,
            }
          : undefined,
    },
  });
}
