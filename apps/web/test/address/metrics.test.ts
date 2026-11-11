import { describe, expect, it } from "vitest";

import {
  BLOB_SIZE,
  getDerivedMetrics,
  ratio,
} from "~/components/Tabs/AddressTabs/AddressAnalyticsTab/helpers/metrics";
import type { RoleTotals } from "~/components/Tabs/AddressTabs/AddressAnalyticsTab/types";

const EMPTY_TOTALS: RoleTotals = {
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
};

describe("address metric cards", () => {
  it("returns zero for all derived card values without transactions", () => {
    expect(getDerivedMetrics(EMPTY_TOTALS)).toMatchObject({
      totalFeeUsd: 0,
      avgBlobsPerTx: 0,
      avgFeePerTx: BigInt(0),
      avgFeePerTxUsd: 0,
      unusedFee: BigInt(0),
      unusedFeeUsd: 0,
      costPerKb: BigInt(0),
      costPerKbUsd: 0,
      calldataSavings: BigInt(0),
      calldataSavingsUsd: 0,
    });
  });

  it("keeps the values of an address with transactions", () => {
    expect(
      getDerivedMetrics({
        ...EMPTY_TOTALS,
        totalTransactions: 2,
        totalBlobs: 4,
        totalBlobUsageSize: BigInt(2 * BLOB_SIZE),
        totalBlobBaseFee: BigInt(1024),
        totalBlobAsCalldataFee: BigInt(2048),
        totalBlobBaseFeeUsd: 8,
        totalBlobAsCalldataFeeUsd: 16,
        totalUsdPricedTransactions: 2,
      })
    ).toMatchObject({
      totalFeeUsd: 8,
      avgBlobsPerTx: 2,
      avgFeePerTx: BigInt(512),
      avgFeePerTxUsd: 4,
      unusedFee: BigInt(512),
      unusedFeeUsd: 4,
      costPerKb: BigInt(4),
      costPerKbUsd: 0.03125,
      calldataSavings: BigInt(1024),
      calldataSavingsUsd: 8,
    });
  });

  it("keeps USD values unavailable when transactions have no price", () => {
    const metrics = getDerivedMetrics({
      ...EMPTY_TOTALS,
      totalTransactions: 1,
      totalBlobs: 1,
      totalBlobUsageSize: BigInt(1024),
    });

    expect(metrics.totalFeeUsd).toBeUndefined();
    expect(metrics.avgFeePerTxUsd).toBeUndefined();
    expect(metrics.unusedFeeUsd).toBeUndefined();
    expect(metrics.costPerKbUsd).toBeUndefined();
    expect(metrics.calldataSavingsUsd).toBeUndefined();
  });

  it("keeps cost per KiB unavailable when paid blobs have no useful data", () => {
    const metrics = getDerivedMetrics({
      ...EMPTY_TOTALS,
      totalTransactions: 1,
      totalBlobs: 1,
      totalBlobBaseFee: BigInt(1024),
      totalBlobBaseFeeUsd: 8,
      totalUsdPricedTransactions: 1,
    });

    expect(metrics.costPerKb).toBeNull();
    expect(metrics.costPerKbUsd).toBeUndefined();
    expect(metrics.totalFeeUsd).toBe(8);
  });

  it("keeps ratios undefined when the denominator is zero", () => {
    expect(ratio(0, 0)).toBeUndefined();
    expect(ratio(BigInt(0), BigInt(0))).toBeUndefined();
  });
});
