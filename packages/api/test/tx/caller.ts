import { transactionRouter } from "../../src/routers/tx";
import { t } from "../../src/trpc-client";

export const createTransactionCaller = t.createCallerFactory(transactionRouter);

export type TxCaller = ReturnType<typeof createTransactionCaller>;
