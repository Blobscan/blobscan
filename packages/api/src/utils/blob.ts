import { sha256 } from "viem";

import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { serializeDecimal } from "./serializers";

export type TransactionFeeFields = {
  blobAsCalldataGasFee: Prisma.Decimal;
  blobGasBaseFee: Prisma.Decimal;
  blobGasMaxFee: Prisma.Decimal;
};

export function calculateTxFeeFields({
  blobGasUsed,
  blobAsCalldataGasUsed,
  blobGasPrice,
  gasPrice,
  maxFeePerBlobGas,
}: {
  blobGasUsed: Prisma.Decimal;
  blobAsCalldataGasUsed: Prisma.Decimal;
  blobGasPrice: Prisma.Decimal;
  gasPrice: Prisma.Decimal;
  maxFeePerBlobGas: Prisma.Decimal;
}): TransactionFeeFields {
  const blobGasMaxFee = maxFeePerBlobGas.mul(blobGasUsed);
  const blobAsCalldataGasFee = gasPrice.mul(blobAsCalldataGasUsed);
  const blobGasBaseFee = blobGasPrice.mul(blobGasUsed);

  return {
    blobAsCalldataGasFee,
    blobGasBaseFee,
    blobGasMaxFee,
  };
}

export const serializedTxFeeFieldsSchema = z.object({
  blobAsCalldataGasFee: z.string(),
  blobGasBaseFee: z.string().optional(),
  blobGasMaxFee: z.string(),
});

export type SerializedTxFeeFields = z.infer<typeof serializedTxFeeFieldsSchema>;

export function serializeTxFeeFields({
  blobAsCalldataGasFee,
  blobGasBaseFee,
  blobGasMaxFee,
}: TransactionFeeFields): SerializedTxFeeFields {
  const serializedFields: SerializedTxFeeFields = {
    blobAsCalldataGasFee: serializeDecimal(blobAsCalldataGasFee),
    blobGasMaxFee: serializeDecimal(blobGasMaxFee),
  };

  if (blobGasBaseFee) {
    serializedFields.blobGasBaseFee = serializeDecimal(blobGasBaseFee);
  }

  return serializedFields;
}

export function buildVersionedHash(commitment: string) {
  const hashedCommitment = sha256(commitment as `0x${string}`);

  return `0x01${hashedCommitment.slice(4)}`;
}
