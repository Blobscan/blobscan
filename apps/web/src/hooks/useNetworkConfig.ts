import { getChain } from "@blobscan/chains";

import { useEnv } from "~/providers/Env";

export function useNetworkConfig(slot?: number) {
  const { env } = useEnv();
  const network = env && slot ? getChain(env.PUBLIC_NETWORK_NAME) : undefined;

  return {
    config:
      env && slot ? network?.getActiveForkBySlot(slot)?.blobParams : undefined,
    firstBlock: network?.firstBlobBlock,
  };
}
