import type { BaseNetworkBlobParams, NetworkBlobParams } from "./types";

const DEFAULT_BLOB_PARAMS: Omit<BaseNetworkBlobParams, "forkName"> = {
  bytesPerFieldElement: 32,
  fieldElementsPerBlob: 4096,
  gasPerBlob: BigInt(131_072),
  minBlobBaseFee: BigInt(1),
  blobBaseFeeUpdateFraction: BigInt(3_338_477),
  maxBlobsPerBlock: 6,
  targetBlobsPerBlock: 3,
};

function createForkBlobParams(
  params: Partial<BaseNetworkBlobParams>
): NetworkBlobParams {
  const bytesPerFieldElement =
    params.bytesPerFieldElement ?? DEFAULT_BLOB_PARAMS.bytesPerFieldElement;
  const fieldElementsPerBlob =
    params.fieldElementsPerBlob ?? DEFAULT_BLOB_PARAMS.fieldElementsPerBlob;
  const gasPerBlob = params.gasPerBlob ?? DEFAULT_BLOB_PARAMS.gasPerBlob;
  const minBlobBaseFee =
    params.minBlobBaseFee ?? DEFAULT_BLOB_PARAMS.minBlobBaseFee;
  const blobBaseFeeUpdateFraction =
    params.blobBaseFeeUpdateFraction ??
    DEFAULT_BLOB_PARAMS.blobBaseFeeUpdateFraction;
  const maxBlobsPerBlock =
    params.maxBlobsPerBlock ?? DEFAULT_BLOB_PARAMS.maxBlobsPerBlock;
  const targetBlobsPerBlock =
    params.targetBlobsPerBlock ?? DEFAULT_BLOB_PARAMS.targetBlobsPerBlock;

  const blobGasLimit = gasPerBlob * BigInt(maxBlobsPerBlock);
  const targetBlobGasPerBlock = gasPerBlob * BigInt(targetBlobsPerBlock);

  return {
    bytesPerFieldElement,
    fieldElementsPerBlob,
    gasPerBlob,
    minBlobBaseFee,
    blobGasLimit,
    targetBlobsPerBlock,
    maxBlobsPerBlock,
    blobBaseFeeUpdateFraction,
    targetBlobGasPerBlock,
  };
}

export const dencun = createForkBlobParams({
  blobBaseFeeUpdateFraction: BigInt(3_338_477),
  maxBlobsPerBlock: 6,
  targetBlobsPerBlock: 3,
});

export const pectra = createForkBlobParams({
  blobBaseFeeUpdateFraction: BigInt(5_007_716),
  maxBlobsPerBlock: 9,
  targetBlobsPerBlock: 6,
});
