import type { Block, EthUsdPrice } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { z } from "@blobscan/zod";

import { Category } from "../enums";
import { decimalSchema } from "../zod-utils";

const ONE_ETH_IN_WEI = new Prisma.Decimal(1e-18);

export type BlobUrlFieldParams = {
  gcs?: Partial<{
    apiBaseUrl: string;
    bucketName: string;
  }>;
  s3: Partial<{
    apiBaseUrl: string;
    bucketName: string;
  }>;
  loadNetwork: Partial<{
    apiBaseUrl: string;
  }>;
  postgres: Partial<{
    apiBaseUrl: string;
  }>;
  sftp: Partial<{
    apiBaseUrl: string;
  }>;
};

export type ExtensionConfig = {
  blobUrlField?: Partial<BlobUrlFieldParams>;
};

function calculateWeiUsdPrice(ethUsdPrice: EthUsdPrice["price"]) {
  return ethUsdPrice.mul(ONE_ETH_IN_WEI);
}

export const transactionComputedFeeFieldsSchema = z.object({
  blobAsCalldataGasFee: decimalSchema,
  blobGasBaseFee: decimalSchema,
  blobGasMaxFee: decimalSchema,
});

export const transactionAllComputedUsdFieldsSchema = z.object({
  blobAsCalldataGasUsdFee: z.string(),
  blobGasBaseUsdFee: z.string(),
  blobGasMaxUsdFee: z.string(),
  blobGasUsdPrice: z.string(),
});

export const transactionAllComputedFieldsSchema =
  transactionComputedFeeFieldsSchema.merge(
    transactionAllComputedUsdFieldsSchema.partial()
  );

export type TransactionComputedFeeFields = z.output<
  typeof transactionComputedFeeFieldsSchema
>;
export type TransactionAllComputedUsdFields = z.output<
  typeof transactionAllComputedUsdFieldsSchema
>;
export type TransactionAllComputedFields = z.output<
  typeof transactionAllComputedFieldsSchema
>;

export const blockComputedBlobGasBaseFeeSchema = decimalSchema;

export const blockComputedUsdFieldsSchema = z.object({
  blobGasBaseUsdFee: z.string(),
  blobGasUsdPrice: z.string(),
});

export const blockAllComputedFieldsSchema = blockComputedUsdFieldsSchema
  .partial()
  .extend({
    blobGasBaseFee: blockComputedBlobGasBaseFeeSchema,
  });

export type BlockComputedBlobGasBaseFee = z.output<
  typeof blockComputedBlobGasBaseFeeSchema
>;
export type BlockComputedUsdFields = z.output<
  typeof blockComputedUsdFieldsSchema
>;
export type BlockAllComputedFields = z.output<
  typeof blockAllComputedFieldsSchema
>;

export const createComputedFieldsExtension = ({
  blobUrlField,
}: ExtensionConfig = {}) => {
  const { gcs, loadNetwork, postgres, s3, sftp } =
    blobUrlField ?? ({} as BlobUrlFieldParams);
  return Prisma.defineExtension((prisma) =>
    prisma
      .$extends({
        name: "Computed Fields",
        result: {
          address: {
            category: {
              needs: {
                rollup: true,
              },
              compute({ rollup }) {
                return rollup ? Category.ROLLUP : Category.OTHER;
              },
            },
          },
          blobDataStorageReference: {
            url: {
              needs: {
                blobStorage: true,
                dataReference: true,
              },
              compute({ blobStorage, dataReference }) {
                switch (blobStorage) {
                  case "GOOGLE": {
                    if (!gcs?.bucketName) {
                      throw new Error(
                        "Couldn't compute gcs blob data url field: bucket name not provided"
                      );
                    }
                    return process.env.MODE === "test"
                      ? `${
                          gcs.apiBaseUrl ?? "http://localhost:4443"
                        }/storage/v1/b/${gcs.bucketName}/o/${encodeURIComponent(
                          dataReference
                        )}?alt=media`
                      : `https://storage.googleapis.com/${gcs.bucketName}/${dataReference}`;
                  }
                  case "POSTGRES": {
                    if (!postgres?.apiBaseUrl) {
                      throw new Error(
                        "Couldn't compute postgres blob data url field: api base url not provided"
                      );
                    }

                    return `${postgres.apiBaseUrl}/blobs/${dataReference}/data`;
                  }
                  case "SWARMYCLOUD":
                  case "SWARM":
                    return `https://api.gateway.ethswarm.org/bzz/${dataReference}`;
                  case "WEAVEVM": {
                    if (!loadNetwork?.apiBaseUrl) {
                      throw new Error(
                        "Couldn't compute load network blob data url field: api base url not provided"
                      );
                    }
                    return `${loadNetwork.apiBaseUrl}/v1/blob/${dataReference}`;
                  }
                  case "S3": {
                    if (!s3?.apiBaseUrl || !s3.bucketName) {
                      throw new Error(
                        "Couldn't compute load network blob data url field: api base url or bucket name not provided"
                      );
                    }
                    return `${s3.apiBaseUrl}/${s3.bucketName}/${dataReference}`;
                  }
                  case "SFTP": {
                    if (!sftp?.apiBaseUrl) {
                      throw new Error(
                        "Couldn't compute sftp blob data url field: api base url not provided"
                      );
                    }

                    return `${sftp.apiBaseUrl}/blobs/${dataReference}/data`;
                  }
                }
              },
            },
          },
          block: {
            blobGasBaseFee: {
              needs: {
                blobGasPrice: true,
                blobGasUsed: true,
              },
              compute({ blobGasPrice, blobGasUsed }) {
                return blobGasUsed.mul(blobGasPrice);
              },
            },
          },
          ethUsdPrice: {
            weiUsdPrice: {
              needs: {
                price: true,
              },
              compute({ price }) {
                return calculateWeiUsdPrice(price);
              },
            },
          },
          transaction: {
            blobAsCalldataGasFee: {
              needs: {
                gasPrice: true,
                blobAsCalldataGasUsed: true,
              },
              compute({ blobAsCalldataGasUsed, gasPrice }) {
                return blobAsCalldataGasUsed.mul(gasPrice);
              },
            },
            blobGasMaxFee: {
              needs: {
                blobGasUsed: true,
                maxFeePerBlobGas: true,
              },
              compute({ blobGasUsed, maxFeePerBlobGas }) {
                return blobGasUsed.mul(maxFeePerBlobGas);
              },
            },
            computeBlobGasBaseFee: {
              needs: {
                blobGasUsed: true,
              },
              compute({ blobGasUsed }) {
                return (blobGasPrice: Block["blobGasPrice"]) => {
                  return blobGasPrice.mul(blobGasUsed);
                };
              },
            },
          },
        },
      })
      .$extends({
        result: {
          block: {
            computeUsdFields: {
              needs: {
                blobGasPrice: true,
                blobGasBaseFee: true,
              },

              compute({ blobGasPrice, blobGasBaseFee }) {
                return (ethUsdPrice: EthUsdPrice["price"]) => {
                  const weiUsdPrice = calculateWeiUsdPrice(ethUsdPrice);
                  const blobGasUsdPrice = weiUsdPrice.mul(blobGasPrice);
                  const blobGasBaseUsdFee = blobGasUsdPrice
                    .mul(blobGasBaseFee)
                    .toFixed();

                  return {
                    blobGasBaseUsdFee,
                    blobGasUsdPrice: blobGasUsdPrice.toFixed(),
                  };
                };
              },
            },
          },
          transaction: {
            computeUsdFields: {
              needs: {
                blobAsCalldataGasFee: true,
                computeBlobGasBaseFee: true,
                blobGasMaxFee: true,
              },
              compute({
                blobAsCalldataGasFee,
                computeBlobGasBaseFee,
                blobGasMaxFee,
              }) {
                return ({
                  ethUsdPrice,
                  blobGasPrice,
                }: {
                  ethUsdPrice: EthUsdPrice["price"];
                  blobGasPrice: Block["blobGasPrice"];
                }) => {
                  const usdWeiPrice = calculateWeiUsdPrice(ethUsdPrice);

                  const blobAsCalldataGasUsdFee = usdWeiPrice
                    .mul(blobAsCalldataGasFee)
                    .toFixed();
                  const blobGasBaseUsdFee = usdWeiPrice
                    .mul(computeBlobGasBaseFee(blobGasPrice))
                    .toFixed();
                  const blobGasMaxUsdFee = usdWeiPrice
                    .mul(blobGasMaxFee)
                    .toFixed();
                  const blobGasUsdPrice = usdWeiPrice
                    .mul(blobGasPrice)
                    .toFixed();

                  return {
                    blobAsCalldataGasUsdFee,
                    blobGasBaseUsdFee,
                    blobGasMaxUsdFee,
                    blobGasUsdPrice,
                  };
                };
              },
            },
          },
        },
      })
  );
};
