import type { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";

export function createTransactionSelect(expands: Expands) {
  const blockExpand = expands.block?.select;
  const blobExpand = expands.blob;

  return {
    hash: true,
    fromId: true,
    toId: true,
    blobGasUsed: true,
    blobAsCalldataGasUsed: true,
    gasPrice: true,
    maxFeePerBlobGas: true,
    blockHash: true,
    blockNumber: true,
    blockTimestamp: true,
    index: true,
    decodedFields: true,
    from: {
      select: {
        address: true,
        rollup: true,
      },
    },
    block: {
      select: {
        ...(blockExpand ?? {}),
        blobGasPrice: true,
      },
    },
    blobs: {
      select: {
        blobHash: true,
        ...(blobExpand ? { blob: blobExpand } : {}),
      },
      orderBy: {
        index: "asc",
      },
    },
  } satisfies Prisma.TransactionSelect;
}
