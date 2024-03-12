import type { Environment } from "./env";

export function getNetworkDencunForkSlot(
  networkName: Environment["NETWORK_NAME"]
): number {
  switch (networkName) {
    case "mainnet":
      return 8626176;
    case "goerli":
      return 7413760;
    case "holesky":
      return 950272;
    case "sepolia":
      return 4243456;
    case "gnosis":
      return 14237696;
    case "chiado":
      return 8265728;
    case "devnet":
      return 0;
  }
}
