import type { RouterOutputs } from "~/api-client";

export type AllBlocks = RouterOutputs["block"]["getAll"];

export type GetByBlockIdOutput = RouterOutputs["block"]["getByBlockId"];

export type ExpandedBlock = RouterOutputs["tx"]["getByHash"]["block"];

export type GetTxByHashOutput = RouterOutputs["tx"]["getByHash"];

export type AllTransactions = RouterOutputs["tx"]["getAll"];

export type GetAllBlobsOutput = RouterOutputs["blob"]["getAll"];

export type GetByBlobIdOutput = RouterOutputs["blob"]["getByBlobId"];

export type DailyBlockStats = RouterOutputs["stats"]["getBlockDailyStats"];

export type DailyTransactionStats =
  RouterOutputs["stats"]["getTransactionDailyStats"];

export type DailyStats = RouterOutputs["stats"]["getDailyStats"][number];

export type OverallStats = RouterOutputs["stats"]["getOverallStats"];
