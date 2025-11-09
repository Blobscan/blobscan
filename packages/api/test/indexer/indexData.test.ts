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
import { ADDRESS_TO_ROLLUP_MAPPINGS } from "@blobscan/rollups";
import { env, omitDBTimestampFields, testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { calculateBlobGasPrice } from "../../src/routers/indexer/indexData.utils";
import { createTestContext } from "../helpers";
import { createIndexerCaller } from "./caller";
import type { IndexerCaller } from "./caller";
import {
  INPUT,
  INPUT_WITH_DUPLICATED_BLOBS,
  ROLLUP_BLOB_TRANSACTION_INPUT,
} from "./fixtures";

describe("indexData", () => {
  let nonAuthorizedCaller: IndexerCaller;
  let authorizedCaller: IndexerCaller;
  let noPropagatorCaller: IndexerCaller;
  let authorizedCtx: TRPCContext;

  beforeAll(async () => {
    const ctx = await createTestContext({
      withBlobPropagator: true,
    });

    authorizedCtx = await createTestContext({
      apiClient: "indexer",
      withBlobPropagator: true,
    });

    nonAuthorizedCaller = createIndexerCaller(ctx);
    authorizedCaller = createIndexerCaller(authorizedCtx);
    noPropagatorCaller = createIndexerCaller(
      await createTestContext({
        apiClient: "indexer",
        withBlobPropagator: false,
      })
    );
  });

  afterAll(async () => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("when authorized", () => {
    beforeEach(async () => {
      await authorizedCaller.indexData(INPUT);
    });

    it("should index a block correctly", async () => {
      const indexedBlock = await authorizedCtx.prisma.block
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
      const fork = authorizedCtx.chain.forks[0].blobParams;
      const expectedBlobGasPrice = calculateBlobGasPrice(
        BigInt(INPUT.block.excessBlobGas),
        fork
      );

      // TODO: Fix this test
      // expect(blobAsCalldataGasUsed).toBe(expectedBlobAsCalldataGasUsed);
      expect(blobGasPrice?.toString(), "Blob gas price mismatch").toBe(
        expectedBlobGasPrice.toString()
      );
      expect(remainingParams).toMatchInlineSnapshot(`
          {
            "blobGasBaseFee": "10000",
            "blobGasUsed": "10000",
            "computeUsdFields": [Function],
            "excessBlobGas": "5000",
            "hash": "blockHash2010",
            "number": 2010,
            "slot": 130,
            "timestamp": 2023-09-01T13:50:21.000Z,
            Symbol(nodejs.util.inspect.custom): [Function],
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
        const indexedTxs = await authorizedCtx.prisma.transaction
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
          ({
            blobAsCalldataGasUsed: _,
            computeBlobGasBaseFee: __,
            computeUsdFields: ___,
            blobAsCalldataGasFee: ____,
            blobGasMaxFee: _____,
            ...remainingParams
          }) => remainingParams
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
                Symbol(nodejs.util.inspect.custom): [Function],
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
                Symbol(nodejs.util.inspect.custom): [Function],
              },
            ]
          `);
      });

      it("should identify rollup transactions correctly", async () => {
        await authorizedCaller.indexData(ROLLUP_BLOB_TRANSACTION_INPUT);

        const indexedTxHashesAndRollups = await authorizedCtx.prisma.transaction
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
        await authorizedCaller.indexData(ROLLUP_BLOB_TRANSACTION_INPUT);

        const indexedTxHashesAndCategories =
          await authorizedCtx.prisma.transaction
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
          await authorizedCtx.prisma.transaction
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

        const dbBlobSizes = await authorizedCtx.prisma.blob.findMany({
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

        const dbBlobUsageSizes = await authorizedCtx.prisma.blob.findMany({
          select: {
            versionedHash: true,
            usageSize: true,
          },
          where: {
            versionedHash: {
              in: expectedBlobUsageSizes.map((b) => b.versionedHash),
            },
          },
        });

        expect(dbBlobUsageSizes).toEqual(expectedBlobUsageSizes);
      });

      it("should index them correctly", async () => {
        const txHashes = INPUT.transactions.map((tx) => tx.hash);
        const indexedBlobs = (
          await authorizedCtx.prisma.blobsOnTransactions.findMany({
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
        let ctxWithBlobPropagator: TRPCContext;
        let callerWithBlobPropagator: IndexerCaller;
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
            apiClient: "indexer",
            withBlobPropagator: true,
          });

          callerWithBlobPropagator = createIndexerCaller(ctxWithBlobPropagator);

          blobPropagatorSpy = vi.spyOn(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ctxWithBlobPropagator.blobPropagator!,
            "propagateBlobs"
          );
        });

        it("should call blob propagator", async () => {
          const expectedInput = INPUT_WITH_DUPLICATED_BLOBS.blobs.map((b) => ({
            ...b,
            blockNumber: INPUT_WITH_DUPLICATED_BLOBS.block.number,
          }));

          await callerWithBlobPropagator.indexData(INPUT_WITH_DUPLICATED_BLOBS);

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
        await authorizedCtx.prisma.blobsOnTransactions.findMany({
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
      const indexedAddresses = await authorizedCtx.prisma.address.findMany({
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
      await expect(authorizedCaller.indexData(INPUT)).resolves.toBeUndefined();
    });

    testValidError(
      "should fail when no blob propagator is defined",
      async () => {
        await noPropagatorCaller.indexData(INPUT);
      },
      TRPCError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should fail when receiving an empty array of transactions",
      async () => {
        await authorizedCaller.indexData({
          ...INPUT,
          transactions: [] as unknown as typeof INPUT.transactions,
        });
      },
      TRPCError
    );

    testValidError(
      "should fail when receiving an empty array of blobs",
      async () => {
        await authorizedCaller.indexData({
          ...INPUT,
          blobs: [] as unknown as typeof INPUT.blobs,
        });
      },
      TRPCError
    );
  });

  testValidError(
    "should fail when calling procedure without auth",
    async () => {
      await nonAuthorizedCaller.indexData(INPUT);
    },
    TRPCError
  );
});
