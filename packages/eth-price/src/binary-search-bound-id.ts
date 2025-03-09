import { Address } from "viem";

import { EAC } from "../abi/EAC";
import { client } from "./client";

/**
 * This function finds the roundId that corresponds to a timestamp using binary search.
 *
 * This function is an adaptation of this implementation:
 * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/binarySearch.ts
 *
 * @param address The phase aggregator contract address.
 * @param targetTimestamp The target timestamp.
 * @param tolerance The maximum difference between the target timestamp and the timestamp of the round.
 * @param latestRoundId The latest roundId of the phase aggregator contract.
 * @returns The roundId of the timestamp.
 * If the roundId is not found, it returns null.
 * */
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
