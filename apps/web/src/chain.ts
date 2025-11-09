import { getChain } from "@blobscan/chains";

import { env } from "./env.mjs";

export const chain = getChain(env.CHAIN_ID);
