import { useEnv } from "~/providers/Env";
import type { Network } from "~/types";

// Networks where ETH has a market price. The other networks (testnets and
// devnets) use ether with no value, so USD amounts mean nothing there.
const MAINNETS: Network[] = ["mainnet", "gnosis"];

/**
 * Returns true when the current network is a testnet or a devnet. It returns
 * undefined while the env is not loaded.
 */
export function useIsTestnet(): boolean | undefined {
  const { env } = useEnv();

  return env ? !MAINNETS.includes(env.PUBLIC_NETWORK_NAME) : undefined;
}
