import type { MakeFieldRequired } from "./helpers";
import type {
  GetByBlobIdOutput,
  GetByBlockIdOutput,
  GetTxByHashOutput,
} from "./routers";

export type Blob = GetByBlobIdOutput;

export type Block = GetByBlockIdOutput;

export type Transaction = GetTxByHashOutput;

export type TransactionWithBlock = MakeFieldRequired<
  GetTxByHashOutput,
  "block" | "blobGasBaseFee"
>;

type TransactionBlob = Required<Transaction["blobs"][number]>;

export type TransactionWithBlob = Omit<GetByBlockIdOutput, "blobs"> &
  Required<{
    blobs: TransactionBlob[];
  }>;

export type FullTransaction = Omit<TransactionWithBlock, "blobs"> & {
  blobs: TransactionBlob[];
};

type BlockTransaction = Required<GetByBlockIdOutput["transactions"][number]>;

type BlockTransactionBlob = Required<BlockTransaction["blobs"][number]>;

type FullBlockTransaction = Omit<BlockTransaction, "blobs"> & {
  blobs: BlockTransactionBlob[];
};

export type BlockWithTransactions = Omit<GetByBlockIdOutput, "transactions"> & {
  transactions: BlockTransaction[];
};

export type FullBlock = Omit<GetByBlockIdOutput, "transactions"> & {
  transactions: Required<FullBlockTransaction>[];
};

export type Rollup = NonNullable<Transaction["rollup"]>;

export type BlobStorage =
  GetByBlobIdOutput["dataStorageReferences"][number]["blobStorage"];
