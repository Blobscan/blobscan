import { blockRouter } from "../../src/routers/block";
import { t } from "../../src/trpc-client";

export const createBlockCaller = t.createCallerFactory(blockRouter);

export type BlockCaller = ReturnType<typeof createBlockCaller>;
