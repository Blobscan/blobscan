import { useEnv } from "~/providers/Env";

/** Returns undefined until the network configuration is available. */
export function useHasEthPrice(): boolean | undefined {
  const { env } = useEnv();

  return env ? env.PUBLIC_NETWORK_NAME === "mainnet" : undefined;
}
