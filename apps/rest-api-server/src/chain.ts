import { getChain } from "@blobscan/chains";
import { env } from "@blobscan/env";
import { RollupRegistry } from "@blobscan/rollups";

export const chain = getChain(env.CHAIN_ID);
export const rollupRegistry = RollupRegistry.create(env.CHAIN_ID);
