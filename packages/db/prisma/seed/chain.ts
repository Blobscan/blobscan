import { getChain } from "@blobscan/chains";
import { RollupRegistry } from "@blobscan/rollups";

export const chain = getChain("mainnet");

export const mainnetRollupRegistry = RollupRegistry.create(1);
