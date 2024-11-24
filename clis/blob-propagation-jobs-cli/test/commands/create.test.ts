import { beforeAll, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { create, createCommandUsage } from "../../src/commands";
import { context } from "../../src/context-instance";
import { argHelpTest, assertCreatedJobs } from "../helpers";

async function fetchBlobHashesByDatePeriod(from?: string, to?: string) {
  const gte = from ? dayjs(from).utc().format() : undefined;
  const lt = to ? dayjs(to).utc().format() : undefined;

  const dbBlobs = await prisma.blobsOnTransactions.findMany({
    select: {
      blockTimestamp: true,
      blobHash: true,
    },
    where: {
      blockTimestamp: {
        gte,
        lt,
      },
    },
  });

  return [...new Set(dbBlobs.map((b) => b.blobHash))];
}

async function fetchBlobHashesByBlockNumber(from?: number, to?: number) {
  const dbBlobs = await prisma.blobsOnTransactions.findMany({
    select: {
      blockNumber: true,
      blobHash: true,
    },
    where: {
      blockNumber: {
        gte: from,
        lte: to,
      },
    },
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

    assertCreatedJobs(context, blobHashes);
  });

  it("should create jobs for all blobs correctly", async () => {
    let blobHashes = fixtures.blobsOnTransactions.map((b) => b.blobHash);
    blobHashes = [...new Set(blobHashes)];

    await create();

    assertCreatedJobs(context, blobHashes);
  });

  describe("when creating jobs for a provided date range", () => {
    it("should create jobs for blobs greater or equal than a given date correctly", async () => {
      const from = "2023-08-25";

      await create(["--fromDate", from]);

      const expectedBlobHashes = await fetchBlobHashesByDatePeriod(from);

      assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for all blobs less than a given date correctly", async () => {
      const to = "2022-12-20";

      await create(["--toDate", to]);

      const expectedBlobHashes = await fetchBlobHashesByDatePeriod(
        undefined,
        to
      );

      assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for all blobs between a given date range correctly", async () => {
      const from = "2023-08-24";
      const to = "2023-09-10";

      await create(["--fromDate", from, "--toDate", to]);

      const expectedBlobHashes = await fetchBlobHashesByDatePeriod(from, to);

      console.log(expectedBlobHashes);

      assertCreatedJobs(context, expectedBlobHashes);
    });
  });

  describe("when creating jobs for a provided block range", () => {
    it("should create jobs for blobs greater or equal than a given block number correctly", async () => {
      const from = 1004;

      await create(["--fromBlock", from.toString()]);

      const expectedBlobHashes = await fetchBlobHashesByBlockNumber(from);

      await assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for blobs less than a given block number correctly", async () => {
      const to = 1003;

      await create(["--toBlock", to.toString()]);

      const expectedBlobHashes = await fetchBlobHashesByBlockNumber(
        undefined,
        to
      );

      await assertCreatedJobs(context, expectedBlobHashes);
    });

    it("should create jobs for blobs between a given block range correctly", async () => {
      const from = 1002;
      const to = 1004;

      await create([
        "--fromBlock",
        from.toString(),
        "--toBlock",
        to.toString(),
      ]);

      const expectedBlobHashes = await fetchBlobHashesByBlockNumber(from, to);

      await assertCreatedJobs(context, expectedBlobHashes);
    });
  });

  argHelpTest(create, createCommandUsage);

  it("should fail when providing a non-existing storage", () => {
    expect(
      create(["-q", "invalid-storage-name"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid queue 'invalid-storage-name'. Valid values are finalizer, file_system, google, postgres, swarm."`
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
