export type EthereumUpgrade = "dencun" | "pectra";

export type EthereumNetwork =
  | "mainnet"
  | "holesky"
  | "sepolia"
  | "gnosis"
  | "chiado"
  | "devnet";

export type EthereumUpgradeConfig = {
  targetBlobsPerBlock: number;
  blobBaseFeeUpdateFraction: bigint;
  blobSize: number;
  blockBlobGasLimit: bigint;
  gasPerBlob: bigint;
  maxBlobsPerBlock: number;
  minBlobBaseFee: bigint;
  targetBlobGasPerBlock: bigint;
};

const COMMON_CONFIG = {
  gasPerBlob: BigInt(131_072),
  blobSize: 131_072,
  blobBaseFeeUpdateFraction: BigInt(3_338_477),
  minBlobBaseFee: BigInt(1),
};

export const ETHEREUM_CONFIG: Record<EthereumUpgrade, EthereumUpgradeConfig> = {
  dencun: {
    ...COMMON_CONFIG,
    targetBlobsPerBlock: 3,
    maxBlobsPerBlock: 6,
    targetBlobGasPerBlock: BigInt(393_216),
    blockBlobGasLimit: BigInt(786_432),
  },
  pectra: {
    ...COMMON_CONFIG,
    targetBlobsPerBlock: 6,
    maxBlobsPerBlock: 9,
    targetBlobGasPerBlock: BigInt(786_432),
    blockBlobGasLimit: BigInt(1_179_648),
  },
};

export function getEthereumUpgrade(
  network: EthereumNetwork,
  slot: number
): EthereumUpgrade {
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

function getNetworkNameById(networkId: number): EthereumNetwork {
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
export function getEthereumConfig(
  networkNameOrId: EthereumNetwork | number,
  slot: number
): EthereumUpgradeConfig {
  const network =
    typeof networkNameOrId === "number"
      ? getNetworkNameById(networkNameOrId)
      : networkNameOrId;
  const upgrade = getEthereumUpgrade(network, slot);

  return ETHEREUM_CONFIG[upgrade];
}
