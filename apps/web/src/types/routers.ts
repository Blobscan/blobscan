import type { RouterOutputs } from "~/api-client";

export type AllBlocks = RouterOutputs["block"]["getAll"];

export type Block = RouterOutputs["block"]["getByHash"];

export type Transaction = RouterOutputs["tx"]["getByHash"];

export type AllTransactions = RouterOutputs["tx"]["getAll"];

export type Blob = RouterOutputs["blob"]["getByVersionedHash"];

export type DailyBlobStats = RouterOutputs["stats"]["blob"]["getDailyStats"];

export type SingleDailyBlobStats = DailyBlobStats[number];

export type DailyBlockStats = RouterOutputs["stats"]["block"]["getDailyStats"];

export type SingleDailyBlockStats = DailyBlockStats[number];

export type DailyTransactionStats =
  RouterOutputs["stats"]["transaction"]["getDailyStats"];

export type SingleDailyTransactionStats = DailyTransactionStats[number];

export type AllOverallStats = RouterOutputs["stats"]["getAllOverallStats"];

export type OverallBlobStats =
  RouterOutputs["stats"]["blob"]["getOverallStats"];

export type OverallBlockStats =
  RouterOutputs["stats"]["block"]["getOverallStats"];

export type OverallTxStats =
  RouterOutputs["stats"]["transaction"]["getOverallStats"];
