import { addressRouter } from "../../src/routers/address";
import { t } from "../../src/trpc-client";

export const createAddressCaller = t.createCallerFactory(addressRouter);

export type AddressCaller = ReturnType<typeof createAddressCaller>;
