import * as forkBlobParams from "./forks";
import type { ForkActivationParams, ForkName, Fork } from "./types";

export class Chain {
  public readonly forks: [Fork, ...Fork[]];

  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly firstBlobBlock: { number: number },
    activeForks: Partial<Record<ForkName, ForkActivationParams>>,
    public readonly slotsPerEpoch: number = 32,
    public readonly secondsPerSlot: number = 12
  ) {
    const forks_ = Object.entries(activeForks)
      .reduce((acc, [forkName_, { activationSlot, activationDate }]) => {
        const forkName = forkName_ as ForkName;
        const blobParams = forkBlobParams[forkName];

        acc.push({
          forkName,
          activationSlot,
          activationDate,
          blobParams,
        });

        return acc;
      }, [] as Fork[])
      .sort((a, b) => a.activationSlot - b.activationSlot);

    if (forks_.length === 0) {
      throw new Error(
        `"${name}" network must have at least one active fork defined`
      );
    }

    this.forks = forks_ as [Fork, ...Fork[]];
  }

  getFork(forkName: ForkName) {
    return this.forks.find((fork) => fork.forkName === forkName);
  }

  get latestFork() {
    return this.forks[this.forks.length - 1] ?? this.forks[0];
  }

  getEpochBySlot(slot: number) {
    return Math.floor(slot / this.slotsPerEpoch);
  }

  getActiveForkBySlot(slot: number) {
    return (
      this.forks.findLast((fork) => slot >= fork.activationSlot) ??
      this.latestFork
    );
  }

  /**
   * Returns the start time of a slot. The calculation uses the activation
   * slot and date of the latest fork as the time anchor.
   */
  getSlotTimestamp(slot: number): Date {
    const { activationSlot, activationDate } = this.latestFork;
    const slotOffsetMs = (slot - activationSlot) * this.secondsPerSlot * 1000;

    return new Date(activationDate.getTime() + slotOffsetMs);
  }

  getActiveForkByDate(dateOrTimestamp: Date | number) {
    const timestamp =
      typeof dateOrTimestamp === "number"
        ? dateOrTimestamp
        : dateOrTimestamp.getTime();

    return (
      this.forks.findLast(
        ({ activationDate }) => timestamp >= activationDate.getTime()
      ) ?? this.latestFork
    );
  }
}
