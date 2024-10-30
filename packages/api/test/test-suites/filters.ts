import { describe, it } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import type { FiltersSchema } from "../../src/middlewares/withFilters";

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
  }: FiltersSchema
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
  { from, to, rollup }: FiltersSchema
) {
  const senderFilter = from && !to ? tx.fromId === from : true;
  const receiverFilter = to && !from ? tx.toId === to : true;
  const senderOrReceiverFilter =
    from && to ? tx.fromId === from || tx.toId === to : true;
  const rollupFilter = rollup ? tx.rollup === rollup.toUpperCase() : true;

  return (
    senderFilter && receiverFilter && senderOrReceiverFilter && rollupFilter
  );
}

export function getFilteredBlocks(filters: FiltersSchema) {
  return fixtures.blocks.filter((b) => {
    const blockTxs = fixtures.txs.filter((tx) => tx.blockHash === b.hash);

    return (
      filterBlock(b, filters) &&
      blockTxs.some((tx) => filterTransaction(tx, filters))
    );
  });
}

export function getFilteredTransactions(filters: FiltersSchema) {
  const { from, to, rollup } = filters;

  return getFilteredBlocks(filters).flatMap((b) => {
    const txs = fixtures.txs.filter((tx) => {
      const isBlockTx = tx.blockHash === b.hash;
      const senderFilter = from && !to ? tx.fromId === from : true;
      const receiverFilter = to && !from ? tx.toId === to : true;
      const senderOrReceiverFilter =
        from && to ? tx.fromId === from || tx.toId === to : true;
      const rollupFilter = rollup ? tx.rollup === rollup.toUpperCase() : true;

      return (
        isBlockTx &&
        senderFilter &&
        receiverFilter &&
        senderOrReceiverFilter &&
        rollupFilter
      );
    });

    return txs;
  });
}

export function getFilteredBlobs(filters: FiltersSchema) {
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
}: FiltersSchema) {
  const blockNumberRangeFilterEnabled = !!startBlock || !!endBlock;
  const reorgedFilterEnabled = type === "reorged";
  const slotRangeFilterEnabled = !!startSlot || !!endSlot;
  const addressFilterEnabled = !!from || !!to;

  return (
    blockNumberRangeFilterEnabled ||
    reorgedFilterEnabled ||
    slotRangeFilterEnabled ||
    addressFilterEnabled
  );
}

export function runFilterTests(
  assertFilters: (filters: FiltersSchema) => Promise<void>
) {
  describe("when using filters", () => {
    it("should return the correct results when filtering by a specific rollup", async () => {
      await assertFilters({
        rollup: "optimism",
      });
    });

    it("should return the correct results when filtering by a 'null' rollup", async () => {
      await assertFilters({
        rollup: "null",
      });
    });

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

    it("should return the correct results when filtering by a receiver", async () => {
      await assertFilters({
        to: "address2",
      });
    });

    it("should return the correct results when filtering by a sender or receiver", async () => {
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
