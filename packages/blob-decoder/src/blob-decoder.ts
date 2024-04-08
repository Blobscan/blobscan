import { StarknetStateDiff, decodeStarknetBlob } from "./starknet";
import { DecodableRollup } from "./types";

export function isDecodableRollup(rollup: string): rollup is DecodableRollup {
  return rollup === "STARKNET";
}

export async function decodeBlob(
  rollup: "STARKNET",
  blobData: string
): Promise<StarknetStateDiff[]>;
export async function decodeBlob(rollup: DecodableRollup, blobData: string) {
  switch (rollup) {
    case "STARKNET":
      return decodeStarknetBlob(blobData);
    default:
      throw new Error(`Unsupported rollup: ${rollup}`);
  }
}
