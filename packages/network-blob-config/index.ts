export type NetworkFork = "dencun" | "pectra";

export type Network =
  | "mainnet"
  | "holesky"
  | "hoodi"
  | "sepolia"
  | "gnosis"
  | "devnet";

export type NetworkBlobConfig = {
  blobBaseFeeUpdateFraction: bigint;
  blobGasLimit: bigint;
  bytesPerFieldElement: number;
  fieldElementsPerBlob: number;
  gasPerBlob: bigint;
  maxBlobsPerBlock: number;
  minBlobBaseFee: bigint;
  targetBlobGasPerBlock: bigint;
  targetBlobsPerBlock: number;
};

const COMMON_NETWORK_BLOB_CONFIG = {
  bytesPerFieldElement: 32,
  fieldElementsPerBlob: 4096,
  gasPerBlob: BigInt(131_072),
  minBlobBaseFee: BigInt(1),
};

export const FORK_BLOB_CONFIG: Record<NetworkFork, NetworkBlobConfig> = {
  dencun: {
    ...COMMON_NETWORK_BLOB_CONFIG,
    targetBlobsPerBlock: 3,
    maxBlobsPerBlock: 6,
    targetBlobGasPerBlock: BigInt(393_216),
    blobBaseFeeUpdateFraction: BigInt(3_338_477),
    blobGasLimit: BigInt(786_432),
  },
  pectra: {
    ...COMMON_NETWORK_BLOB_CONFIG,
    targetBlobsPerBlock: 6,
    maxBlobsPerBlock: 9,
    targetBlobGasPerBlock: BigInt(786_432),
    blobBaseFeeUpdateFraction: BigInt(5007716),
    blobGasLimit: BigInt(1_179_648),
  },
};

export const NETWORK_FIRST_BLOCK: Record<Network, { number: number }> = {
  devnet: { number: 0 },
  gnosis: { number: 32880709 },
  holesky: { number: 894735 },
  hoodi: { number: 0 },
  mainnet: { number: 19426589 },
  sepolia: { number: 5187052 },
};

export function getNetworkForkBySlot(
  network: Network,
  slot: number
): NetworkFork {
  switch (network) {
    case "mainnet": {
      return slot >= 11649024 ? "pectra" : "dencun";
    }
    case "gnosis": {
      return slot >= 21405696 ? "pectra" : "dencun";
    }
    case "holesky": {
      return slot >= 3710976 ? "pectra" : "dencun";
    }
    case "hoodi": {
      return slot >= 2048 ? "pectra" : "dencun";
    }
    case "sepolia": {
      return slot >= 7118848 ? "pectra" : "dencun";
    }
    default:
      return "dencun";
  }
}

export function getNetworkForkTimestamp(
  networkIdOrName: Network | number
): number {
  const networkName =
    typeof networkIdOrName === "number"
      ? getNetworkNameById(networkIdOrName)
      : networkIdOrName;

  switch (networkName) {
    case "mainnet": {
      return 1710338159;
    }
    case "gnosis": {
      return 1710181965;
    }
    case "holesky": {
      return 1707305700;
    }
    case "hoodi": {
      return 0;
    }
    case "sepolia": {
      return 1706655456;
    }
    default: {
      return 1707305700;
    }
  }
}

function getNetworkNameById(networkId: number): Network {
  switch (networkId) {
    case 1:
      return "mainnet";
    case 17000:
      return "holesky";
    case 560048:
      return "hoodi";
    case 11155111:
      return "sepolia";
    case 100:
      return "gnosis";
    default:
      return "devnet";
  }
}
export function getNetworkBlobConfigBySlot(
  networkNameOrId: Network | number,
  slot: number
): NetworkBlobConfig {
  const network =
    typeof networkNameOrId === "number"
      ? getNetworkNameById(networkNameOrId)
      : networkNameOrId;
  const upgrade = getNetworkForkBySlot(network, slot);

  return FORK_BLOB_CONFIG[upgrade];
}
