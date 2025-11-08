import { getNetwork } from "@blobscan/network-blob-config";

import { env } from "./env.mjs";

export const network = getNetwork(env.CHAIN_ID);
