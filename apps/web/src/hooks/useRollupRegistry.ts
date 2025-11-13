import { useEffect, useState } from "react";

import { RollupRegistry } from "@blobscan/rollups";

import { useChain } from "./useChain";

export function useRollupRegistry() {
  const chain = useChain();
  const [rollupRegistry, setRollupRegistry] = useState<RollupRegistry>();

  useEffect(() => {
    if (!chain) {
      return;
    }

    setRollupRegistry(RollupRegistry.create(chain.id));
  }, [chain]);

  return rollupRegistry;
}
