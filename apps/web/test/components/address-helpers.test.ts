import { describe, expect, it } from "vitest";

import type { RoleTotals } from "~/components/Address/helpers";
import {
  BLOB_SIZE,
  getCadence,
  getDerivedMetrics,
  getMainRole,
  getShownRoles,
  getTimingRatio,
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
    expect(metrics.wastedSize).toBe(BigInt(BLOB_SIZE));
    expect(metrics.wastedFee).toBe(BigInt(1_000));
    expect(metrics.wastedFeeUsd).toBe(2);
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

describe("getCadence", () => {
  it("should give the average time between two transactions", () => {
    expect(
      getCadence(
        3,
        new Date("2026-11-01T00:00:00Z"),
        new Date("2026-11-01T02:00:00Z")
      )
    ).toBe(60 * 60 * 1000);
  });

  it("should give no cadence for one transaction", () => {
    const date = new Date("2026-11-01T00:00:00Z");

    expect(getCadence(1, date, date)).toBeUndefined();
  });
});
