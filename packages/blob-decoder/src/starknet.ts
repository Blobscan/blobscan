import { blob_recover } from "@blobscan/majin-blob-wasm";
import { z } from "@blobscan/zod";

import { BlobDecoderFn } from "./types";
import { bigIntToHex } from "./utils";

export const starknetStateDiffSchema = z
  .object({
    address: z.string(),
    nonce: z.number(),
    number_of_storage_updates: z.number(),
    new_class_hash: z.string(),
    storage_updates: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    ),
  })
  .transform((data) => ({
    contractAddress: data.address,
    nonce: data.nonce,
    numberOfStorageUpdates: data.number_of_storage_updates,
    newClassHash: data.new_class_hash,
    storageUpdates: data.storage_updates,
  }));

export type StarknetStateDiff = z.infer<typeof starknetStateDiffSchema>;

export type DecodedStarknetBlob = StarknetStateDiff[];

function normalizeBlobData(blobData: string) {
  return blobData.startsWith("0x") ? blobData.slice(2) : blobData;
}

export const decodeStarknetBlob: BlobDecoderFn<DecodedStarknetBlob> = function (
  blobData
) {
  const normalizedBlobData = normalizeBlobData(blobData);
  const result = blob_recover(normalizedBlobData);
  const decodedBlob = JSON.parse(result);

  const starknetStateDiffs = starknetStateDiffSchema.array().parse(decodedBlob);

  return starknetStateDiffs.map<StarknetStateDiff>((entry) => {
    return {
      contractAddress: bigIntToHex(entry.contractAddress),
      nonce: entry.nonce,
      numberOfStorageUpdates: entry.numberOfStorageUpdates,
      newClassHash: bigIntToHex(entry.newClassHash),
      storageUpdates: entry.storageUpdates.map((storageUpdage) => ({
        key: bigIntToHex(storageUpdage.key),
        value: bigIntToHex(storageUpdage.value),
      })),
    };
  });
};
