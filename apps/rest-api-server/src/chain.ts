import { getChain } from "@blobscan/chains";
import { env } from "@blobscan/env";

export const chain = getChain(env.CHAIN_ID);
