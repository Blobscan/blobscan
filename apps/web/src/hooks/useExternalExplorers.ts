import { useCallback, useMemo } from "react";

import type {
  ExternalExplorer,
  ExternalExplorerId,
} from "~/external-explorers";
import {
  EXTERNAL_CONSENSUS_EXPLORERS,
  EXTERNAL_EXECUTION_EXPLORERS,
} from "~/external-explorers";
import { useEnv } from "~/providers/Env";

export type ExplorerResource = {
  type: "address" | "blob" | "block" | "tx" | "slot";
  value: number | string;
};

export type ExplorerType = "consensus" | "execution";

export const useExternalExplorers = function (type: ExplorerType) {
  const { env } = useEnv();
  const isExecutionExplorer = type === "execution";
  const networkName = env?.PUBLIC_NETWORK_NAME;
  const customExplorerUrl = isExecutionExplorer
    ? env?.PUBLIC_EXPLORER_BASE_URL
    : env?.PUBLIC_BEACON_BASE_URL;
  const explorers = useMemo(() => {
    if (customExplorerUrl) {
      return [
        {
          id: "custom",
          label: "External Explorer",
          urls: {
            devnet: customExplorerUrl,
            gnosis: customExplorerUrl,
            holesky: customExplorerUrl,
            hoodi: customExplorerUrl,
            mainnet: customExplorerUrl,
            sepolia: customExplorerUrl,
          },
        },
      ] satisfies ExternalExplorer[];
    }

    return isExecutionExplorer
      ? EXTERNAL_EXECUTION_EXPLORERS
      : EXTERNAL_CONSENSUS_EXPLORERS;
  }, [customExplorerUrl, isExecutionExplorer]);

  const buildResourceUrl = useCallback(
    (explorer: ExternalExplorerId, { type, value }: ExplorerResource) => {
      const explorerData = explorers.find((e) => e.id === explorer);

      if (!explorerData || !networkName) {
        return "#";
      }

      const url = `${explorerData.urls[networkName]}/${type}/${value}`;

      if (explorerData.id === "blockscout" && type === "blob") {
        return url.replace("/blob/", "/blobs/");
      }

      return url;
    },
    [explorers, networkName]
  );

  return {
    explorers,
    buildResourceUrl,
  };
};
