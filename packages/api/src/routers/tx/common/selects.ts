import type { Prisma } from "@blobscan/db";

import type {
  ExpandedBlob,
  ExpandedBlock,
  Expands,
} from "../../../middlewares/withExpands";
import type { Prettify } from "../../../utils";

const transactionSelect = {
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
} satisfies Prisma.TransactionSelect;

type PrismaTransaction = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

export type CompletePrismaTransaction = Prettify<
  PrismaTransaction & {
    decodedFields: NonNullable<PrismaTransaction["decodedFields"]>;
    block: Prettify<
      Partial<ExpandedBlock> & {
        blobGasPrice: ExpandedBlock["blobGasPrice"];
      }
    >;
    blobs: Prettify<
      { blobHash: string } & {
        blob?: ExpandedBlob;
      }
    >[];
  }
>;
export function createTransactionSelect(expands: Expands) {
  const blockExpand = expands.block?.select;
  const blobExpand = expands.blob;

  return {
    ...transactionSelect,
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
