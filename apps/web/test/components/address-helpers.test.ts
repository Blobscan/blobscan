import { describe, expect, it } from "vitest";

import type {
  AddressTimeseries,
  RoleTotals,
} from "~/components/Address/helpers";
import {
  BLOB_SIZE,
  getBlobGasPrices,
  getClosedPeriodsMean,
  getDailyMean,
  getPeakDay,
  getDerivedMetrics,
  getMainRole,
  getShownRoles,
  getTimingRatio,
  sumRoles,
} from "~/components/Address/helpers";

function totals(overrides: Partial<RoleTotals> = {}): RoleTotals {
  return {
    totalTransactions: 0,
    totalBlobs: 0,
    totalBlobUsageSize: BigInt(0),
    totalBlobBaseFee: BigInt(0),
    totalBlobAsCalldataFee: BigInt(0),
    totalBlobBaseFeeUsd: null,
    totalBlobAsCalldataFeeUsd: null,
    totalUsdPricedTransactions: 0,
    firstBlockTimestamp: null,
    lastBlockTimestamp: null,
    ...overrides,
  };
}

describe("getShownRoles", () => {
  it("should show only the sent role for a sender", () => {
    expect(
      getShownRoles({
        sentTotalTransactions: 5,
        receivedTotalTransactions: 0,
        selfTotalTransactions: 0,
      })
    ).toEqual(["sent"]);
  });

  it("should show a self-sender as a sender only", () => {
    expect(
      getShownRoles({
        sentTotalTransactions: 3,
        receivedTotalTransactions: 3,
        selfTotalTransactions: 3,
      })
    ).toEqual(["sent"]);
  });

  it("should show the received role when it has transactions that are not self-sends", () => {
    expect(
      getShownRoles({
        sentTotalTransactions: 3,
        receivedTotalTransactions: 4,
        selfTotalTransactions: 3,
      })
    ).toEqual(["sent", "received"]);
  });

  it("should show only the received role for a receiver", () => {
    expect(
      getShownRoles({
        sentTotalTransactions: 0,
        receivedTotalTransactions: 7,
        selfTotalTransactions: 0,
      })
    ).toEqual(["received"]);
  });
});

describe("getMainRole", () => {
  it("should use the role with more transactions", () => {
    expect(
      getMainRole(["sent", "received"], {
        sent: { totalTransactions: 2 },
        received: { totalTransactions: 9 },
      })
    ).toEqual({ main: "received", other: "sent" });
  });

  it("should have no other role when only one role shows", () => {
    expect(
      getMainRole(["received"], {
        sent: { totalTransactions: 0 },
        received: { totalTransactions: 9 },
      })
    ).toEqual({ main: "received" });
  });
});

describe("getDerivedMetrics", () => {
  it("should calculate the metrics of one role", () => {
    const metrics = getDerivedMetrics(
      totals({
        totalTransactions: 2,
        totalBlobs: 4,
        totalBlobUsageSize: BigInt(BLOB_SIZE * 3),
        totalBlobBaseFee: BigInt(4_000),
        totalBlobAsCalldataFee: BigInt(10_000),
        totalBlobBaseFeeUsd: 8,
        totalBlobAsCalldataFeeUsd: 20,
        totalUsdPricedTransactions: 2,
      })
    );

    expect(metrics.avgBlobsPerTx).toBe(2);
    expect(metrics.avgFeePerTx).toBe(BigInt(2_000));
    expect(metrics.avgFeePerTxUsd).toBe(4);
    expect(metrics.utilization).toBe(0.75);
    expect(metrics.unusedSize).toBe(BigInt(BLOB_SIZE));
    expect(metrics.unusedFee).toBe(BigInt(1_000));
    expect(metrics.unusedFeeUsd).toBe(2);
    expect(metrics.calldataSavings).toBe(BigInt(6_000));
    expect(metrics.calldataSavingsUsd).toBe(12);
  });

  it("should give no averages when the role has no transactions", () => {
    const metrics = getDerivedMetrics(totals());

    expect(metrics.avgBlobsPerTx).toBeUndefined();
    expect(metrics.avgFeePerTx).toBeUndefined();
    expect(metrics.utilization).toBeUndefined();
    expect(metrics.costPerKb).toBeUndefined();
  });
});

describe("getTimingRatio", () => {
  it("should compare the gas-weighted prices of the address and the network", () => {
    // The address pays 2 wei per blob gas, and the network 4 wei.
    const ratio = getTimingRatio(
      { totalBlobs: 1, totalBlobBaseFee: BigInt(2 * BLOB_SIZE) },
      { totalBlobBaseFee: BigInt(400), totalBlobGasUsed: BigInt(100) }
    );

    expect(ratio).toBe(0.5);
  });

  it("should give no ratio without network data", () => {
    expect(
      getTimingRatio(
        { totalBlobs: 1, totalBlobBaseFee: BigInt(10) },
        { totalBlobBaseFee: BigInt(0), totalBlobGasUsed: BigInt(0) }
      )
    ).toBeUndefined();
  });
});

describe("getBlobGasPrices", () => {
  it("should return the gas-weighted prices of the address and the network", () => {
    // The address pays 2 wei per blob gas, and the network 4 wei.
    expect(
      getBlobGasPrices(
        { totalBlobs: 1, totalBlobBaseFee: BigInt(2 * BLOB_SIZE) },
        { totalBlobBaseFee: BigInt(400), totalBlobGasUsed: BigInt(100) }
      )
    ).toEqual({ address: BigInt(2), network: BigInt(4) });
  });

  it("should give no prices when there is no blob gas", () => {
    expect(
      getBlobGasPrices(
        { totalBlobs: 0, totalBlobBaseFee: BigInt(0) },
        { totalBlobBaseFee: BigInt(0), totalBlobGasUsed: BigInt(0) }
      )
    ).toEqual({ address: undefined, network: undefined });
  });
});

describe("getClosedPeriodsMean", () => {
  it("should not use the last period, which is not complete", () => {
    expect(getClosedPeriodsMean([2, 4, 100])).toBe(3);
  });

  it("should use the only period", () => {
    expect(getClosedPeriodsMean([5])).toBe(5);
  });

  it("should give no mean when there are no periods", () => {
    expect(getClosedPeriodsMean([])).toBeUndefined();
  });
});

describe("getDailyMean", () => {
  function timeseries(
    granularity: AddressTimeseries["granularity"],
    sentBlobs: number[],
    receivedBlobs: number[]
  ) {
    return {
      granularity,
      timestamps: sentBlobs.map((_, i) => new Date(i * 1000)),
      sent: { totalBlobs: sentBlobs },
      received: { totalBlobs: receivedBlobs },
      selfTotalBlobs: sentBlobs.map(() => 0),
    } as unknown as AddressTimeseries;
  }

  it("should add the sent and the received values of each day", () => {
    expect(
      getDailyMean(timeseries("day", [1, 3, 9], [1, 1, 9]), "totalBlobs")
    ).toBe(3);
  });

  it("should count the days with no values as 0", () => {
    expect(
      getDailyMean(timeseries("day", [4, 0, 0], [0, 0, 0]), "totalBlobs")
    ).toBe(2);
  });

  it("should use only the values of a role", () => {
    expect(
      getDailyMean(
        timeseries("day", [1, 3, 9], [5, 5, 9]),
        "totalBlobs",
        "sent"
      )
    ).toBe(2);
  });

  it("should multiply an hourly mean by 24", () => {
    expect(
      getDailyMean(timeseries("hour", [1, 3, 0], [0, 0, 0]), "totalBlobs")
    ).toBe(48);
  });
});

describe("sumRoles", () => {
  const data = {
    granularity: "day",
    timestamps: [new Date(0), new Date(1000)],
    sent: {
      totalTransactions: [3, 1],
      totalBlobUsageSize: [10, 5].map(BigInt),
    },
    received: {
      totalTransactions: [2, 4],
      totalBlobUsageSize: [10, 0].map(BigInt),
    },
    selfTotalTransactions: [2, 0],
  } as unknown as AddressTimeseries;

  it("should count a self-send one time", () => {
    // The first period has 2 self-sends, which are in both roles.
    expect(sumRoles(data, "totalTransactions")).toEqual([3, 5]);
  });

  it("should add the data sizes of both roles", () => {
    expect(sumRoles(data, "totalBlobUsageSize")).toEqual([20, 5]);
  });
});

describe("getPeakDay", () => {
  const HOUR_MS = 60 * 60 * 1000;

  function timeseries(
    timestamps: Date[],
    sentUsage: number[],
    receivedUsage: number[]
  ) {
    return {
      granularity: "hour",
      timestamps,
      sent: { totalBlobUsageSize: sentUsage.map(BigInt) },
      received: { totalBlobUsageSize: receivedUsage.map(BigInt) },
    } as unknown as AddressTimeseries;
  }

  it("should return the day with the most sent and received data", () => {
    const peak = getPeakDay(
      timeseries(
        [
          new Date("2026-11-01T00:00:00Z"),
          new Date("2026-11-02T00:00:00Z"),
          new Date("2026-11-03T00:00:00Z"),
        ],
        [10, 20, 30],
        [5, 25, 0]
      ),
      "totalBlobUsageSize"
    );

    expect(peak).toEqual({ day: new Date("2026-11-02T00:00:00Z"), value: 45 });
  });

  it("should add the hours of each day", () => {
    const start = new Date("2026-11-01T22:00:00Z").getTime();
    const hours = [0, 1, 2, 3].map((h) => new Date(start + h * HOUR_MS));

    const peak = getPeakDay(
      timeseries(hours, [10, 10, 15, 0], [0, 0, 0, 0]),
      "totalBlobUsageSize"
    );

    expect(peak).toEqual({ day: new Date("2026-11-01T00:00:00Z"), value: 20 });
  });

  it("should return undefined when there is no data", () => {
    expect(
      getPeakDay(
        timeseries([new Date("2026-11-01T00:00:00Z")], [0], [0]),
        "totalBlobUsageSize"
      )
    ).toBeUndefined();
  });
});
