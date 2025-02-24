import { Address } from "viem";

import { EAC } from "../abi/EAC";
import { client } from "./client";

export async function binarySearchRoundId({
  address,
  targetTimestamp,
  tolerance,
  latestRoundId,
}: {
  address: Address;
  targetTimestamp: bigint;
  tolerance: bigint;
  latestRoundId: bigint;
}): Promise<bigint | null> {
  let low = BigInt(0);
  let high = latestRoundId;

  while (low <= high) {
    const mid = low + (high - low) / BigInt(2);

    const timestamp = await client.readContract({
      address,
      abi: EAC,
      functionName: "getTimestamp",
      args: [mid],
    });

    if (
      timestamp >= targetTimestamp - tolerance &&
      timestamp <= targetTimestamp + tolerance
    ) {
      return mid;
    } else if (timestamp < targetTimestamp) {
      low = mid + BigInt(1);
    } else if (timestamp > targetTimestamp) {
      high = mid - BigInt(1);
    }
  }

  return null;
}
