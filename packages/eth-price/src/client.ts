import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { env } from "@blobscan/env";

export const client = createPublicClient({
  chain: {
    ...mainnet,
    rpcUrls: {
      default: {
        http: [env.RPC_URL],
      },
    },
  },
  transport: http(),
});
