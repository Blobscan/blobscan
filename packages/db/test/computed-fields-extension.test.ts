import { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, test } from "vitest";

import { assertError, env } from "@blobscan/test";

import { getPrisma } from "../prisma";
import type { BlobStorage } from "../prisma/enums";
import { createComputedFieldsExtension } from "../prisma/extensions";

const ONE_ETH_IN_WEI = new Prisma.Decimal(1e-18);

describe("Computed Fields Extension", () => {
  const ethUsdPrice = new Prisma.Decimal("110000000");
  const weiUsdPrice = ethUsdPrice.mul(ONE_ETH_IN_WEI);

  const prisma = getPrisma({
    customFieldExtension: {
      blobUrlField: {
        gcs: {
          apiBaseUrl: env.GOOGLE_STORAGE_API_ENDPOINT,
          bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
        },
        loadNetwork: {
          apiBaseUrl: "",
        },
        postgres: {
          apiBaseUrl: env.BLOBSCAN_API_BASE_URL,
        },
        s3: {
          apiBaseUrl: env.S3_STORAGE_ENDPOINT,
          bucketName: env.S3_STORAGE_BUCKET_NAME,
        },
      },
    },
  });

  describe("Address model", () => {
    describe("category", () => {
      it("should be 'OTHER' when the address is not a rollup", async () => {
        const nonRollupAddress = await prisma.address.findFirstOrThrow({
          where: {
            rollup: {
              equals: null,
            },
          },
        });

        expect(nonRollupAddress.category).toBe("OTHER");
      });

      it("should be 'ROLLUP' when the address is a rollup", async () => {
        const rollupAddress = await prisma.address.findFirstOrThrow({
          where: {
            rollup: {
              not: null,
            },
          },
        });

        expect(rollupAddress.category).toBe("ROLLUP");
      });
    });
  });

  describe("Blob Data Storage Reference Model", () => {
    const prismaWithoutParams = new PrismaClient().$extends(
      createComputedFieldsExtension()
    );

    describe("url", () => {
      it("should return the correct gcs url", async () => {
        const { dataReference, url } =
          await prisma.blobDataStorageReference.findFirstOrThrow({
            where: {
              blobStorage: "GOOGLE",
            },
          });

        expect(url).toBe(
          `${env.GOOGLE_STORAGE_API_ENDPOINT}/storage/v1/b/${
            env.GOOGLE_STORAGE_BUCKET_NAME
          }/o/${encodeURIComponent(dataReference)}?alt=media`
        );
      });

      it("should return the correct postgres url", async () => {
        const { dataReference, url } =
          await prisma.blobDataStorageReference.findFirstOrThrow({
            where: {
              blobStorage: "POSTGRES",
            },
          });

        expect(url).toBe(
          `${env.BLOBSCAN_API_BASE_URL}/blobs/${dataReference}/data`
        );
      });

      it("should return the correct swarm url", async () => {
        const { dataReference, url } =
          await prisma.blobDataStorageReference.findFirstOrThrow({
            where: {
              blobStorage: "SWARM",
            },
          });

        expect(url).toBe(
          `https://api.gateway.ethswarm.org/bzz/${dataReference}`
        );
      });

      it("should return the correct s3 url", async () => {
        const { dataReference, url } =
          await prisma.blobDataStorageReference.findFirstOrThrow({
            where: {
              blobStorage: "S3",
            },
          });

        expect(url).toBe(
          `${env.S3_STORAGE_ENDPOINT}/${env.S3_STORAGE_BUCKET_NAME}/${dataReference}`
        );
      });

      test.each<[BlobStorage, string]>([
        ["GOOGLE", "bucket name"],
        ["POSTGRES", "api base url"],
        ["S3", "api base url or bucket name"],
        ["WEAVEVM", "api base url"],
      ])(
        "should fail when returning a %s url without a configured %s",
        async (storage, _) => {
          await assertError(async () => {
            const ref =
              await prismaWithoutParams.blobDataStorageReference.findFirstOrThrow(
                {
                  where: {
                    blobStorage: storage,
                  },
                }
              );

            return ref.url;
          }, Error);
        }
      );
    });
  });

  describe("Block Model", () => {
    it("blobGasBaseFee", async () => {
      const block = await prisma.block.findFirstOrThrow();

      const expectedBlobGasBaseFee = block.blobGasUsed.mul(block.blobGasPrice);

      expect(block.blobGasBaseFee).toEqual(expectedBlobGasBaseFee);
    });

    it("computeUsdFields()", async () => {
      const block = await prisma.block.findFirstOrThrow();

      const usdFields = block.computeUsdFields(ethUsdPrice);

      const expectedUsdFields = {
        blobGasBaseUsdFee: weiUsdPrice
          .mul(block.blobGasPrice)
          .mul(block.blobGasBaseFee)
          .toFixed(),
        blobGasUsdPrice: weiUsdPrice.mul(block.blobGasPrice).toFixed(),
      };

      expect(usdFields).toEqual(expectedUsdFields);
    });
  });

  describe("EthUsdPrice Model", () => {
    beforeEach(async () => {
      await prisma.ethUsdPrice.create({
        data: {
          price: new Prisma.Decimal("110000000"),
          timestamp: new Date(),
        },
      });

      return async () => {
        await prisma.ethUsdPrice.deleteMany();
      };
    });

    it("weiUsdPrice", async () => {
      const ethUsdPrice = await prisma.ethUsdPrice.findFirstOrThrow();
      const expectedWeiUsdPrice = ethUsdPrice.price.mul(ONE_ETH_IN_WEI);

      expect(ethUsdPrice.weiUsdPrice).toEqual(expectedWeiUsdPrice);
    });
  });

  describe("Transaction Model", () => {
    it("blobAsCalldataGasFee", async () => {
      const tx = await prisma.transaction.findFirstOrThrow();

      const expectedBlobAsCalldataGasFee = tx.blobAsCalldataGasUsed.mul(
        tx.gasPrice
      );

      expect(tx.blobAsCalldataGasFee).toEqual(expectedBlobAsCalldataGasFee);
    });

    it("blobGasMaxFee", async () => {
      const tx = await prisma.transaction.findFirstOrThrow();

      const expectedBlobGasMaxFee = tx.blobGasUsed.mul(tx.maxFeePerBlobGas);

      expect(tx.blobGasMaxFee).toEqual(expectedBlobGasMaxFee);
    });

    it("computeBlobGasBaseFee()", async () => {
      const tx = await prisma.transaction.findFirstOrThrow();
      const txBlock = await prisma.block.findFirstOrThrow({
        where: {
          hash: tx.blockHash,
        },
      });
      const blobGasBaseFee = tx.computeBlobGasBaseFee(txBlock.blobGasPrice);
      const expectedBlobGasBaseFee = txBlock.blobGasPrice.mul(tx.blobGasUsed);

      expect(blobGasBaseFee, "Invalid blobGasBaseFee").toEqual(
        expectedBlobGasBaseFee
      );
    });
  });

  it("computeUsdFields()", async () => {
    const tx = await prisma.transaction.findFirstOrThrow();
    const txBlock = await prisma.block.findFirstOrThrow({
      where: {
        hash: tx.blockHash,
      },
    });

    const usdFields = tx.computeUsdFields({
      ethUsdPrice,
      blobGasPrice: txBlock.blobGasPrice,
    });

    const expectedUsdFields = {
      blobAsCalldataGasUsdFee: weiUsdPrice
        .mul(tx.blobAsCalldataGasFee)
        .toFixed(),
      blobGasBaseUsdFee: weiUsdPrice
        .mul(tx.computeBlobGasBaseFee(txBlock.blobGasPrice))
        .toFixed(),
      blobGasMaxUsdFee: weiUsdPrice.mul(tx.blobGasMaxFee).toFixed(),
      blobGasUsdPrice: weiUsdPrice.mul(txBlock.blobGasPrice).toFixed(),
    };

    expect(usdFields).toEqual(expectedUsdFields);
  });
});
