import { describe, it } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import type { FiltersInputSchema } from "../../src/middlewares/withFilters";

const splitAndCleanCommaSeparatedString = (values?: string) => {
  if (!values) return undefined;

  const parts = values
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "");

  return parts.length > 0 ? parts : undefined;
};

function filterBlock(
  b: (typeof fixtures.blocks)[number],
  {
    startBlock,
    endBlock,
    startDate,
    endDate,
    startSlot,
    endSlot,
    type,
  }: FiltersInputSchema
) {
  const blockRangeFilter =
    startBlock && endBlock
      ? b.number >= startBlock && b.number <= endBlock
      : true;
  const startBlockFilter = startBlock ? b.number >= startBlock : true;
  const endBlockFilter = endBlock ? b.number <= endBlock : true;
  const dateRangeFilter =
    startDate && endDate
      ? dayjs(b.timestamp).isBetween(startDate, endDate)
      : true;
  const startDateFilter = startDate
    ? dayjs(b.timestamp).isAfter(startDate)
    : true;
  const endDateFilter = endDate ? dayjs(b.timestamp).isBefore(endDate) : true;
  const slotRangeFilter =
    startSlot && endSlot ? b.slot >= startSlot && b.slot <= endSlot : true;
  const startSlotFilter = startSlot ? b.slot >= startSlot : true;
  const endSlotFilter = endSlot ? b.slot <= endSlot : true;
  const blockTypeFilter = fixtures.txForks.find((txF) =>
    type === "reorged" ? txF.blockHash === b.hash : txF.blockHash !== b.hash
  );

  return (
    blockRangeFilter &&
    startBlockFilter &&
    endBlockFilter &&
    dateRangeFilter &&
    startDateFilter &&
    endDateFilter &&
    slotRangeFilter &&
    startSlotFilter &&
    endSlotFilter &&
    blockTypeFilter
  );
}

function filterTransaction(
  tx: (typeof fixtures.txs)[number],
  addresses: typeof fixtures.addresses,
  { from, to, rollups }: FiltersInputSchema
) {
  const parsedFromAddresses = splitAndCleanCommaSeparatedString(from);
  const parsedRollups = splitAndCleanCommaSeparatedString(rollups);
  const txFrom = addresses.find((a) => a.address === tx.fromId);

  const senderFilter = parsedFromAddresses
    ? parsedFromAddresses.includes(tx.fromId)
    : true;
  const receiverFilter = to ? tx.toId === to : true;
  const rollupsFilter = parsedRollups
    ? txFrom?.rollup
      ? parsedRollups.includes(txFrom.rollup.toLowerCase())
      : false
    : true;

  return senderFilter && receiverFilter && rollupsFilter;
}

export function getFilteredBlocks(filters: FiltersInputSchema) {
  return fixtures.blocks.filter((b) => {
    const blockTxs = fixtures.txs.filter((tx) => tx.blockHash === b.hash);
    return (
      filterBlock(b, filters) &&
      blockTxs.some((tx) => filterTransaction(tx, fixtures.addresses, filters))
    );
  });
}

export function getFilteredTransactions(filters: FiltersInputSchema) {
  const { from, to, rollups } = filters;

  return getFilteredBlocks(filters).flatMap((b) => {
    const txs = fixtures.txs.filter(
      (tx) =>
        b.hash === tx.blockHash &&
        filterTransaction(tx, fixtures.addresses, { from, to, rollups })
    );

    return txs;
  });
}

export function getFilteredBlobs(filters: FiltersInputSchema) {
  return getFilteredTransactions(filters).flatMap((tx) => {
    const blobs = fixtures.blobsOnTransactions.filter(
      (b) => b.txHash === tx.hash
    );

    return blobs;
  });
}

export function requiresDirectCount({
  endBlock,
  endSlot,
  from,
  to,
  type,
  startBlock,
  startSlot,
}: FiltersInputSchema) {
  const blockNumberRangeFilterEnabled = !!startBlock || !!endBlock;
  const reorgedFilterEnabled = type === "reorged";
  const slotRangeFilterEnabled = !!startSlot || !!endSlot;
  const addressFilterEnabled = splitAndCleanCommaSeparatedString(from) || !!to;

  return (
    blockNumberRangeFilterEnabled ||
    reorgedFilterEnabled ||
    slotRangeFilterEnabled ||
    addressFilterEnabled
  );
}

export function runFilterTests(
  assertFilters: (filters: FiltersInputSchema) => Promise<void>
) {
  describe("when using filters", () => {
    it("should return the correct results when filtering by a specific rollup", async () => {
      await assertFilters({
        rollups: "optimism",
      });
    });

    // it("should return the correct results when filtering by multiple rollups", async () => {
    //   await assertFilters({
    //     rollups: "optimism,base",
    //   });
    // })

    it("should return the correct results when filtering by a start block", async () => {
      await assertFilters({
        startBlock: 1007,
      });
    });

    it("should return the correct results when filtering by an end block", async () => {
      await assertFilters({
        endBlock: 1002,
      });
    });

    it("should return the correct results when filtering by a block range", async () => {
      await assertFilters({
        startBlock: 1004,
        endBlock: 1006,
      });
    });

    it("should return the correct results when filtering by a start date", async () => {
      await assertFilters({
        startDate: new Date("2023-08-31"),
      });
    });

    it("should return the correct results when filtering by an end date date", async () => {
      await assertFilters({
        endDate: new Date("2022-12-01"),
      });
    });

    it("should return the correct results when filtering by a date range", async () => {
      await assertFilters({
        startDate: new Date("2023-08-03"),
        endDate: new Date("2023-08-28"),
      });
    });

    it("should return the correct results when filtering by a start slot", async () => {
      await assertFilters({
        startSlot: 107,
      });
    });

    it("should return the correct results when filtering by an end slot", async () => {
      await assertFilters({
        endSlot: 102,
      });
    });

    it("should return the correct results when filtering by a sender", async () => {
      await assertFilters({
        from: "address1",
      });
    });

    it("should return the correct results when filtering by multiple senders", async () => {
      await assertFilters({
        from: "address1,address3",
      });
    });

    it("should return the correct results when filtering by multiple empty senders", async () => {
      await assertFilters({
        from: ",,,,,",
      });
    });

    it("should return the correct results when filtering by some empty senders", async () => {
      await assertFilters({
        from: ",address1,,address3,,",
      });
    });

    it("should return the correct results when filtering by a receiver", async () => {
      await assertFilters({
        to: "address2",
      });
    });

    it("should return the correct results when filtering by a sender and receiver", async () => {
      await assertFilters({
        from: "address1",
        to: "address2",
      });
    });

    it("should return the correct results when filtering by reorged blocks", async () => {
      await assertFilters({
        type: "reorged",
      });
    });
  });
}
