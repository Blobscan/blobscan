import type { Address, PublicClient } from "viem";

import { AggregatorV3ABI } from "./abi/AggregatorV3";
import { EACAggregatorProxyABI } from "./abi/EACAggregatorProxy";
import type { RoundIdish, Timestampish } from "./utils";
import {
  parseRoundId,
  isEmptyRoundData,
  toRoundData,
  normalizeTimestamp,
  toPriceData,
} from "./utils";

export interface RoundData {
  aggregatorRoundId: bigint;
  roundId: bigint;
  timestamp: number;
  price: bigint;
}

export type PriceData = {
  roundId: bigint;
  price: number;
  timestamp: Date;
};

type PhaseAggregator = {
  phaseId: number;
  address: Address;
  firstRound?: RoundData;
  lastRound?: RoundData;
};

export interface Options {
  startRoundId?: RoundIdish;
}

/**
 * Class that serves as an abstraction for the Chainlink date feed contract to retrieve
 * historical prices for an asset.
 *
 * Chainlink data feeds work by aggregating data from multiple oracles to provide a reliable
 * and accurate price feed. The data is stored in a series of rounds, each identified by a unique
 * `roundId`.
 *
 * The aggregators may be subject to change over time, and the data feed contract may have multiple
 * aggregators deployed at different phases. Each phase is identified by a unique `phaseId`. This
 * can be thought of as a version of the price feed contract.
 *
 *
 * *See https://docs.chain.link/data-feeds to learn how more about data feesds.*
 */
export class PriceFeed {
  /**
   *
   * @param client The viem client used to interact with the data feed contract.
   * @param phaseAggregators The phase aggregators of the data feed contract.
   * @param timeTolerance The maximum time difference in seconds allowed between the target
   * timestamp and the round timestamp.
   */
  private constructor(
    private readonly client: PublicClient,
    private readonly phaseAggregators: PhaseAggregator[],
    readonly priceDecimals: number,
    private readonly timeTolerance: number
  ) {}

  /**
   * Creates a new instance.
   * @param client The client used to interact with the data feed contract.
   * @param dataFeedContractAddress The price data feed contract address.
   * @param timeTolerance The maximum time difference in seconds allowed between the target
   * timestamp and the round timestamp.
   *
   * @returns A new instance of PriceFeed.
   */
  static async create({
    client,
    dataFeedContractAddress,
    timeTolerance,
  }: {
    client: PublicClient;
    dataFeedContractAddress: Address;
    timeTolerance?: number;
  }) {
    const aggregators = await PriceFeed.#retrievePhaseAggregators(
      client,
      dataFeedContractAddress
    );
    const priceDecimals = await client.readContract({
      address: dataFeedContractAddress,
      abi: EACAggregatorProxyABI,
      functionName: "decimals",
    });

    if (!aggregators.length) {
      throw new Error("Failed to create PriceFeed: no aggregators found");
    }

    const instance = new PriceFeed(
      client,
      aggregators,
      priceDecimals,
      timeTolerance || Infinity
    );

    return instance;
  }

  /**
   *
   * It retrieves the closest price data to the given timestamp.
   *
   * Additional information can be found here: https://docs.chain.link/data-feeds
   *
   * @param timestamp The timestamp for which the price is requested in seconds.
   * @param options The options to use for the search.
   * @param options.startRoundId The round id to start the search from. If not provided,
   * the search will start from the phase aggregator's first round.
   * @returns The price data for the given timestamp.
   **/
  async findPriceByTimestamp(
    timestamp: Timestampish,
    opts: Options = {}
  ): Promise<PriceData | null> {
    const targetTimestamp = normalizeTimestamp(timestamp);
    const nowTimestamp = normalizeTimestamp(new Date());

    // Skip if the timestamp is in the future
    if (targetTimestamp > nowTimestamp) {
      return null;
    }

    const roundData = await this.#getClosestRoundData(targetTimestamp, opts);

    return roundData ? toPriceData(roundData, this.priceDecimals) : null;
  }

  async #getClosestRoundData(
    timestamp: number,
    { startRoundId }: Options
  ): Promise<RoundData | null> {
    const parsedStartRoundId = startRoundId
      ? parseRoundId(startRoundId)
      : undefined;

    for (const phaseAggregator of this.phaseAggregators.sort(
      (a, b) => b.phaseId - a.phaseId
    )) {
      const { firstRound, lastRound } = phaseAggregator;

      if (
        parsedStartRoundId &&
        parsedStartRoundId.phaseId !== phaseAggregator.phaseId
      ) {
        continue;
      }

      if (
        (firstRound && timestamp < firstRound.timestamp) ||
        (lastRound && timestamp > lastRound.timestamp)
      ) {
        continue;
      }

      let highRoundData: RoundData;

      if (lastRound) {
        highRoundData = lastRound;
      } else {
        highRoundData = await this.#fetchPriceRoundDataOrThrow(
          phaseAggregator,
          "latest"
        );
      }

      if (this.#isWithinToleranceRange(timestamp, highRoundData.timestamp)) {
        return highRoundData;
      }

      const roundData = await this.#binarySearchPriceRoundData(
        phaseAggregator,
        timestamp,
        {
          low: parsedStartRoundId?.phaseRoundId,
          high: highRoundData.aggregatorRoundId,
        }
      );

      if (roundData) {
        return roundData;
      }
    }

    return null;
  }

  /**
   * Finds the round data that corresponds to a timestamp using binary search algorithm
   *
   * *This function is an adaptation of this implementation:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/main/lib/binarySearch.ts
   *
   * @param aggregator The phase aggregator contract to search in.
   * @param targetTimestamp The target timestamp.
   * @param aggregatorRoundIdRange The  range of aggregator's round ids to search in.
   *
   * @returns The round data that corresponds to the timestamp.
   * */
  async #binarySearchPriceRoundData(
    aggregator: PhaseAggregator,
    targetTimestamp: number,
    aggregatorRoundIdRange: { low?: bigint; high: bigint }
  ): Promise<RoundData | null> {
    let low = aggregatorRoundIdRange.low || BigInt(0);
    let high = aggregatorRoundIdRange.high;

    let closestRoundData: RoundData | null = null;

    while (low <= high) {
      const mid = low + (high - low) / BigInt(2);

      const roundData = await this.#fetchRoundData(aggregator, mid);

      if (roundData) {
        const midTimestamp = roundData.timestamp;

        if (midTimestamp <= targetTimestamp) {
          low = mid + BigInt(1);

          if (this.#isWithinToleranceRange(targetTimestamp, midTimestamp)) {
            closestRoundData = roundData;
          }
        } else {
          high = mid - BigInt(1);
        }
      } else {
        low = mid + BigInt(1);
      }
    }

    return closestRoundData;
  }

  /**
   * Checks if the timestamp is within the tolerance range.
   * @param targetTimestamp The timestamp to check.
   * @param timestamp The timestamp to compare with.
   * @returns
   */
  #isWithinToleranceRange(targetTimestamp: number, timestamp: number): boolean {
    const distance = targetTimestamp - timestamp;

    return distance >= 0 && distance <= this.timeTolerance;
  }

  /**
   * It retrieves the phase aggregators from the data feed contract.
   *
   * *This function is an adaptation of this implementation:
   * https://github.com/smartcontractkit/quickstarts-historical-prices-api/blob/85180c5a1d06eba6e32417bfbf19fcbb53e140be/controllers/index.ts#L108*
   *
   * @returns A set of phase aggregators.
   */
  static async #retrievePhaseAggregators(
    client: PublicClient,
    dataFeedAddress: Address
  ): Promise<PhaseAggregator[]> {
    try {
      const latestPhaseId = await client.readContract({
        address: dataFeedAddress,
        abi: EACAggregatorProxyABI,
        functionName: "phaseId",
      });

      const phaseAggregatorIds: number[] = [];

      for (let i = 1; i <= latestPhaseId; i++) {
        phaseAggregatorIds.push(i);
      }

      const phaseAggregatorAddresses = await client.multicall({
        contracts: phaseAggregatorIds.map((id) => ({
          address: dataFeedAddress,
          abi: EACAggregatorProxyABI,
          functionName: "phaseAggregators",
          args: [id.toString()],
        })),
      });

      const phaseAggregators: PhaseAggregator[] = [];

      for (let i = 0; i < phaseAggregatorAddresses.length; i++) {
        const phaseAggregator = phaseAggregatorAddresses[i];

        if (!phaseAggregator || phaseAggregator.status === "failure") {
          continue;
        }

        const address = phaseAggregator.result as unknown as Address;
        const currentPhaseId = i + 1;
        const isLatestAggregator = currentPhaseId === latestPhaseId;

        try {
          const phaseAggregator: PhaseAggregator = {
            phaseId: currentPhaseId,
            address,
          };

          const [firstRoundData, latestRoundData] = await Promise.all([
            client.readContract({
              address,
              abi: AggregatorV3ABI,
              functionName: "getRoundData",
              args: [BigInt(1)],
            }),
            client.readContract({
              address,
              abi: AggregatorV3ABI,
              functionName: "latestRoundData",
            }),
          ]);

          if (!isEmptyRoundData(firstRoundData)) {
            phaseAggregator.firstRound = toRoundData(
              firstRoundData,
              currentPhaseId
            );
          }

          if (!isLatestAggregator && !isEmptyRoundData(latestRoundData)) {
            phaseAggregator.lastRound = toRoundData(
              latestRoundData,
              currentPhaseId
            );
          }

          phaseAggregators.push(phaseAggregator);
        } catch (_) {
          continue;
        }
      }

      return phaseAggregators;
    } catch (err) {
      throw new Error(
        `Failed to retrieve aggregators from data feed contract ${dataFeedAddress}`,
        { cause: err }
      );
    }
  }

  async #fetchRoundData(
    { address, phaseId }: PhaseAggregator,
    aggregatorRoundId: bigint | "latest"
  ): Promise<RoundData | null> {
    try {
      const isLatest = aggregatorRoundId === "latest";
      const rawRoundData = await this.client.readContract({
        functionName: isLatest ? "latestRoundData" : "getRoundData",
        abi: AggregatorV3ABI,
        args: isLatest ? undefined : [aggregatorRoundId],
        address: address,
      });

      if (isEmptyRoundData(rawRoundData)) {
        return null;
      }

      return toRoundData(rawRoundData, phaseId);
    } catch (err) {
      return null;
    }
  }

  async #fetchPriceRoundDataOrThrow(
    aggregator: PhaseAggregator,
    roundId: bigint | "latest"
  ) {
    const roundData = await this.#fetchRoundData(aggregator, roundId);

    if (!roundData) {
      throw new Error(
        `Failed to retrieve round data with id ${roundId} from aggregator contract: ${aggregator.address}`
      );
    }

    return roundData;
  }
}
