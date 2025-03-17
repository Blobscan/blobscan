import { Address } from "viem";

import { binarySearchRoundId } from "./binary-search-bound-id";
import { getPhaseAggregators } from "./get-phase-aggregators";

type Round = {
  phaseId: number;
  roundId: bigint;
  phaseAggregatorAddress: Address;
};

/**
 * This function gets the round data that is closest to the target timestamp.
 *
 * This function is an adaptation of this implementation:
 * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/getStartPhaseData.ts
 *
 * @param address The price feed contract address.
 * @param targetTimestampSeconds The target timestamp.
 * @param tolerance The maximum difference between the target timestamp and the timestamp of the round.
 * @returns The round data that is closest to the target timestamp.
 * If the round data is not found, it returns null.
 */
export async function getClosestRoundData({
  address,
  targetTimestampSeconds,
  tolerance,
}: {
  address: Address;
  targetTimestampSeconds: bigint;
  tolerance: bigint;
}): Promise<Round | null> {
  const phaseAggregators = await getPhaseAggregators(address);
  phaseAggregators.sort((a, b) => b.phaseId - a.phaseId);

  for (const phaseAggregator of phaseAggregators) {
    const roundId = await binarySearchRoundId({
      address: phaseAggregator.address,
      targetTimestampSeconds,
      latestRoundId: phaseAggregator.latestRoundId,
      tolerance,
    });

    if (roundId === null) {
      continue;
    }

    return {
      roundId,
      phaseId: phaseAggregator.phaseId,
      phaseAggregatorAddress: phaseAggregator.address,
    };
  }

  return null;
}
