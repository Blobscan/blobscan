import { blob_recover } from "@blobscan/majin-blob-wasm";
import { z } from "@blobscan/zod";

import type { BlobDecoderFn } from "./types";
import { bigIntToHex, stripHexPrefix } from "./utils";

export type DecodedStarknetBlob = z.infer<typeof decodedStarknetBlobSchema>;

const CONTRACT_ADDRESS_LENGTH = 66;

function recoverContractAddress(rawAddress: string) {
  const address = bigIntToHex(rawAddress);

  if (address.length === CONTRACT_ADDRESS_LENGTH) {
    return address;
  }

  const padding = "0".repeat(66 - address.length);

  return `0x${padding}${address.slice(2)}`;
}

const decodedStarknetBlobSchema = z
  .object({
    class_declaration: z.array(
      z.object({
        class_hash: z.string(),
        compiled_class_hash: z.string(),
      })
    ),
    class_declaration_size: z.number(),
    state_update: z.array(
      z.object({
        address: z.string(),
        new_class_hash: z.string().nullable(),
        nonce: z.number(),
        number_of_storage_updates: z.number(),
        storage_updates: z.array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        ),
      })
    ),
    state_update_size: z.number(),
  })
  .transform((data) => ({
    classDeclarations: data.class_declaration.map((classDeclaration) => ({
      classHash: bigIntToHex(classDeclaration.class_hash),
      compiledClassHash: bigIntToHex(classDeclaration.compiled_class_hash),
    })),
    classDeclarationsSize: data.class_declaration_size,
    stateUpdates: data.state_update.map((stateUpdate) => ({
      contractAddress: recoverContractAddress(stateUpdate.address),
      newClassHash: stateUpdate.new_class_hash
        ? bigIntToHex(stateUpdate.new_class_hash)
        : null,
      nonce: stateUpdate.nonce,
      numberOfStorageUpdates: stateUpdate.number_of_storage_updates,
      storageUpdates: stateUpdate.storage_updates.map((storageUpdate) => ({
        key: bigIntToHex(storageUpdate.key),
        value: bigIntToHex(storageUpdate.value),
      })),
    })),
    stateUpdatesSize: data.state_update_size,
  }));

export const decodeStarknetBlob: BlobDecoderFn<DecodedStarknetBlob> = function (
  blobData
): DecodedStarknetBlob {
  const normalizedBlobData = stripHexPrefix(blobData);
  let recoveredBlob = "";

  try {
    recoveredBlob = blob_recover(normalizedBlobData);
  } catch (error) {
    throw new Error("Failed to recover blob", {
      cause: error,
    });
  }
  const rawDecodedBlob = JSON.parse(recoveredBlob);
  const result = decodedStarknetBlobSchema.safeParse(rawDecodedBlob);

  if (!result.success) {
    throw new Error("Failed to parse decoded blob", {
      cause: result.error.message,
    });
  }

  return result.data;
};
