import type { EthUsdPrice, Prisma } from "@blobscan/db";
import type { Rollup } from "@blobscan/db/prisma/enums";
import { Category } from "@blobscan/db/prisma/enums";
import type { optimismDecodedFieldsSchema } from "@blobscan/db/prisma/zod-utils";
import type { z } from "@blobscan/zod";

import type { PrismaBlobDataStorageReference } from "../routers/blob/helpers";
import type {
  BlockDerivedFields,
  PrismaTransaction,
  TransactionDerivedFields,
} from "../zod-schemas";
import { hasProperties } from "./identifiers";
import { ONE_ETH_IN_WEI } from "./web3";

export function deriveBlockFields({
  ethUsdPrice,
  blobGasUsed,
  blobGasPrice,
}: {
  ethUsdPrice?: EthUsdPrice;
  blobGasUsed: Prisma.Decimal;
  blobGasPrice: Prisma.Decimal;
}): BlockDerivedFields {
  const price = ethUsdPrice?.price;
  const weiUsdPrice = price?.mul(ONE_ETH_IN_WEI);
  const blobBaseFee = blobGasUsed.mul(blobGasPrice);
  const blobGasUsdPrice = weiUsdPrice?.mul(blobGasPrice);
  const blobBaseUsdFee = blobGasUsdPrice?.mul(blobBaseFee);

  return {
    blobBaseFee,
    blobBaseUsdFee: blobBaseUsdFee?.toFixed(),
    blobGasUsdPrice: blobGasUsdPrice?.toFixed(),
  };
}

export function deriveTransactionFields({
  blobGasPrice,
  blobGasUsed,
  blobAsCalldataGasUsed,
  maxFeePerBlobGas,
  gasPrice,
  from,
  ethUsdPrice,
}: Pick<
  PrismaTransaction,
  | "gasPrice"
  | "blobGasUsed"
  | "blobAsCalldataGasUsed"
  | "maxFeePerBlobGas"
  | "from"
> & { blobGasPrice: Prisma.Decimal; ethUsdPrice?: EthUsdPrice }): {
  category: Category;
  rollup?: Rollup | null;
  blobGasPrice: Prisma.Decimal;
} & TransactionDerivedFields {
  const usdWeiPrice = ethUsdPrice?.price.mul(ONE_ETH_IN_WEI);

  const blobGasUsdPrice = usdWeiPrice?.mul(blobGasPrice);
  const blobAsCalldataGasFee = gasPrice.mul(blobAsCalldataGasUsed);
  const blobGasBaseFee = blobGasPrice.mul(blobGasUsed);
  const blobGasMaxFee = maxFeePerBlobGas.mul(blobGasUsed);
  const blobAsCalldataGasUsdFee = usdWeiPrice?.mul(blobAsCalldataGasFee);
  const blobGasBaseUsdFee = usdWeiPrice?.mul(blobGasBaseFee);
  const blobGasMaxUsdFee = usdWeiPrice?.mul(blobGasMaxFee);

  return {
    category: from.rollup ? Category.ROLLUP : Category.OTHER,
    rollup: from.rollup,
    blobGasBaseFee,
    blobGasBaseUsdFee: blobGasBaseUsdFee?.toFixed(),
    blobAsCalldataGasFee: gasPrice.mul(blobAsCalldataGasUsed),
    blobAsCalldataGasUsdFee: blobAsCalldataGasUsdFee?.toFixed(),
    blobGasMaxFee,
    blobGasMaxUsdFee: blobGasMaxUsdFee?.toFixed(),
    blobGasPrice,
    blobGasUsdPrice: blobGasUsdPrice?.toFixed(),
  };
}

export function normalizePrismaTransactionFields({
  fromId,
  toId,
  decodedFields,
}: Pick<PrismaTransaction, "fromId" | "toId" | "decodedFields">) {
  return {
    from: fromId,
    to: toId,
    decodedFields:
      decodedFields && hasProperties(decodedFields)
        ? (decodedFields as z.output<typeof optimismDecodedFieldsSchema>)
        : null,
  };
}

export function normalizeDataStorageReferences(
  dataStorageReferences: PrismaBlobDataStorageReference[]
) {
  return dataStorageReferences.map(({ blobStorage, ...rest }) => ({
    storage: blobStorage,
    ...rest,
  }));
}
