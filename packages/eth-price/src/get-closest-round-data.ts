import { Address } from "viem";

import { binarySearchRoundId } from "./binary-search-bound-id";
import { getPhaseAggregators } from "./get-phase-aggregators";

type RoundData = {
  phaseId: number;
  roundId: bigint;
  phaseAggregatorContractAddress: Address;
};

/**
 * This function gets the round data that is closest to the target timestamp.
 *
 * This function is an adaptation of this implementation:
 * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/getStartPhaseData.ts
 *
 * @param address The price feed contract address.
 * @param targetTimestamp The target timestamp.
 * @param tolerance The maximum difference between the target timestamp and the timestamp of the round.
 * @returns The round data that is closest to the target timestamp.
 * If the round data is not found, it returns null.
 */
export async function getClosestRoundData({
  address,
  targetTimestamp,
  tolerance,
}: {
  address: Address;
  targetTimestamp: bigint;
  tolerance: bigint;
}): Promise<RoundData | null> {
  const phaseAggregators = await getPhaseAggregators(address);
  phaseAggregators.sort((a, b) => b.phaseId - a.phaseId);

  for (const phaseAggregatorContract of phaseAggregators) {
    const roundId = await binarySearchRoundId({
      address: phaseAggregatorContract.address,
      targetTimestamp,
      latestRoundId: phaseAggregatorContract.latestRoundId,
      tolerance,
    });

    if (roundId === null) {
      continue;
    }

    return {
      roundId,
      phaseId: phaseAggregatorContract.phaseId,
      phaseAggregatorContractAddress: phaseAggregatorContract.address,
    };
  }

  return null;
}
