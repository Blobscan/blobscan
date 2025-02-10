import { TRPCError } from "@trpc/server";
import type { SpyInstance } from "vitest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { Blob as PropagatorBlob } from "@blobscan/blob-propagator";
import type { BlobReference } from "@blobscan/blob-storage-manager";
import { Category, Rollup } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";
import { ADDRESS_TO_ROLLUP_MAPPINGS } from "@blobscan/rollups";
import { omitDBTimestampFields, testValidError } from "@blobscan/test";

import { appRouter } from "../src/app-router";
import { calculateBlobGasPrice } from "../src/routers/indexer/indexData.utils";
import { createTestContext, unauthorizedRPCCallTest } from "./helpers";
import {
  INPUT_WITH_DUPLICATED_BLOBS,
  INPUT,
  ROLLUP_BLOB_TRANSACTION_INPUT,
} from "./indexer.test.fixtures";

describe("Indexer router", async () => {
  let nonAuthorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let authorizedCaller: ReturnType<typeof appRouter.createCaller>;
  let authorizedContext: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    const ctx = await createTestContext();

    authorizedContext = await createTestContext({
      apiClient: { type: "indexer" },
    });

    nonAuthorizedCaller = appRouter.createCaller(ctx);
    authorizedCaller = appRouter.createCaller(authorizedContext);
  });

  afterAll(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("indexData", () => {
    describe("when authorized", () => {
      beforeEach(async () => {
        await authorizedCaller.indexer.indexData(INPUT);
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
                "category": "OTHER",
                "decodedFields": {},
                "fromId": "address9",
                "gasPrice": "10000",
                "hash": "txHash999",
                "index": 0,
                "maxFeePerBlobGas": "1800",
                "rollup": null,
                "toId": "address10",
              },
              {
                "blobGasUsed": "262144",
                "blockHash": "blockHash2010",
                "blockNumber": 2010,
                "blockTimestamp": 2023-09-01T13:50:21.000Z,
                "category": "OTHER",
                "decodedFields": {},
                "fromId": "address7",
                "gasPrice": "3000000",
                "hash": "txHash1000",
                "index": 1,
                "maxFeePerBlobGas": "20000",
                "rollup": null,
                "toId": "address2",
              },
            ]
          `);
        });

        it("should identify rollup transactions correctly", async () => {
          await authorizedCaller.indexer.indexData(
            ROLLUP_BLOB_TRANSACTION_INPUT
          );

          const indexedTxHashesAndRollups =
            await authorizedContext.prisma.transaction
              .findMany({
                where: {
                  blockHash: ROLLUP_BLOB_TRANSACTION_INPUT.block.hash,
                },
              })
              .then((r) =>
                r.map(omitDBTimestampFields).map((tx) => [tx.hash, tx.rollup])
              );

          const expectedTxHashesAndRollups =
            ROLLUP_BLOB_TRANSACTION_INPUT.transactions.map(({ hash }) => [
              hash,
              expectedRollup,
            ]);

          expect(indexedTxHashesAndRollups).toEqual(expectedTxHashesAndRollups);
        });

        it("should categorize a rollup transaction correctly", async () => {
          await authorizedCaller.indexer.indexData(
            ROLLUP_BLOB_TRANSACTION_INPUT
          );

          const indexedTxHashesAndCategories =
            await authorizedContext.prisma.transaction
              .findMany({
                where: {
                  blockHash: ROLLUP_BLOB_TRANSACTION_INPUT.block.hash,
                },
              })
              .then((r) =>
                r.map(omitDBTimestampFields).map((tx) => [tx.hash, tx.category])
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
                r.map(omitDBTimestampFields).map((tx) => [tx.hash, tx.category])
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
          const blobVersionedHashes = INPUT.blobs.map((b) => b.versionedHash);

          describe("when blob propagator is disabled", () => {
            it("should store it on the db correctly", async () => {
              const dbBlobData = await authorizedContext.prisma.blobData
                .findMany({
                  where: {
                    id: {
                      in: blobVersionedHashes,
                    },
                  },
                })
                .then((res) =>
                  res
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map((b) => `0x${b.data.toString("hex")}`)
                );

              expect(dbBlobData).toMatchInlineSnapshot(`
              [
                "0x34567890abcdef1234567890abcdef",
                "0x34567890abcdef1234567890abcdef1234567890abcdef",
                "0x1234abcdeff123456789ab",
              ]
            `);
            });

            it("should store it on google storage correctly", async () => {
              const blobDataStorageRefs =
                await authorizedContext.prisma.blobDataStorageReference.findMany(
                  {
                    where: {
                      AND: {
                        blobHash: {
                          in: blobVersionedHashes,
                        },
                        blobStorage: "GOOGLE",
                      },
                    },
                  }
                );
              const blobRefs = blobDataStorageRefs.map<BlobReference>(
                (ref) => ({
                  reference: ref.dataReference,
                  storage: "GOOGLE",
                })
              );
              const gcsBlobData = await Promise.all(
                blobRefs.map((ref) =>
                  authorizedContext.blobStorageManager.getBlobByReferences(ref)
                )
              ).then((res) =>
                res.sort((a, b) => (a && b ? a.data.localeCompare(b.data) : 0))
              );

              expect(gcsBlobData).toMatchInlineSnapshot(`
                [
                  {
                    "data": "0x1234abcdeff123456789ab",
                    "storage": "GOOGLE",
                  },
                  {
                    "data": "0x34567890abcdef1234567890abcdef",
                    "storage": "GOOGLE",
                  },
                  {
                    "data": "0x34567890abcdef1234567890abcdef1234567890abcdef",
                    "storage": "GOOGLE",
                  },
                ]
              `);
            });

            it("should create blob storage references correctly", async () => {
              const indexedBlobHashes = INPUT.blobs.map(
                (blob) => blob.versionedHash
              );
              const blobStorageRefs =
                await authorizedContext.prisma.blobDataStorageReference.findMany(
                  {
                    orderBy: {
                      blobHash: "asc",
                    },
                    where: {
                      blobHash: {
                        in: indexedBlobHashes,
                      },
                    },
                  }
                );

              expect(blobStorageRefs).toMatchInlineSnapshot(`
                [
                  {
                    "blobHash": "blobHash1000",
                    "blobStorage": "GOOGLE",
                    "dataReference": "70118930558/ob/Ha/sh/obHash1000.txt",
                  },
                  {
                    "blobHash": "blobHash1000",
                    "blobStorage": "POSTGRES",
                    "dataReference": "blobHash1000",
                  },
                  {
                    "blobHash": "blobHash1001",
                    "blobStorage": "GOOGLE",
                    "dataReference": "70118930558/ob/Ha/sh/obHash1001.txt",
                  },
                  {
                    "blobHash": "blobHash1001",
                    "blobStorage": "POSTGRES",
                    "dataReference": "blobHash1001",
                  },
                  {
                    "blobHash": "blobHash999",
                    "blobStorage": "GOOGLE",
                    "dataReference": "70118930558/ob/Ha/sh/obHash999.txt",
                  },
                  {
                    "blobHash": "blobHash999",
                    "blobStorage": "POSTGRES",
                    "dataReference": "blobHash999",
                  },
                ]
              `);
            });
          });
        });

        describe("when blob propagator is enabled", () => {
          let ctxWithBlobPropagator: Awaited<
            ReturnType<typeof createTestContext>
          >;
          let callerWithBlobPropagator: ReturnType<
            typeof appRouter.createCaller
          >;
          let blobPropagatorSpy: SpyInstance<
            [blobs: PropagatorBlob[]],
            Promise<void>
          >;

          beforeAll(async () => {
            ctxWithBlobPropagator = await createTestContext({
              apiClient: { type: "indexer" },
              withBlobPropagator: true,
            });

            callerWithBlobPropagator = appRouter.createCaller(
              ctxWithBlobPropagator
            );

            blobPropagatorSpy = vi.spyOn(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              ctxWithBlobPropagator.blobPropagator!,
              "propagateBlobs"
            );
          });

          afterEach(async () => {
            const blobPropagator = ctxWithBlobPropagator.blobPropagator;

            if (blobPropagator) {
              await blobPropagator.close();
            }
          });

          it("should call blob propagator", async () => {
            await callerWithBlobPropagator.indexer.indexData(
              INPUT_WITH_DUPLICATED_BLOBS
            );

            expect(blobPropagatorSpy).toHaveBeenCalledOnce();
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

      it("should update the indexed addresses category info correctly", async () => {
        // Remove duplicates
        const addressesSet = new Set(
          INPUT.transactions.flatMap((tx) => [tx.from, tx.to])
        );
        const indexedAddresses =
          await authorizedContext.prisma.addressCategoryInfo
            .findMany({
              where: {
                address: {
                  in: Array.from(addressesSet),
                },
              },
              orderBy: [
                {
                  address: "asc",
                },
                {
                  category: "asc",
                },
              ],
            })
            .then((r) => r.map(({ id: _, ...rest }) => rest));

        expect(indexedAddresses).toMatchInlineSnapshot(`
          [
            {
              "address": "address10",
              "category": "OTHER",
              "firstBlockNumberAsReceiver": 2010,
              "firstBlockNumberAsSender": null,
            },
            {
              "address": "address10",
              "category": null,
              "firstBlockNumberAsReceiver": 2010,
              "firstBlockNumberAsSender": null,
            },
            {
              "address": "address2",
              "category": "OTHER",
              "firstBlockNumberAsReceiver": 1001,
              "firstBlockNumberAsSender": 1003,
            },
            {
              "address": "address2",
              "category": "ROLLUP",
              "firstBlockNumberAsReceiver": 1004,
              "firstBlockNumberAsSender": null,
            },
            {
              "address": "address2",
              "category": null,
              "firstBlockNumberAsReceiver": 1001,
              "firstBlockNumberAsSender": 1003,
            },
            {
              "address": "address7",
              "category": "OTHER",
              "firstBlockNumberAsReceiver": null,
              "firstBlockNumberAsSender": 2010,
            },
            {
              "address": "address7",
              "category": null,
              "firstBlockNumberAsReceiver": null,
              "firstBlockNumberAsSender": 2010,
            },
            {
              "address": "address9",
              "category": "OTHER",
              "firstBlockNumberAsReceiver": null,
              "firstBlockNumberAsSender": 2010,
            },
            {
              "address": "address9",
              "category": null,
              "firstBlockNumberAsReceiver": null,
              "firstBlockNumberAsSender": 2010,
            },
          ]
        `);
      });

      it("should be idempotent", async () => {
        // Index the same block again
        await expect(
          authorizedCaller.indexer.indexData(INPUT)
        ).resolves.toBeUndefined();
      });

      testValidError(
        "should fail when receiving an empty array of transactions",
        async () => {
          await authorizedCaller.indexer.indexData({
            ...INPUT,
            transactions: [] as unknown as typeof INPUT.transactions,
          });
        },
        TRPCError
      );

      testValidError(
        "should fail when receiving an empty array of blobs",
        async () => {
          await authorizedCaller.indexer.indexData({
            ...INPUT,
            blobs: [] as unknown as typeof INPUT.blobs,
          });
        },
        TRPCError
      );
    });

    it("should fail when calling procedure without auth", async () => {
      await expect(
        nonAuthorizedCaller.indexer.indexData(INPUT)
      ).rejects.toThrow(new TRPCError({ code: "UNAUTHORIZED" }));
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
          await authorizedCaller.indexer.handleReorg({
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
            const addressCategoryInfosWithRewindedBlockReferencesBefore =
              await authorizedContext.prisma.addressCategoryInfo.findMany({
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

            await authorizedCaller.indexer.handleReorg({
              rewindedBlocks: rewindedBlockHashes,
            });

            const addressCategoryInfosWithRewindedBlockReferencesAfter =
              await authorizedContext.prisma.addressCategoryInfo.findMany({
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
              addressCategoryInfosWithRewindedBlockReferencesBefore.length,
              "address category infos should have rewinded block references before handling reorg"
            ).toBeGreaterThan(0);
            expect(
              addressCategoryInfosWithRewindedBlockReferencesAfter.length,
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

            await authorizedCaller.indexer.handleReorg({
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

        await authorizedCaller.indexer.handleReorg({
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
        authorizedCaller.indexer.handleReorg({
          rewindedBlocks: [],
          forwardedBlocks: [],
        })
      ).resolves.toBeUndefined();
    });

    it("should skip non-existent rewinded blocks", async () => {
      await expect(
        authorizedCaller.indexer.handleReorg({
          rewindedBlocks: [
            "0x992372cef5b4b0f1eee8589218fcd29908f6b19a76d23d0ad4e497479125aa85",
          ],
        })
      ).resolves.toBeUndefined();
    });

    unauthorizedRPCCallTest(() => nonAuthorizedCaller.indexer.handleReorg({}));
  });

  // describe("handleReorgedSlots", () => {
  //   describe("when authorized", () => {
  //     const input: HandleReorgedSlotsInput = {
  //       reorgedSlots: [106, 107, 108],
  //     };

  //     it("should mark the transactions contained in the blocks with a slot greater than the new head slot as reorged", async () => {
  //       const prevTransactionForks =
  //         await authorizedContext.prisma.transactionFork.findMany();
  //       const expectedTransactionForks = fixtures.txs
  //         .filter(({ blockHash }) => {
  //           const block = fixtures.blocks.find(
  //             ({ hash }) => hash === blockHash
  //           );

  //           return block?.slot && input.reorgedSlots.includes(block.slot);
  //         })
  //         .map(({ hash, blockHash }) => ({
  //           hash,
  //           blockHash,
  //         }));

  //       await authorizedCaller.indexer.handleReorgedSlots(input);

  //       const transactionForks = await authorizedContext.prisma.transactionFork
  //         .findMany()
  //         .then((txForks) =>
  //           txForks
  //             .map((txFork) => omitDBTimestampFields(txFork))
  //             .filter(
  //               (txFork) =>
  //                 !prevTransactionForks.find(
  //                   (prevTxFork) => prevTxFork.hash === txFork.hash
  //                 )
  //             )
  //         );

  //       expect(transactionForks).toEqual(expectedTransactionForks);
  //     });

  //     it("should clean up references to the reorged blocks", async () => {
  //       const reorgedBlocks = await authorizedContext.prisma.block.findMany({
  //         where: {
  //           slot: {
  //             in: input.reorgedSlots,
  //           },
  //         },
  //       });

  //       const reorgedBlockNumbers = reorgedBlocks.map((block) => block.number);

  //       await authorizedCaller.indexer.handleReorgedSlots(input);

  //       const reorgedBlocksAddressCategoryInfos =
  //         await authorizedContext.prisma.addressCategoryInfo.findMany({
  //           where: {
  //             OR: [
  //               {
  //                 firstBlockNumberAsSender: {
  //                   in: reorgedBlockNumbers,
  //                 },
  //               },
  //               {
  //                 firstBlockNumberAsReceiver: {
  //                   in: reorgedBlockNumbers,
  //                 },
  //               },
  //             ],
  //           },
  //         });
  //       const blobsWithReorgedBlocks =
  //         await authorizedContext.prisma.blob.findMany({
  //           where: {
  //             firstBlockNumber: {
  //               in: reorgedBlockNumbers,
  //             },
  //           },
  //         });

  //       expect(
  //         reorgedBlocksAddressCategoryInfos,
  //         "Reorged block references in address category records found"
  //       ).toEqual([]);
  //       expect(
  //         blobsWithReorgedBlocks,
  //         "Reorged block references in blob records found"
  //       ).toEqual([]);
  //     });

  //     it("should return the number of updated slots", async () => {
  //       const result = await authorizedCaller.indexer.handleReorgedSlots(input);

  //       expect(result).toEqual({
  //         totalUpdatedSlots: input.reorgedSlots.length,
  //       });
  //     });

  //     it("should ignore non-existent slots and mark the ones that exist as reorged", async () => {
  //       const reorgedSlots = [106, 107, 99999];
  //       const prevTransactionForks =
  //         await authorizedContext.prisma.transactionFork.findMany();
  //       const expectedTransactionForks = fixtures.txs
  //         .filter(({ blockHash }) => {
  //           const block = fixtures.blocks.find(
  //             ({ hash }) => hash === blockHash
  //           );

  //           return block?.slot && reorgedSlots.includes(block.slot);
  //         })
  //         .map(({ hash, blockHash }) => ({
  //           hash,
  //           blockHash,
  //         }));

  //       const result = await authorizedCaller.indexer.handleReorgedSlots({
  //         reorgedSlots: reorgedSlots as [number, ...number[]],
  //       });

  //       const transactionForks = await authorizedContext.prisma.transactionFork
  //         .findMany()
  //         .then((txForks) =>
  //           txForks
  //             .map((txFork) => omitDBTimestampFields(txFork))
  //             .filter(
  //               (txFork) =>
  //                 !prevTransactionForks.find(
  //                   (prevTxFork) => prevTxFork.hash === txFork.hash
  //                 )
  //             )
  //         );

  //       expect(transactionForks, "Fork transactions mismatch").toEqual(
  //         expectedTransactionForks
  //       );
  //       expect(
  //         result.totalUpdatedSlots,
  //         "Total updated slots mismatch"
  //       ).toEqual(2);
  //     });
  //   });

  //   it("should not mark any of the provided slots as reorged if all of them are non-existent", async () => {
  //     const reorgedSlots = [99999, 99998, 99997];
  //     const prevTransactionForks =
  //       await authorizedContext.prisma.transactionFork.findMany();

  //     const result = await authorizedCaller.indexer.handleReorgedSlots({
  //       reorgedSlots: reorgedSlots as [number, ...number[]],
  //     });

  //     const transactionForks = await authorizedContext.prisma.transactionFork
  //       .findMany()
  //       .then((txForks) =>
  //         txForks
  //           .map((txFork) => omitDBTimestampFields(txFork))
  //           .filter(
  //             (txFork) =>
  //               !prevTransactionForks.find(
  //                 (prevTxFork) => prevTxFork.hash === txFork.hash
  //               )
  //           )
  //       );

  //     expect(transactionForks, " Fork transactions mismatch").toEqual([]);
  //     expect(result.totalUpdatedSlots, "Total updated slots mismatch").toEqual(
  //       0
  //     );
  //   });

  //   unauthorizedRPCCallTest(() =>
  //     nonAuthorizedCaller.indexer.handleReorgedSlots({ reorgedSlots: [1000] })
  //   );
  // });
});
