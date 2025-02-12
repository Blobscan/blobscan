import { env } from "./env.mjs";

export type EthereumUpgrade = "dencun" | "pectra";

export type EthereumParameters = {
  targetBlobsPerBlock: number;
  blobSize: number;
  blockBlobGasLimit: bigint;
  gasPerBlob: bigint;
  maxBlobsPerBlock: number;
  targetBlobGasPerBlock: bigint;
};

const COMMON_PARAMETERS = {
  gasPerBlob: BigInt(131_072),
  blobSize: 131_072,
};

export const ETHEREUM_PARAMETERS: Record<EthereumUpgrade, EthereumParameters> =
  {
    dencun: {
      ...COMMON_PARAMETERS,
      targetBlobsPerBlock: 3,
      maxBlobsPerBlock: 6,
      targetBlobGasPerBlock: BigInt(393_216),
      blockBlobGasLimit: BigInt(786_432),
    },
    pectra: {
      ...COMMON_PARAMETERS,
      targetBlobsPerBlock: 6,
      maxBlobsPerBlock: 9,
      targetBlobGasPerBlock: BigInt(786_432),
      blockBlobGasLimit: BigInt(1_179_648),
    },
  };

export function getEthereumUpgrade(slot: number): EthereumUpgrade {
  switch (env.NEXT_PUBLIC_NETWORK_NAME) {
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

export function getEthereumParams(slot: number): EthereumParameters {
  const upgrade = getEthereumUpgrade(slot);

  return ETHEREUM_PARAMETERS[upgrade];
}
