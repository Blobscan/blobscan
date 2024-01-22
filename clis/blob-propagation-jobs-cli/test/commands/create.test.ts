import { describe, expect, it } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { create, createCommandUsage } from "../../src/commands";
import { context } from "../../src/context-instance";
import { argHelpTest, assertCreatedJobs } from "../helpers";

async function fetchBlobHashesByDatePeriod(from?: string, to?: string) {
  const dbBlobs = await prisma.block.findMany({
    select: {
      timestamp: true,
      transactions: {
        select: {
          blobs: {
            select: {
              blobHash: true,
            },
          },
        },
      },
    },
    where: {
      timestamp: {
        gte: from ? dayjs(from).toISOString() : undefined,
        lte: to ? dayjs(to).toISOString() : undefined,
      },
    },
  });

  return [
    ...new Set(
      dbBlobs
        .map((b) => b.transactions.map((t) => t.blobs.map((bl) => bl.blobHash)))
        .flat(2)
    ),
  ];
}

describe("Create command", () => {
  const queues = context.getAllQueues();

  it("should create jobs for a set of given blob hashes correctly", async () => {
    const blobHashes = fixtures.blobs
      .slice(0, 2)
      .map((b) => b.versionedHash)
      .sort((a, b) => a.localeCompare(b));

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await create(["-b", blobHashes[0]!, "-b", blobHashes[1]!]);

    const createdJobs = await context.getJobs();

    assertCreatedJobs(createdJobs, queues, blobHashes);
  });

  it("should create jobs for all blobs correctly", async () => {
    const blobHashes = fixtures.blobs.map((b) => b.versionedHash);

    await create();

    const createdJobs = await context.getJobs();

    assertCreatedJobs(createdJobs, queues, blobHashes);
  });

  it("should create jobs for all blobs greater than a given date correctly", async () => {
    const from = "2023-08-25";

    await create(["-f", from]);

    const expectedBlobHashes = await fetchBlobHashesByDatePeriod(from);

    const createdJobs = await context.getJobs();

    assertCreatedJobs(createdJobs, queues, expectedBlobHashes);
  });

  it("should create jobs for all blobs less than a given date correctly", async () => {
    const to = "2022-12-20";

    await create(["-t", to]);

    const expectedBlobHashes = await fetchBlobHashesByDatePeriod(undefined, to);
    const createdJobs = await context.getJobs();

    assertCreatedJobs(createdJobs, queues, expectedBlobHashes);
  });

  it.only("should create jobs for all blobs between a given date range correctly", async () => {
    const from = "2023-08-25";
    const to = "2023-09-10";

    await create(["-f", from, "-t", to]);

    const expectedBlobHashes = await fetchBlobHashesByDatePeriod(from, to);

    const createdJobs = await context.getJobs();

    assertCreatedJobs(createdJobs, queues, expectedBlobHashes);
  });

  argHelpTest(create, createCommandUsage);

  it("should fail when providing a non-existing storage", () => {
    expect(
      create(["-s", "invalid-storage-name"])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Invalid queue name: invalid-storage-name"'
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
