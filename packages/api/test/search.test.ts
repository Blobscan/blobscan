import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";
import type { z } from "@blobscan/zod";

import { appRouter } from "../src";
import type { searchResultsSchema } from "../src/routers/search";
import { createTestContext } from "./helpers";

type SearchResultsSchema = z.output<typeof searchResultsSchema>;

describe("Search procedure", async () => {
  let searchCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await createTestContext();
    searchCaller = appRouter.createCaller(ctx);
  });

  describe("when searching addresses", () => {
    it("should find it", async () => {
      const expectedResults: SearchResultsSchema = {
        addresses: [
          {
            address: "0x6887246668a3b87f54deb3b94ba47a6f63f32985",
            rollup: "OPTIMISM",
          },
        ],
      };

      const result = await searchCaller.search({
        query: "0x6887246668a3b87f54deb3b94ba47a6f63f32985",
      });
      expect(result).toMatchObject(expectedResults);
    });
  });

  describe("when searching blobs", () => {
    const { commitment, proof, versionedHash } =
      fixtures.blobs.find(
        (b) =>
          b.versionedHash ===
          "0x010001c79d78a76fb9b4bab3896ee3ea32f3e2607da7801eb1a92da39d6c1368"
      ) ?? {};
    const { blockTimestamp, txHash } =
      fixtures.blobsOnTransactions.findLast(
        (bOnTx) => bOnTx.blobHash === versionedHash
      ) ?? {};
    const fromId = fixtures.txs.find((tx) => tx.hash === txHash)?.fromId;
    const from = fixtures.addresses.find((a) => a.address === fromId);

    const expectedBlobResult: SearchResultsSchema =
      commitment && proof && blockTimestamp && versionedHash
        ? {
            blobs: [
              {
                commitment,
                proof,
                versionedHash,
                transactions: [
                  {
                    blockTimestamp: new Date(blockTimestamp),
                    transaction: {
                      from: {
                        rollup: from?.rollup,
                      },
                    },
                  },
                ],
              },
            ],
          }
        : ({} as SearchResultsSchema);

    it("should find it by commitment", async () => {
      const result = await searchCaller.search({
        query:
          "0xb4f67eb0771fbbf1b06b88ce0e23383daf994320508d44dd30dbd507f598c0d9b3da5a152e41a0428375060c3803b983",
      });

      expect(result).toMatchObject(expectedBlobResult);
    });

    it("should find it by proof", async () => {
      const result = await searchCaller.search({
        query:
          "0x89cf91c4c8be6f2a390d4262425f79dffb74c174fb15a210182184543bf7394e5a7970a774ee8e0dabc315424c22df0f",
      });

      expect(result).toMatchObject(expectedBlobResult);
    });

    it("should find it by versioned hash", async () => {
      const result = await searchCaller.search({
        query:
          "0x010001c79d78a76fb9b4bab3896ee3ea32f3e2607da7801eb1a92da39d6c1368",
      });

      expect(result).toMatchObject(expectedBlobResult);
    });
  });

  describe("when searching blocks", () => {
    const block = fixtures.blocks.find(
      (b) =>
        b.hash ===
        "0x1000000000000000000000000000000000000000000000000000000000000000"
    );
    const expectedBlockResult: SearchResultsSchema = block
      ? {
          blocks: [
            {
              hash: block.hash,
              number: block.number,
              slot: block.slot,
              timestamp: new Date(block.timestamp),
              reorg: false,
            },
          ],
        }
      : ({} as SearchResultsSchema);

    it("should find it by block number", async () => {
      const result = await searchCaller.search({
        query: "1001",
      });

      expect(result).toMatchObject(expectedBlockResult);
    });

    it("should find it by block hash", async () => {
      const result = await searchCaller.search({
        query:
          "0x1000000000000000000000000000000000000000000000000000000000000000",
      });

      expect(result).toMatchObject(expectedBlockResult);
    });

    it("should find it by slot", async () => {
      const result = await searchCaller.search({
        query: "101",
      });

      expect(result).toMatchObject(expectedBlockResult);
    });
  });

  describe("when searching txs", () => {
    const tx = fixtures.txs.find(
      (tx) =>
        tx.hash ===
        "0x5be77167b05f39ea8950f11b0da2bdfec6e04055030068b051ac5a43aaf251e9"
    );
    const expectedTransactionResult: SearchResultsSchema = tx
      ? {
          transactions: [
            {
              blockTimestamp: new Date(tx.blockTimestamp),
              from: {
                rollup: null,
              },
              hash: tx.hash,
              reorg: false,
            },
          ],
        }
      : ({} as SearchResultsSchema);

    it("should find it by hash", async () => {
      const result = await searchCaller.search({
        query:
          "0x5be77167b05f39ea8950f11b0da2bdfec6e04055030068b051ac5a43aaf251e9",
      });

      expect(result).toMatchObject(expectedTransactionResult);
    });
  });

  it("should return null for unmatched search queries", async () => {
    const result = await searchCaller.search({
      query: "unknown",
    });

    expect(result).toBeNull();
  });
});
