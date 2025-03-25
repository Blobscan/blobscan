import { Address, PublicClient, TestClient } from "viem";

import { EAC } from "../abi/EAC";
import { Aggregator } from "../abi/aggregator";

export type PriceData = {
  phaseId: number;
  roundId: bigint;
  price: bigint;
  timestampSeconds: bigint;
};

type RoundData = {
  price: bigint;
  timestamp: bigint;
};

type Round = {
  phaseId: number;
  roundId: bigint;
  phaseAggregatorAddress: Address;
};

type PhaseAggregator = {
  phaseId: number;
  address: Address;
  latestRoundId: bigint;
};

export class PriceFeedFinder {
  /**
   * @param client The client used to interact with the data feed contract.
   * @param priceFeedContractAddress The price feed contract address.
   * @param tolerance The maximum difference between the target timestamp and the timestamp of the round.
   */
  constructor(
    private client: PublicClient,
    private priceFeedContractAddress: Address,
    private tolerance: bigint
  ) {}

  /**
   * Get the price of an asset at a specific timestamp.
   *
   * This function uses the Chainlink price feed to get the price of an asset at a specific timestamp.
   *
   * Before explaining the function, it is important to understand some concepts about Chainlink price feeds:
   *
   *  - Round: Each time new data is added to the price feed, a new round is created.
   *
   *  - RoundId: The roundId is a unique identifier for each round.
   *
   *  - Phase: Each time the price feed has a significant change, for example,
   *    when the set of oracles is changed a new phase is created.
   *
   *  - PhaseId: The phaseId is a unique identifier for each phase.
   *
   *  - Phase aggregator contract: Each time a new phase is created, a new phase aggregator contract is deployed.
   *    The phase aggregator contract is responsible for aggregating the data for a specific phase.
   *
   * Note: The price information is stored in rounds in the phase aggregator contracts.
   *
   * Basic steps:
   *    1. We get the phase aggregator contracts of the price feed contract.
   *    (This is done by calling the getPhaseAggregators inside the getClosestRoundData function).
   *
   *    2. Inside each phase aggregator contract, we find the round that is closest to the target timestamp.
   *   (This is done by calling the binarySearchRoundId inside the getClosestRoundData function).
   *
   *    3. We get the data from the retrieved round.
   *
   * Aditional information can be found here: https://docs.chain.link/data-feeds
   *
   * @param targetTimestampSeconds The timestamp for which the price is requested in seconds.
   * @returns The price of the asset at the given timestamp.
   **/
  async getPriceByTimestamp(
    targetTimestampSeconds: bigint
  ): Promise<PriceData> {
    const closestRound = await this.#getClosestRoundData(
      targetTimestampSeconds
    );

    if (closestRound === null) {
      throw new Error(
        `Could not retrieve ETH price from Chainlink oracle using timestamp: ${targetTimestampSeconds}`
      );
    }

    const roundData = await this.#getRoundData(closestRound);

    return {
      phaseId: closestRound.phaseId,
      roundId: closestRound.roundId,
      price: roundData.price,
      timestampSeconds: roundData.timestamp,
    };
  }

  /**
   * Finds the roundId that corresponds to a timestamp using binary search.
   *
   * This function is an adaptation of this implementation:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/binarySearch.ts
   *
   * @param targetTimestampSeconds The target timestamp.
   * @param latestRoundId The latest roundId of the phase aggregator contract.
   * @returns The roundId of the timestamp. If the roundId is not found, it returns null.
   * */
  async #binarySearchRoundId(
    aggregatorContractAddress: Address,
    targetTimestampSeconds: bigint,
    latestRoundId: bigint
  ): Promise<bigint | null> {
    let low = BigInt(0);
    let high = latestRoundId;

    while (low <= high) {
      const mid = low + (high - low) / BigInt(2);

      const timestamp = await this.client.readContract({
        address: aggregatorContractAddress,
        abi: EAC,
        functionName: "getTimestamp",
        args: [mid],
      });

      if (
        timestamp >= targetTimestampSeconds - this.tolerance &&
        timestamp <= targetTimestampSeconds + this.tolerance
      ) {
        return mid;
      } else if (timestamp < targetTimestampSeconds) {
        low = mid + BigInt(1);
      } else if (timestamp > targetTimestampSeconds) {
        high = mid - BigInt(1);
      }
    }

    return null;
  }

  /**
   * Gets the round data that is closest to the target timestamp.
   *
   * This function is an adaptation of this implementation:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/getStartPhaseData.ts
   *
   * @param targetTimestampSeconds The target timestamp.
   * @param tolerance The maximum difference between the target timestamp and the timestamp of the round.
   * @returns The round data that is closest to the target timestamp.
   * If the round data is not found, it returns null.
   */
  async #getClosestRoundData(
    targetTimestampSeconds: bigint
  ): Promise<Round | null> {
    const phaseAggregators = await this.#getPhaseAggregators();
    phaseAggregators.sort((a, b) => b.phaseId - a.phaseId);

    for (const phaseAggregator of phaseAggregators) {
      const roundId = await this.#binarySearchRoundId(
        phaseAggregator.address,
        targetTimestampSeconds,
        phaseAggregator.latestRoundId
      );

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

  /**
   * It gets the phase aggregators contracts of a price feed contract.
   *
   * This function was extracted from a fragment of this larger function:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/85180c5a1d06eba6e32417bfbf19fcbb53e140be/controllers/index.ts#L108
   *
   * @returns A set of phase aggregator contracts.
   */
  async #getPhaseAggregators(): Promise<PhaseAggregator[]> {
    const phaseId = await this.client.readContract({
      address: this.priceFeedContractAddress,
      abi: EAC,
      functionName: "phaseId",
    });

    const phaseAggregatorIds: number[] = [];

    for (let i = 1; i <= phaseId; i++) {
      phaseAggregatorIds.push(i);
    }

    const phaseAggregators = await this.client.multicall({
      contracts: phaseAggregatorIds.map((id) => ({
        address: this.priceFeedContractAddress,
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
        const latestRoundId = await this.client.readContract({
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

  async #getRoundData({
    roundId,
    phaseAggregatorAddress,
  }: {
    roundId: bigint;
    phaseAggregatorAddress: Address;
  }): Promise<RoundData> {
    const [_, answer, __, updatedAt] = await this.client.readContract({
      functionName: "getRoundData",
      abi: Aggregator,
      args: [roundId],
      address: phaseAggregatorAddress,
    });

    return {
      price: answer,
      timestamp: updatedAt,
    };
  }
}
