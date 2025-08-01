import { TRPCError } from "@trpc/server";
import type { SpyInstance } from "vitest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { Category, Rollup } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";
import { ADDRESS_TO_ROLLUP_MAPPINGS } from "@blobscan/rollups";
import { omitDBTimestampFields, testValidError } from "@blobscan/test";

import { indexerRouter } from "../src/routers/indexer";
import { calculateBlobGasPrice } from "../src/routers/indexer/indexData.utils";
import { createTestContext, unauthorizedRPCCallTest } from "./helpers";
import {
  INPUT_WITH_DUPLICATED_BLOBS,
  INPUT,
  ROLLUP_BLOB_TRANSACTION_INPUT,
} from "./indexer.test.fixtures";

describe("Indexer router", async () => {
  let nonAuthorizedIndexerCaller: ReturnType<typeof indexerRouter.createCaller>;
  let authorizedIndexerCaller: ReturnType<typeof indexerRouter.createCaller>;
  let authorizedContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    const ctx = await createTestContext();

    authorizedContext = await createTestContext({
      apiClient: { type: "indexer" },
    });

    nonAuthorizedIndexerCaller = indexerRouter.createCaller(ctx);
    authorizedIndexerCaller = indexerRouter.createCaller(authorizedContext);
  });

  afterAll(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("indexData", () => {
    describe("when authorized", () => {
      beforeEach(async () => {
        await authorizedIndexerCaller.indexData(INPUT);
      });

      it("should index a block correctly", async () => {
        const indexedBlock = await authorizedContext.prisma.block
          .findUnique({
            where: {
              hash: INPUT.block.hash,
            },
          })
          .then((res) => (res ? omitDBTimestampFields(res) : res));

        const {
          blobGasPrice,
          blobAsCalldataGasUsed: _,
          ...remainingParams
        } = indexedBlock ?? {};
        // const expectedBlobAsCalldataGasUsed = INPUT.blobs.reduce(
        //   (acc, b) => acc + getEIP2028CalldataGas(b.data),
        //   0
        // );
        const expectedBlobGasPrice = calculateBlobGasPrice(
          INPUT.block.slot,
          BigInt(INPUT.block.excessBlobGas)
        );

        // TODO: Fix this test
        // expect(blobAsCalldataGasUsed).toBe(expectedBlobAsCalldataGasUsed);
        expect(blobGasPrice?.toString(), "Blob gas price mismatch").toBe(
          expectedBlobGasPrice.toString()
        );
        expect(remainingParams).toMatchInlineSnapshot(`
          {
            "blobGasUsed": "10000",
            "excessBlobGas": "5000",
            "hash": "blockHash2010",
            "number": 2010,
            "slot": 130,
            "timestamp": 2023-09-01T13:50:21.000Z,
          }
        `);
      });

      describe("when indexing transactions", () => {
        const expectedRollup = Rollup.ARBITRUM;

        beforeAll(() => {
          ADDRESS_TO_ROLLUP_MAPPINGS.set(
            env.CHAIN_ID,
            new Map([
              ...ROLLUP_BLOB_TRANSACTION_INPUT.transactions.map(
                (tx) => [tx.from, expectedRollup] as [string, Rollup]
              ),
            ])
          );
        });

        afterAll(() => {
          ADDRESS_TO_ROLLUP_MAPPINGS.delete(env.CHAIN_ID);
        });

        it("should index transactions correctly", async () => {
          const indexedTxs = await authorizedContext.prisma.transaction
            .findMany({
              where: {
                blockHash: INPUT.block.hash,
              },
              orderBy: [
                {
                  blockNumber: "asc",
                },
                {
                  index: "asc",
                },
              ],
            })
            .then((r) => r.map(omitDBTimestampFields));
          // const expectedBlobAsCalldataGasUsed = INPUT.transactions.map((tx) =>
          //   INPUT.blobs
          //     .filter((b) => b.txHash === tx.hash)
          //     .reduce((acc, b) => acc + getEIP2028CalldataGas(b.data), 0)
          // );
          // const blobAsCalldataGasUsed = indexedTxs.map(
          //   (tx) => tx.blobAsCalldataGasUsed
          // );
          const remainingParams = indexedTxs.map(
            ({ blobAsCalldataGasUsed: _, ...remainingParams }) =>
              remainingParams
          );

          // TODO: Fix this test
          // expect(
          //   blobAsCalldataGasUsed,
          //   "Transactions' blob as calldata gas used mismatch"
          // ).toEqual(expectedBlobAsCalldataGasUsed);
          expect(remainingParams).toMatchInlineSnapshot(`
            [
              {
                "blobGasUsed": "131072",
                "blockHash": "blockHash2010",
                "blockNumber": 2010,
                "blockTimestamp": 2023-09-01T13:50:21.000Z,
                "decodedFields": {},
                "fromId": "address9",
                "gasPrice": "10000",
                "hash": "txHash999",
                "index": 0,
                "maxFeePerBlobGas": "1800",
                "toId": "address10",
              },
              {
                "blobGasUsed": "262144",
                "blockHash": "blockHash2010",
                "blockNumber": 2010,
                "blockTimestamp": 2023-09-01T13:50:21.000Z,
                "decodedFields": {},
                "fromId": "address7",
                "gasPrice": "3000000",
                "hash": "txHash1000",
                "index": 1,
                "maxFeePerBlobGas": "20000",
                "toId": "address2",
              },
            ]
          `);
        });

        it("should identify rollup transactions correctly", async () => {
          await authorizedIndexerCaller.indexData(
            ROLLUP_BLOB_TRANSACTION_INPUT
          );

          const indexedTxHashesAndRollups =
            await authorizedContext.prisma.transaction
              .findMany({
                select: {
                  hash: true,
                  from: {
                    select: {
                      rollup: true,
                    },
                  },
                },
                where: {
                  blockHash: ROLLUP_BLOB_TRANSACTION_INPUT.block.hash,
                },
              })
              .then((r) => r.map((tx) => [tx.hash, tx.from.rollup]));

          const expectedTxHashesAndRollups =
            ROLLUP_BLOB_TRANSACTION_INPUT.transactions.map(({ hash }) => [
              hash,
              expectedRollup,
            ]);

          expect(indexedTxHashesAndRollups).toEqual(expectedTxHashesAndRollups);
        });

        it("should categorize a rollup transaction correctly", async () => {
          await authorizedIndexerCaller.indexData(
            ROLLUP_BLOB_TRANSACTION_INPUT
          );

          const indexedTxHashesAndCategories =
            await authorizedContext.prisma.transaction
              .findMany({
                select: {
                  hash: true,
                  from: {
                    select: {
                      rollup: true,
                    },
                  },
                },
                where: {
                  blockHash: ROLLUP_BLOB_TRANSACTION_INPUT.block.hash,
                },
              })
              .then((r) =>
                r.map((tx) => [tx.hash, tx.from.rollup ? "ROLLUP" : "OTHER"])
              );

          const expectedTxHashesAndCategories =
            ROLLUP_BLOB_TRANSACTION_INPUT.transactions.map(
              ({ hash }): [string, Category] => [hash, Category.ROLLUP]
            );
          expect(indexedTxHashesAndCategories).toEqual(
            expectedTxHashesAndCategories
          );
        });

        it("should categorize an unknown transaction correctly", async () => {
          const indexedTxHashesAndCategories =
            await authorizedContext.prisma.transaction
              .findMany({
                select: {
                  hash: true,
                  from: {
                    select: {
                      rollup: true,
                    },
                  },
                },
                where: {
                  blockHash: INPUT.block.hash,
                },
                orderBy: [
                  {
                    blockNumber: "asc",
                  },
                  {
                    index: "asc",
                  },
                ],
              })
              .then((r) =>
                r.map((tx) => [tx.hash, tx.from.rollup ? "ROLLUP" : "OTHER"])
              );

          const expectedTxHashesAndCategories = INPUT.transactions.map(
            ({ hash }): [string, Category] => [hash, Category.OTHER]
          );

          expect(indexedTxHashesAndCategories).toEqual(
            expectedTxHashesAndCategories
          );
        });
      });

      describe("when indexing blobs", () => {
        it("should calculate and store blob size correctly", async () => {
          const expectedBlobSizes = INPUT.blobs.map((b) => ({
            versionedHash: b.versionedHash,
            size: b.data.slice(2).length / 2,
          }));

          const dbBlobSizes = await authorizedContext.prisma.blob.findMany({
            select: {
              versionedHash: true,
              size: true,
            },
            where: {
              versionedHash: {
                in: expectedBlobSizes.map((b) => b.versionedHash),
              },
            },
          });

          expect(dbBlobSizes).toEqual(expectedBlobSizes);
        });

        it("should calculate and store blob usage size correctly", async () => {
          const expectedBlobUsageSizes = INPUT.blobs.map((b) => {
            let trailingZeroes = 0;
            let i = b.data.length - 1;

            while (i > 0 && b.data[i - 1] === "0") {
              trailingZeroes++;
              i--;
            }

            const totalBytes = b.data.slice(2).length / 2;
            const paddingBytes = trailingZeroes / 2;

            return {
              versionedHash: b.versionedHash,
              usageSize: totalBytes - paddingBytes,
            };
          });

          const dbBlobUsageSizes = await authorizedContext.prisma.blob.findMany(
            {
              select: {
                versionedHash: true,
                usageSize: true,
              },
              where: {
                versionedHash: {
                  in: expectedBlobUsageSizes.map((b) => b.versionedHash),
                },
              },
            }
          );

          expect(dbBlobUsageSizes).toEqual(expectedBlobUsageSizes);
        });

        it("should index them correctly", async () => {
          const txHashes = INPUT.transactions.map((tx) => tx.hash);
          const indexedBlobs = (
            await authorizedContext.prisma.blobsOnTransactions.findMany({
              where: {
                txHash: {
                  in: txHashes,
                },
              },
            })
          ).sort((a, b) => a.blobHash.localeCompare(b.blobHash));

          expect(indexedBlobs).toMatchInlineSnapshot(`
            [
              {
                "blobHash": "blobHash1000",
                "blockHash": "blockHash2010",
                "blockNumber": 2010,
                "blockTimestamp": 2023-09-01T13:50:21.000Z,
                "index": 0,
                "txHash": "txHash1000",
                "txIndex": 1,
              },
              {
                "blobHash": "blobHash1001",
                "blockHash": "blockHash2010",
                "blockNumber": 2010,
                "blockTimestamp": 2023-09-01T13:50:21.000Z,
                "index": 1,
                "txHash": "txHash1000",
                "txIndex": 1,
              },
              {
                "blobHash": "blobHash999",
                "blockHash": "blockHash2010",
                "blockNumber": 2010,
                "blockTimestamp": 2023-09-01T13:50:21.000Z,
                "index": 0,
                "txHash": "txHash999",
                "txIndex": 0,
              },
            ]
          `);
        });

        describe("when indexing blob data", () => {
          let ctxWithBlobPropagator: Awaited<
            ReturnType<typeof createTestContext>
          >;
          let indexerCallerWithBlobPropagator: ReturnType<
            typeof indexerRouter.createCaller
          >;
          let blobPropagatorSpy: SpyInstance<
            [
              blobs: {
                versionedHash: string;
                data: string;
              }[]
            ],
            Promise<void>
          >;

          beforeAll(async () => {
            ctxWithBlobPropagator = await createTestContext({
              apiClient: { type: "indexer" },
              withBlobPropagator: true,
            });

            indexerCallerWithBlobPropagator = indexerRouter.createCaller(
              ctxWithBlobPropagator
            );

            blobPropagatorSpy = vi.spyOn(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              ctxWithBlobPropagator.blobPropagator!,
              "propagateBlobs"
            );
          });

          it("should call blob propagator", async () => {
            const expectedInput = INPUT_WITH_DUPLICATED_BLOBS.blobs.map(
              (b) => ({
                ...b,
                blockNumber: INPUT_WITH_DUPLICATED_BLOBS.block.number,
              })
            );

            await indexerCallerWithBlobPropagator.indexData(
              INPUT_WITH_DUPLICATED_BLOBS
            );

            expect(blobPropagatorSpy).toHaveBeenCalledOnce();
            expect(
              blobPropagatorSpy,
              "Propagator called with invalid blobs"
            ).toHaveBeenCalledWith(expectedInput);
          });
        });
      });

      it("should create valid blob on transaction entities", async () => {
        const indexedBlobsOnTransactions = (
          await authorizedContext.prisma.blobsOnTransactions.findMany({
            where: {
              txHash: {
                in: INPUT.transactions.map((tx) => tx.hash),
              },
            },
          })
        ).sort((a, b) => a.blobHash.localeCompare(b.blobHash));

        expect(indexedBlobsOnTransactions).toMatchInlineSnapshot(`
          [
            {
              "blobHash": "blobHash1000",
              "blockHash": "blockHash2010",
              "blockNumber": 2010,
              "blockTimestamp": 2023-09-01T13:50:21.000Z,
              "index": 0,
              "txHash": "txHash1000",
              "txIndex": 1,
            },
            {
              "blobHash": "blobHash1001",
              "blockHash": "blockHash2010",
              "blockNumber": 2010,
              "blockTimestamp": 2023-09-01T13:50:21.000Z,
              "index": 1,
              "txHash": "txHash1000",
              "txIndex": 1,
            },
            {
              "blobHash": "blobHash999",
              "blockHash": "blockHash2010",
              "blockNumber": 2010,
              "blockTimestamp": 2023-09-01T13:50:21.000Z,
              "index": 0,
              "txHash": "txHash999",
              "txIndex": 0,
            },
          ]
        `);
      });

      it("should update address entities correctly", async () => {
        // Remove duplicates
        const addressesSet = new Set(
          INPUT.transactions.flatMap((tx) => [tx.from, tx.to])
        );
        const indexedAddresses =
          await authorizedContext.prisma.address.findMany({
            select: {
              address: true,
              firstBlockNumberAsReceiver: true,
              firstBlockNumberAsSender: true,
            },
            where: {
              address: {
                in: Array.from(addressesSet),
              },
            },
            orderBy: [
              {
                address: "asc",
              },
            ],
          });

        expect(indexedAddresses).toMatchInlineSnapshot(`
          [
            {
              "address": "address10",
              "firstBlockNumberAsReceiver": 2010,
              "firstBlockNumberAsSender": null,
            },
            {
              "address": "address2",
              "firstBlockNumberAsReceiver": 1001,
              "firstBlockNumberAsSender": 1003,
            },
            {
              "address": "address7",
              "firstBlockNumberAsReceiver": null,
              "firstBlockNumberAsSender": 2010,
            },
            {
              "address": "address9",
              "firstBlockNumberAsReceiver": null,
              "firstBlockNumberAsSender": 2010,
            },
          ]
        `);
      });

      it("should be idempotent", async () => {
        // Index the same block again
        await expect(
          authorizedIndexerCaller.indexData(INPUT)
        ).resolves.toBeUndefined();
      });

      testValidError(
        "should fail when receiving an empty array of transactions",
        async () => {
          await authorizedIndexerCaller.indexData({
            ...INPUT,
            transactions: [] as unknown as typeof INPUT.transactions,
          });
        },
        TRPCError
      );

      testValidError(
        "should fail when receiving an empty array of blobs",
        async () => {
          await authorizedIndexerCaller.indexData({
            ...INPUT,
            blobs: [] as unknown as typeof INPUT.blobs,
          });
        },
        TRPCError
      );
    });

    it("should fail when calling procedure without auth", async () => {
      await expect(nonAuthorizedIndexerCaller.indexData(INPUT)).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" })
      );
    });
  });

  describe("handleReorg", () => {
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
          await authorizedIndexerCaller.handleReorg({
            rewindedBlocks: rewindedBlockHashes,
            forwardedBlocks: [],
          });

          const dbRewindedBlockTxs =
            await authorizedContext.prisma.transaction.findMany({
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
            await authorizedContext.prisma.transactionFork.findMany({
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
            rewindedBlockNumbers = await authorizedContext.prisma.block
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
              await authorizedContext.prisma.address.findMany({
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

            await authorizedIndexerCaller.handleReorg({
              rewindedBlocks: rewindedBlockHashes,
            });

            const addressesWithRewindedBlockReferencesAfter =
              await authorizedContext.prisma.address.findMany({
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
              await authorizedContext.prisma.blob.findMany({
                where: {
                  firstBlockNumber: {
                    in: rewindedBlockNumbers,
                  },
                },
              });

            await authorizedIndexerCaller.handleReorg({
              rewindedBlocks: rewindedBlockHashes,
            });

            const blobsWithRewindedBlockReferencesAfter =
              await authorizedContext.prisma.blob.findMany({
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
          await authorizedContext.prisma.transactionFork.findMany({
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

        await authorizedIndexerCaller.handleReorg({
          forwardedBlocks: forwardedBlockHashes,
        });

        const dbForwardedBlockTxsAfter =
          await authorizedContext.prisma.transactionFork.findMany({
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
        authorizedIndexerCaller.handleReorg({
          rewindedBlocks: [],
          forwardedBlocks: [],
        })
      ).resolves.toBeUndefined();
    });

    it("should skip non-existent rewinded blocks", async () => {
      await expect(
        authorizedIndexerCaller.handleReorg({
          rewindedBlocks: [
            "0x992372cef5b4b0f1eee8589218fcd29908f6b19a76d23d0ad4e497479125aa85",
          ],
        })
      ).resolves.toBeUndefined();
    });

    unauthorizedRPCCallTest(() => nonAuthorizedIndexerCaller.handleReorg({}));
  });
});
