import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const client = createPublicClient({
  chain: {
    ...mainnet,
    rpcUrls: {
      default: {
        http: [process.env.RPC_URL!],
      },
    },
  },
  transport: http(),
});
