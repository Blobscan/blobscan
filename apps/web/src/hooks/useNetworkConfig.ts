import {
  getNetworkBlobConfigBySlot,
  NETWORK_FIRST_BLOCK,
} from "@blobscan/network-blob-config";

import { useEnv } from "~/providers/Env";

export function useNetworkConfig(slot?: number) {
  const { env } = useEnv();
  const firstBlock = env
    ? NETWORK_FIRST_BLOCK[env?.PUBLIC_NETWORK_NAME]
    : undefined;

  return {
    config:
      env && slot
        ? getNetworkBlobConfigBySlot(env.PUBLIC_NETWORK_NAME, slot)
        : undefined,
    firstBlock,
  };
}
