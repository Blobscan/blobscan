import * as forkBlobParams from "./forks";
import type { ForkActivationParams, ForkName, Fork } from "./types";

export class Network {
  public readonly forks: [Fork, ...Fork[]];

  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly firstBlobBlock: { number: number },
    activeForks: Partial<Record<ForkName, ForkActivationParams>>
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
        `Network ${name} must have at least one active fork defined`
      );
    }

    this.forks = forks_ as [Fork, ...Fork[]];
  }

  getFork(forkName: ForkName): Fork | undefined {
    return this.forks.find((fork) => fork.forkName === forkName);
  }

  get latestFork(): Fork {
    const latestFork = this.forks[this.forks.length - 1];

    if (!latestFork) {
      throw new Error(`Network ${this.name} has no forks defined`);
    }

    return latestFork;
  }

  getActiveForkBySlot(slot: number): Fork | undefined {
    return (
      this.forks.findLast((fork) => slot >= fork.activationSlot) ??
      this.latestFork
    );
  }

  getActiveForkByDate(dateOrTimestamp: Date): Fork | undefined {
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
