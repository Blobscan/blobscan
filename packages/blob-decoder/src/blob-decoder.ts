import { decodeStarknetBlob } from "./starknet";
import type { DecodedStarknetBlob } from "./starknet";
import { Decoder } from "./types";

export type DecodedResultOf<T extends Decoder> = T extends "starknet"
  ? DecodedStarknetBlob
  : never;

export function isValidDecoder(decoder: string): decoder is Decoder {
  return decoder === "starknet";
}

export async function decodeBlob<D extends Decoder>(
  blobData: string,
  decoder: D
): Promise<DecodedResultOf<D>> {
  let result;

  try {
    switch (decoder) {
      case "starknet":
        result = decodeStarknetBlob(blobData);

        break;
    }
  } catch (err) {
    console.error(err);

    throw new Error(`Failed to decode ${decoder} blob`);
  }

  return result as DecodedResultOf<D>;
}
