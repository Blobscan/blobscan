import React, { createContext, useContext, useState, useEffect } from "react";

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

const EnvContext = createContext<EnvContextType>({
  env: DEFAULT_ENV,
  isLoading: true,
});

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [env, setEnv] =
    useState<Record<string, string | boolean | undefined>>();

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const request = await fetch("/api/env", { method: "POST" });
        const data = await request.json();
        setEnv(data.data);
      } catch (error) {
        console.error(
          "Error fetching environment variables from server side:",
          error
        );
      }
    };

    fetchEnv();
  }, []);

  return (
    <EnvContext.Provider
      value={{ env: env ? env : DEFAULT_ENV, isLoading: false }}
    >
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
