import type { Decoder } from "@blobscan/blob-decoder";

export function isValidDecoder(decoder: string): decoder is Decoder {
  return decoder === "starknet";
}
