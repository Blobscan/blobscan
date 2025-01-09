import React, { createContext, useContext, useState, useEffect } from "react";

import { api } from "~/api-client";

interface EnvContextType {
  env: Record<string, string | boolean | undefined>;
  isLoading: boolean;
}

//TODO: discuss if we should have a default value
const DEFAULT_ENV = {
  PUBLIC_BEACON_BASE_URL: "https://beaconcha.in/",
  PUBLIC_BLOBSCAN_RELEASE: undefined,
  PUBLIC_EXPLORER_BASE_URL: "https://etherscan.io/",
  PUBLIC_NETWORK_NAME: "mainnet",
  PUBLIC_SENTRY_DSN_WEB: undefined,
  PUBLIC_POSTHOG_ID: undefined,
  PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
  PUBLIC_SUPPORTED_NETWORKS:
    '[{"label":"Ethereum Mainnet","href":"https://blobscan.com/"},{"label":"Gnosis","href":"https://gnosis.blobscan.com/"},{"label":"Holesky Testnet","href":"https://holesky.blobscan.com/"},{"label":"Sepolia Testnet","href":"https://sepolia.blobscan.com/"}]',
  PUBLIC_VERCEL_ANALYTICS_ENABLED: false,
  PUBLIC_VERCEL_GIT_COMMIT_SHA: undefined,
};

const LOCAL_STORAGE_KEY = "env";

const EnvContext = createContext<EnvContextType>({
  env: DEFAULT_ENV,
  isLoading: true,
});

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: fetchedEnv, isLoading } = api.getEnv.useQuery();
  const [env, setEnv] = useState<Record<string, string | boolean | undefined>>(
    () => {
      let storedEnv;
      if (global?.window !== undefined) localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedEnv ? JSON.parse(storedEnv) : DEFAULT_ENV;
    }
  );

  useEffect(() => {
    if (
      typeof window !== undefined &&
      localStorage &&
      fetchedEnv &&
      !isLoading
    ) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fetchedEnv));
      setEnv(fetchedEnv);
    }
  }, [fetchedEnv, isLoading]);

  return (
    <EnvContext.Provider value={{ env, isLoading }}>
      {children}
    </EnvContext.Provider>
  );
};

export const useEnv = () => {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error("useEnv must be used within an EnvProvider");
  }
  return context;
};
