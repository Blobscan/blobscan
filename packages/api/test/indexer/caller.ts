import { indexerRouter } from "../../src/routers/indexer";
import { t } from "../../src/trpc-client";

export const createIndexerCaller = t.createCallerFactory(indexerRouter);

export type IndexerCaller = ReturnType<typeof createIndexerCaller>;
