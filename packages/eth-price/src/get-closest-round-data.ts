import { Address } from "viem";

import { binarySearchRoundId } from "./binary-search-bound-id";
import { getPhaseAggregators } from "./get-phase-aggregators";

type RoundData = {
  phaseId: number;
  roundId: bigint;
  phaseAggregatorContractAddress: Address;
};

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
