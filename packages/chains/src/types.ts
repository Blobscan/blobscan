import type * as forks from "./forks";

export type ForkName = keyof typeof forks;

export interface BaseChainBlobParams {
  blobBaseFeeUpdateFraction: bigint;
  bytesPerFieldElement: number;
  fieldElementsPerBlob: number;
  gasPerBlob: bigint;
  maxBlobsPerBlock: number;
  minBlobBaseFee: bigint;
  targetBlobsPerBlock: number;
}

export interface DerivedChainBlobParams {
  blobGasLimit: bigint;
  targetBlobGasPerBlock: bigint;
}
export type ChainBlobParams = BaseChainBlobParams & DerivedChainBlobParams;

export type ForkActivationParams = {
  activationSlot: number;
  activationDate: Date;
};

export type Fork = {
  forkName: ForkName;
  blobParams: ChainBlobParams;
} & ForkActivationParams;
