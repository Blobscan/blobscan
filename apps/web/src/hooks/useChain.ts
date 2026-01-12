import { useMemo } from "react";

import { getChain } from "@blobscan/chains";

import { useEnv } from "~/providers/Env";

export function useChain() {
  const { env } = useEnv();

  return useMemo(
    () => (env ? getChain(env.PUBLIC_NETWORK_NAME) : undefined),
    [env]
  );
}
