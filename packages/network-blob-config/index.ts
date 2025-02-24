export type NetworkFork = "dencun" | "pectra";

export type Network =
  | "mainnet"
  | "holesky"
  | "sepolia"
  | "gnosis"
  | "chiado"
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
  blobBaseFeeUpdateFraction: BigInt(3_338_477),
  minBlobBaseFee: BigInt(1),
};

export const FORK_BLOB_CONFIGS: Record<NetworkFork, NetworkBlobConfig> = {
  dencun: {
    ...COMMON_NETWORK_BLOB_CONFIG,
    targetBlobsPerBlock: 3,
    maxBlobsPerBlock: 6,
    targetBlobGasPerBlock: BigInt(393_216),
    blobGasLimit: BigInt(786_432),
  },
  pectra: {
    ...COMMON_NETWORK_BLOB_CONFIG,
    targetBlobsPerBlock: 6,
    maxBlobsPerBlock: 9,
    targetBlobGasPerBlock: BigInt(786_432),
    blobGasLimit: BigInt(1_179_648),
  },
};

export function getNetworkForkBySlot(
  network: Network,
  slot: number
): NetworkFork {
  switch (network) {
    case "holesky": {
      return slot >= 3710976 ? "pectra" : "dencun";
    }
    case "sepolia": {
      return slot >= 7118848 ? "pectra" : "dencun";
    }
    default:
      return "dencun";
  }
}

function getNetworkNameById(networkId: number): Network {
  switch (networkId) {
    case 1:
      return "mainnet";
    case 17000:
      return "holesky";
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

  return FORK_BLOB_CONFIGS[upgrade];
}
