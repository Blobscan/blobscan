import { env } from "./env.mjs";

export type EthereumUpgrade = "dencun";

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
  };

export function getEthereumUpgrade(slot: number): EthereumUpgrade {
  switch (env.NEXT_PUBLIC_NETWORK_NAME) {
    default:
      return "dencun";
  }
}

export function getEthereumParams(slot: number): EthereumParameters {
  const upgrade = getEthereumUpgrade(slot);

  return ETHEREUM_PARAMETERS[upgrade];
}
