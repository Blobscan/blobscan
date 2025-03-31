import { createPublicClient } from "viem";
import type { PublicClient } from "viem";
import { http } from "viem";
import { foundry, mainnet } from "viem/chains";

let client: PublicClient;

export function getViemClient() {
  if (!client) {
    client = createPublicClient({
      chain: {
        ...foundry,
        contracts: {
          multicall3: mainnet.contracts.multicall3,
        },
      },
      transport: http(),
    });
  }

  return client;
}
