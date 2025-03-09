import { Address } from "viem";

import { EAC } from "../abi/EAC";
import { Aggregator } from "../abi/aggregator";
import { client } from "./client";

type PhaseAggregator = {
  phaseId: number;
  address: Address;
  latestRoundId: bigint;
};

/**
 * This function gets the phase aggregators contracts of a price feed contract.
 *
 * Definitions:
 *
 *  - Phase: Each time the price feed has a significant change, for example,
 *    when the set of oracles is changed a new phase is created.
 *
 *  - PhaseId: The phaseId is a unique identifier for each phase.
 *
 *  - Phase aggregator contract: The phase aggregator contract is responsible
 *    for aggregating the data for a specific phase.
 *
 *  - Round: Each time new data is added to the price feed, a new round is created.
 *
 *  - RoundId: The roundId is a unique identifier for each round.
 *
 * Note: The price information is stored in rounds in the phase aggregator contracts.
 *
 * This function was extracted from a fragment of this larger function:
 * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/85180c5a1d06eba6e32417bfbf19fcbb53e140be/controllers/index.ts#L108
 *
 * @param address Address of the price feed contract.
 * @returns The phase aggregators of the price feed contract.
 */
export async function getPhaseAggregators(
  address: Address
): Promise<PhaseAggregator[]> {
  const phaseId = await client.readContract({
    address,
    abi: EAC,
    functionName: "phaseId",
  });

  const phaseAggregatorIds: number[] = [];

  for (let i = 1; i <= phaseId; i++) {
    phaseAggregatorIds.push(i);
  }

  const phaseAggregators = await client.multicall({
    contracts: phaseAggregatorIds.map((id) => ({
      address,
      abi: EAC,
      functionName: "phaseAggregators",
      args: [id.toString()],
    })),
  });

  const phaseAggregatorContracts: PhaseAggregator[] = [];

  for (let i = 0; i < phaseAggregators.length; i++) {
    const phaseAggregator = phaseAggregators[i];

    if (phaseAggregator === undefined) {
      continue;
    }

    if (phaseAggregator.status === "failure") {
      continue;
    }

    try {
      const latestRoundId = await client.readContract({
        address: phaseAggregator.result as Address,
        abi: Aggregator,
        functionName: "latestRound",
      });

      phaseAggregatorContracts.push({
        phaseId: i + 1,
        address: phaseAggregator.result as Address,
        latestRoundId,
      });
    } catch (error) {
      continue;
    }
  }

  return phaseAggregatorContracts;
}
