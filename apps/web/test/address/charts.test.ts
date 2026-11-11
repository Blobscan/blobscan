import { describe, expect, it } from "vitest";

import { buildDataset } from "~/components/Tabs/AddressTabs/AddressAnalyticsTab/helpers/charts";
import type { AddressTimeseries } from "~/components/Tabs/AddressTabs/AddressAnalyticsTab/types";

function createTimeseries(
  sent: number[],
  received = sent.map(() => 0)
): AddressTimeseries {
  const role = (transactions: number[]): AddressTimeseries["sent"] => ({
    totalTransactions: transactions,
    totalBlobs: transactions,
    totalBlobUsageSize: transactions.map(() => BigInt(0)),
    totalBlobBaseFee: transactions.map(() => BigInt(0)),
    totalBlobAsCalldataFee: transactions.map(() => BigInt(0)),
    totalBlobBaseFeeUsd: transactions.map(() => null),
    totalBlobAsCalldataFeeUsd: transactions.map(() => null),
    totalUsdPricedTransactions: transactions.map(() => 0),
  });

  return {
    granularity: "day",
    timestamps: sent.map((_, i) => new Date(Date.UTC(2026, 10, i + 1))),
    sent: role(sent),
    received: role(received),
    selfTotalTransactions: sent.map(() => 0),
    selfTotalBlobs: sent.map(() => 0),
    network: {
      totalBlobs: sent.map(() => 10),
      totalBlobBaseFee: sent.map(() => BigInt(10)),
      totalBlobGasUsed: sent.map(() => BigInt(10)),
    },
    updatedAt: null,
  };
}

describe("address chart data", () => {
  it("returns no dataset for an empty result", () => {
    expect(buildDataset(createTimeseries([]))).toBeUndefined();
  });

  it("returns no dataset for periods without address transactions", () => {
    expect(buildDataset(createTimeseries([0, 0]))).toBeUndefined();
  });

  it.each(["sent", "received"] as const)(
    "keeps the dataset when the address has %s transactions",
    (role) => {
      const data =
        role === "sent"
          ? createTimeseries([0, 1])
          : createTimeseries([0, 0], [0, 1]);

      expect(buildDataset(data)).toMatchObject({
        source: { [`${role}Txs`]: [0, 1] },
      });
    }
  );
});
