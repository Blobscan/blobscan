import { useMemo } from "react";

import { getChain } from "@blobscan/chains";

import { useEnv } from "~/providers/Env";

function findChain(networkName: string) {
  // Some networks have no chain config, for example devnet.
  try {
    return getChain(networkName);
  } catch {
    return;
  }
}

export function useChain() {
  const { env } = useEnv();

  return useMemo(
    () => (env ? findChain(env.PUBLIC_NETWORK_NAME) : undefined),
    [env]
  );
}
