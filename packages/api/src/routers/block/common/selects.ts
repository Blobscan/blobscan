import type { Prisma } from "@blobscan/db";

import type {
  ExpandedBlob,
  ExpandedTransaction,
  Expands,
} from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
import type { Prettify } from "../../../utils";

const baseBlockSelect = {
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
} satisfies Prisma.BlockSelect;

export type PrismaBlock = Prisma.BlockGetPayload<{
  select: typeof baseBlockSelect;
}>;

export type CompletePrismaBlock = Prettify<
  PrismaBlock & {
    transactions: Prettify<
      {
        hash: string;
      } & Partial<ExpandedTransaction> & {
          blobs: Prettify<
            { blobHash: string } & {
              blob?: ExpandedBlob;
            }
          >[];
        }
    >[];
  }
>;

export function createBlockSelect(expands: Expands, filters?: Filters) {
  const blobExpand = expands.blob ? { blob: expands.blob } : {};
  const transactionExpand = expands.transaction?.select ?? {};

  return {
    ...baseBlockSelect,
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
