import { beforeAll, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import { create, createCommandUsage } from "../../src/commands";
import { context } from "../../src/context-instance";
import { prisma } from "../../src/prisma";
import { argHelpTest, assertCreatedJobs } from "../helpers";

async function fetchBlobHashes({
  fromBlockNumber,
  fromDate,
  toBlockNumber,
  toDate,
}: {
  fromDate?: string;
  toDate?: string;
  fromBlockNumber?: number;
  toBlockNumber?: number;
}) {
  let where;

  if (fromDate || toDate) {
    where = {
      blockTimestamp: {
        gte: fromDate ? dayjs(fromDate).utc().format() : undefined,
        lt: toDate ? dayjs(toDate).utc().format() : undefined,
      },
    };
  } else if (fromBlockNumber || toBlockNumber) {
    where = {
      blockNumber: {
        gte: fromBlockNumber,
        lte: toBlockNumber,
      },
    };
  }

  const dbBlobs = await prisma.blobsOnTransactions.findMany({
    select: {
      blockTimestamp: true,
      blobHash: true,
    },
    where,
  });

  return [...new Set(dbBlobs.map((b) => b.blobHash))];
}

describe("Create command", () => {
  beforeAll(() => {
    const consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => void {});
    return () => {
      consoleLogSpy.mockRestore();
    };
  });

  it("should create jobs for a set of given blob hashes correctly", async () => {
    const blobHashes = fixtures.blobs
      .slice(0, 2)
      .map((b) => b.versionedHash)
      .sort((a, b) => a.localeCompare(b));

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await create(["-b", blobHashes[0]!, "-b", blobHashes[1]!]);

    await assertCreatedJobs(context, blobHashes);
  });

  it("should create jobs for all blobs correctly", async () => {
    let blobHashes = fixtures.blobsOnTransactions.map((b) => b.blobHash);
    blobHashes = [...new Set(blobHashes)];

    await create();

    await assertCreatedJobs(context, blobHashes);
  });

  describe("when creating jobs given a date range", () => {
    it("should create jobs for blobs greater or equal than a given date correctly", async () => {
      const fromDate = "2023-08-25";

      await create(["--fromDate", fromDate]);

      const expectedBlobHashes = await fetchBlobHashes({ fromDate });

      await assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for all blobs less than a given date correctly", async () => {
      const toDate = "2022-12-20";

      await create(["--toDate", toDate]);

      const expectedBlobHashes = await fetchBlobHashes({ toDate });

      await assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for all blobs between a given date range correctly", async () => {
      const fromDate = "2023-08-24";
      const toDate = "2023-09-10";

      await create(["--fromDate", fromDate, "--toDate", toDate]);

      const expectedBlobHashes = await fetchBlobHashes({ fromDate, toDate });

      await assertCreatedJobs(context, expectedBlobHashes);
    });
  });

  describe("when creating jobs given a block range", () => {
    it("should create jobs for blobs greater or equal than a given block number correctly", async () => {
      const fromBlockNumber = 1004;

      await create(["--fromBlock", fromBlockNumber.toString()]);

      const expectedBlobHashes = await fetchBlobHashes({ fromBlockNumber });

      await assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for blobs less than a given block number correctly", async () => {
      const toBlockNumber = 1003;

      await create(["--toBlock", toBlockNumber.toString()]);

      const expectedBlobHashes = await fetchBlobHashes({ toBlockNumber });

      await assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for blobs between a given block range correctly", async () => {
      const fromBlockNumber = 1002;
      const toBlockNumber = 1004;

      await create([
        "--fromBlock",
        fromBlockNumber.toString(),
        "--toBlock",
        toBlockNumber.toString(),
      ]);

      const expectedBlobHashes = await fetchBlobHashes({
        fromBlockNumber,
        toBlockNumber,
      });

      await assertCreatedJobs(context, expectedBlobHashes);
    });
  });

  argHelpTest(create, createCommandUsage);

  it("should fail when providing a non-existing storage", () => {
    expect(
      create(["-q", "invalid-storage-name"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid queue 'invalid-storage-name'. Valid values are google, postgres, swarm, s3."`
    );
  });

  it("should fail when providing non-existing blob hashes", () => {
    expect(
      create(["-b", "invalid-blob-hash"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Could not find blobs with the following hashes: invalid-blob-hash"'
    );
  });
});
