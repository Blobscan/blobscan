import { describe, expect, it } from "vitest";

import {
  dailyMeanCard,
  peakDayCard,
} from "~/components/Tabs/AddressTabs/AddressAnalyticsTab/helpers/cards";
import type { AddressTimeseries } from "~/components/Tabs/AddressTabs/AddressAnalyticsTab/types";

const EMPTY_SERIES: AddressTimeseries["sent"] = {
  totalTransactions: [],
  totalBlobs: [],
  totalBlobUsageSize: [],
  totalBlobBaseFee: [],
  totalBlobAsCalldataFee: [],
  totalBlobBaseFeeUsd: [],
  totalBlobAsCalldataFeeUsd: [],
  totalUsdPricedTransactions: [],
};
const EMPTY_TIMESERIES: AddressTimeseries = {
  granularity: "day",
  timestamps: [],
  sent: EMPTY_SERIES,
  received: EMPTY_SERIES,
  selfTotalTransactions: [],
  selfTotalBlobs: [],
  network: { totalBlobs: [], totalBlobBaseFee: [], totalBlobGasUsed: [] },
  updatedAt: null,
};
const CARD = { name: "Daily metric", description: "Daily value" };

describe("address daily cards", () => {
  it.each(["totalTransactions", "totalBlobs", "totalBlobUsageSize"] as const)(
    "shows zero for %s after an empty time series loads",
    (column) => {
      expect(
        dailyMeanCard(CARD, EMPTY_TIMESERIES, column).metric?.primary.value
      ).toBe(0);
      expect(
        peakDayCard(CARD, EMPTY_TIMESERIES, column).metric?.primary.value
      ).toBe(0);
    }
  );

  it("keeps the loading value until the time series loads", () => {
    expect(
      dailyMeanCard(CARD, undefined, "totalBlobs").metric?.primary.value
    ).toBeUndefined();
    expect(
      peakDayCard(CARD, undefined, "totalBlobs").metric?.primary.value
    ).toBeUndefined();
  });
});
