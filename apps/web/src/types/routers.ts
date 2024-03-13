import type { RouterOutputs } from "~/api-client";

export type AllBlocks = RouterOutputs["block"]["getAllFull"];

export type Block = RouterOutputs["block"]["getByBlockIdFull"];

export type Transaction = RouterOutputs["tx"]["getByHashFull"];

export type AllTransactions = RouterOutputs["tx"]["getAllFull"];

export type AllBlobs = RouterOutputs["blob"]["getAll"];

export type Blob = RouterOutputs["blob"]["getByBlobIdFull"];

export type DailyBlobStats = RouterOutputs["stats"]["getBlobDailyStats"];

export type DailyBlockStats = RouterOutputs["stats"]["getBlockDailyStats"];

export type DailyTransactionStats =
  RouterOutputs["stats"]["getTransactionDailyStats"];

export type AllOverallStats = RouterOutputs["stats"]["getAllOverallStats"];

export type OverallBlobStats = RouterOutputs["stats"]["getBlobOverallStats"];

export type OverallBlockStats = RouterOutputs["stats"]["getBlockOverallStats"];

export type OverallTxStats =
  RouterOutputs["stats"]["getTransactionOverallStats"];
