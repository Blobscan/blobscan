import { env } from "@blobscan/env";
import { getNetwork } from "@blobscan/network-blob-config";

export const network = getNetwork(env.CHAIN_ID);
