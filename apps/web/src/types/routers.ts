import type { RouterOutputs } from "~/api-client";

export type AllBlocks = RouterOutputs["block"]["getAll"];

export type Block = RouterOutputs["block"]["getByHash"];

export type Transaction = RouterOutputs["tx"]["getByHash"];

export type AllTransactions = RouterOutputs["tx"]["getAll"];

export type AllBlobs = RouterOutputs["blob"]["getAll"];

export type Blob = RouterOutputs["blob"]["getByVersionedHash"];

export type DailyBlobStats = RouterOutputs["stats"]["getBlobDailyStats"];

export type DailyBlockStats = RouterOutputs["stats"]["getBlockDailyStats"];

export type DailyTransactionStats =
  RouterOutputs["stats"]["getTransactionDailyStats"];

export type AllOverallStats = RouterOutputs["stats"]["getAllOverallStats"];

export type OverallBlobStats = RouterOutputs["stats"]["getBlobOverallStats"];

export type OverallBlockStats = RouterOutputs["stats"]["getBlockOverallStats"];

export type OverallTxStats =
  RouterOutputs["stats"]["getTransactionOverallStats"];
