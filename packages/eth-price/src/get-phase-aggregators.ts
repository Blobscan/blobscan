import { Address } from "viem";

import { EAC } from "../abi/EAC";
import { Aggregator } from "../abi/aggregator";
import { client } from "./client";

type PhaseAggregator = {
  phaseId: number;
  address: Address;
  latestRoundId: bigint;
};

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
