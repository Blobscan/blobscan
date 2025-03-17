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

export async function getPhaseAggregatorByPhaseId({
  address,
  phaseId,
}: {
  address: Address;
  phaseId: number;
}): Promise<PhaseAggregator> {
  const phaseAggregatorAddress = await client.readContract({
    address,
    abi: EAC,
    functionName: "phaseAggregators",
    args: [phaseId],
  });

  if (phaseAggregatorAddress === null) {
    throw new Error("Phase aggregator not found");
  }

  const latestRoundId = await client.readContract({
    address: phaseAggregatorAddress,
    abi: Aggregator,
    functionName: "latestRound",
  });

  return {
    phaseId,
    address: phaseAggregatorAddress,
    latestRoundId,
  };
}
