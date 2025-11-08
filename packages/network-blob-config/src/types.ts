import type * as forks from "./forks";

export type ForkName = keyof typeof forks;

export interface BaseNetworkBlobParams {
  blobBaseFeeUpdateFraction: bigint;
  bytesPerFieldElement: number;
  fieldElementsPerBlob: number;
  gasPerBlob: bigint;
  maxBlobsPerBlock: number;
  minBlobBaseFee: bigint;
  targetBlobsPerBlock: number;
}

export interface DerivedNetworkBlobParams {
  blobGasLimit: bigint;
  targetBlobGasPerBlock: bigint;
}
export type NetworkBlobParams = BaseNetworkBlobParams &
  DerivedNetworkBlobParams;

export type ForkActivationParams = {
  activationSlot: number;
  activationDate: Date;
};

export type Fork = {
  forkName: ForkName;
  blobParams: NetworkBlobParams;
} & ForkActivationParams;
