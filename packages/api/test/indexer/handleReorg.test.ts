import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext, unauthorizedRPCCallTest } from "../helpers";
import type { IndexerCaller } from "./caller";
import { createIndexerCaller } from "./caller";

describe("handleReorg", () => {
  let nonAuthorizedCaller: IndexerCaller;
  let authorizedCaller: IndexerCaller;
  let authorizedCtx: TRPCContext;

  beforeAll(async () => {
    const ctx = await createTestContext();

    authorizedCtx = await createTestContext({
      apiClient: "indexer",
    });

    nonAuthorizedCaller = createIndexerCaller(ctx);
    authorizedCaller = createIndexerCaller(authorizedCtx);
  });

  afterAll(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("when authorized", () => {
    const rewindedBlockHashes = [
      "0x8000000000000000000000000000000000000000000000000000000000000000",
      "0x7000000000000000000000000000000000000000000000000000000000000000",
    ];
    const forwardedBlockHashes = [
      "0x00903f147f44929cdb385b595b2e745566fe50658362b4e3821fa52b5ebe8f06",
    ];

    describe("when handling rewinded blocks", () => {
      it("should mark them as reorged", async () => {
        await authorizedCaller.handleReorg({
          rewindedBlocks: rewindedBlockHashes,
          forwardedBlocks: [],
        });

        const dbRewindedBlockTxs =
          await authorizedCtx.prisma.transaction.findMany({
            select: {
              hash: true,
            },
            where: {
              blockHash: {
                in: rewindedBlockHashes,
              },
            },
            orderBy: {
              hash: "asc",
            },
          });
        const dbRewindedBlockForkTxs =
          await authorizedCtx.prisma.transactionFork.findMany({
            select: {
              hash: true,
            },
            where: {
              blockHash: {
                in: rewindedBlockHashes,
              },
            },
            orderBy: {
              hash: "asc",
            },
          });

        expect(dbRewindedBlockTxs).toEqual(dbRewindedBlockForkTxs);
      });

      describe("when cleaning up block references", () => {
        let rewindedBlockNumbers: number[];
        beforeAll(async () => {
          rewindedBlockNumbers = await authorizedCtx.prisma.block
            .findMany({
              select: {
                number: true,
              },
              where: {
                hash: {
                  in: rewindedBlockHashes,
                },
              },
              orderBy: {
                number: "asc",
              },
            })
            .then((blocks) => blocks.map((block) => block.number));
        });

        it("should remove block references from addresses with their first transaction in those blocks", async () => {
          const addressesWithRewindedBlockReferencesBefore =
            await authorizedCtx.prisma.address.findMany({
              where: {
                OR: [
                  {
                    firstBlockNumberAsSender: {
                      in: rewindedBlockNumbers,
                    },
                  },
                  {
                    firstBlockNumberAsReceiver: {
                      in: rewindedBlockNumbers,
                    },
                  },
                ],
              },
            });

          await authorizedCaller.handleReorg({
            rewindedBlocks: rewindedBlockHashes,
          });

          const addressesWithRewindedBlockReferencesAfter =
            await authorizedCtx.prisma.address.findMany({
              where: {
                OR: [
                  {
                    firstBlockNumberAsSender: {
                      in: rewindedBlockNumbers,
                    },
                  },
                  {
                    firstBlockNumberAsReceiver: {
                      in: rewindedBlockNumbers,
                    },
                  },
                ],
              },
            });

          expect(
            addressesWithRewindedBlockReferencesBefore.length,
            "address category infos should have rewinded block references before handling reorg"
          ).toBeGreaterThan(0);
          expect(
            addressesWithRewindedBlockReferencesAfter.length,
            "address category info's rewinded block references should have been deleted"
          ).toEqual(0);
        });

        it("should remove block number references from blobs", async () => {
          const blobsWithRewindedBlockReferencesBefore =
            await authorizedCtx.prisma.blob.findMany({
              where: {
                firstBlockNumber: {
                  in: rewindedBlockNumbers,
                },
              },
            });

          await authorizedCaller.handleReorg({
            rewindedBlocks: rewindedBlockHashes,
          });

          const blobsWithRewindedBlockReferencesAfter =
            await authorizedCtx.prisma.blob.findMany({
              where: {
                firstBlockNumber: {
                  in: rewindedBlockNumbers,
                },
              },
            });

          expect(
            blobsWithRewindedBlockReferencesBefore.length,
            "blobs should have rewinded block references before handling reorg"
          ).toBeGreaterThan(0);
          expect(
            blobsWithRewindedBlockReferencesAfter.length,
            "blob's rewinded block references should have been deleted"
          ).toEqual(0);
        });
      });
    });

    it("should unmark the forwarded blocks as reorged", async () => {
      const dbForwardedBlockTxsBefore =
        await authorizedCtx.prisma.transactionFork.findMany({
          select: {
            hash: true,
          },
          where: {
            blockHash: {
              in: forwardedBlockHashes,
            },
          },
          orderBy: {
            hash: "asc",
          },
        });

      await authorizedCaller.handleReorg({
        forwardedBlocks: forwardedBlockHashes,
      });

      const dbForwardedBlockTxsAfter =
        await authorizedCtx.prisma.transactionFork.findMany({
          select: {
            hash: true,
          },
          where: {
            blockHash: {
              in: forwardedBlockHashes,
            },
          },
          orderBy: {
            hash: "asc",
          },
        });

      expect(
        dbForwardedBlockTxsBefore.length,
        "block doesn't have fork transactions"
      ).toBeGreaterThan(0);
      expect(
        dbForwardedBlockTxsAfter.length,
        "block fork txs should have been deleted"
      ).toEqual(0);
    });
  });

  it("should skip if receiving empty forwarded and rewinded block arrays", async () => {
    await expect(
      authorizedCaller.handleReorg({
        rewindedBlocks: [],
        forwardedBlocks: [],
      })
    ).resolves.toBeUndefined();
  });

  it("should skip non-existent rewinded blocks", async () => {
    await expect(
      authorizedCaller.handleReorg({
        rewindedBlocks: [
          "0x992372cef5b4b0f1eee8589218fcd29908f6b19a76d23d0ad4e497479125aa85",
        ],
      })
    ).resolves.toBeUndefined();
  });

  unauthorizedRPCCallTest(() => nonAuthorizedCaller.handleReorg({}));
});
