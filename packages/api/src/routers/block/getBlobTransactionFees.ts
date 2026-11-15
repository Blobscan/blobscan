import { TRPCError } from "@trpc/server";

import { calculateTransactionFees } from "@blobscan/db";
import { blockHashSchema } from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

export const getBlobTransactionFees = publicProcedure
  .input(z.object({ hash: blockHashSchema }))
  .query(async ({ ctx: { prisma }, input: { hash } }) => {
    const block = await prisma.block.findUnique({
      where: { hash },
      select: {
        baseFeePerGas: true,
        blobGasPrice: true,
        blobGasUsed: true,
        transactions: {
          select: { gasUsed: true, effectiveGasPrice: true, blobGasUsed: true },
        },
      },
    });
    if (!block)
      throw new TRPCError({ code: "NOT_FOUND", message: "Block not found" });

    const unavailable = {
      totalFee: null,
      executionBaseFee: null,
      priorityFee: null,
      blobFee: null,
    };
    const storedBlobGas = block.transactions.reduce(
      (total, tx) => total + BigInt(tx.blobGasUsed.toFixed(0)),
      0n
    );
    if (storedBlobGas !== BigInt(block.blobGasUsed.toFixed(0)))
      return unavailable;

    let executionBaseFee = 0n;
    let priorityFee = 0n;
    let totalFee = 0n;
    for (const tx of block.transactions) {
      const fees = calculateTransactionFees({
        ...tx,
        baseFeePerGas: block.baseFeePerGas,
        blobGasPrice: block.blobGasPrice,
      });
      if (
        fees.totalFee == null ||
        fees.executionBaseFee == null ||
        fees.priorityFee == null
      ) {
        return unavailable;
      }
      totalFee += BigInt(fees.totalFee);
      executionBaseFee += BigInt(fees.executionBaseFee);
      priorityFee += BigInt(fees.priorityFee);
    }
    return {
      totalFee,
      executionBaseFee,
      priorityFee,
      blobFee: storedBlobGas * BigInt(block.blobGasPrice.toFixed(0)),
    };
  });
