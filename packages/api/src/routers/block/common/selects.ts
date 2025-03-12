import type { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";

export function createBlockSelect(expands: Expands, filters?: Filters) {
  const blobExpand = expands.blob ? { blob: expands.blob } : {};
  const transactionExpand = expands.transaction?.select ?? {};

  return {
    hash: true,
    number: true,
    timestamp: true,
    slot: true,
    blobGasUsed: true,
    blobAsCalldataGasUsed: true,
    blobGasPrice: true,
    excessBlobGas: true,
    transactions: {
      select: {
        hash: true,
        ...transactionExpand,
        blobs: {
          select: {
            blobHash: true,
            ...blobExpand,
          },
          orderBy: {
            index: "asc",
          },
        },
      },
      orderBy: {
        index: "asc",
      },
      where: filters?.transactionFilters,
    },
  } satisfies Prisma.BlockSelect;
}
