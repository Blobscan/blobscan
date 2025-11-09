import { getChain } from "@blobscan/chains";

import { useEnv } from "~/providers/Env";

export function useChain() {
  const { env } = useEnv();

  if (!env) {
    return;
  }

  return getChain(env.PUBLIC_NETWORK_NAME);
}
