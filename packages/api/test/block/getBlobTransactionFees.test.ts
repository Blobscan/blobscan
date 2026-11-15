import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createBlockCaller } from "./caller";

describe("getBlobTransactionFees", () => {
  let ctx: TRPCContext;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  async function prepare() {
    const block = await ctx.prisma.block.findFirstOrThrow({
      where: { transactions: { some: {} } },
      include: { transactions: true },
    });
    const blobGasUsed = block.transactions.reduce(
      (sum, tx) => sum + BigInt(tx.blobGasUsed.toFixed(0)),
      0n
    );
    await ctx.prisma.block.update({
      where: { hash: block.hash },
      data: {
        baseFeePerGas: "2",
        blobGasPrice: "1",
        blobGasUsed: blobGasUsed.toString(),
      },
    });
    await ctx.prisma.transaction.updateMany({
      where: { blockHash: block.hash },
      data: { gasUsed: "21000", effectiveGasPrice: "3" },
    });
    return { block, blobGasUsed };
  }

  it("sums only the blob transactions without counting priority fees twice", async () => {
    const { block, blobGasUsed } = await prepare();
    const count = BigInt(block.transactions.length);
    expect(
      await createBlockCaller(ctx).getBlobTransactionFees({ hash: block.hash })
    ).toEqual({
      totalFee: count * 63000n + blobGasUsed,
      executionBaseFee: count * 42000n,
      priorityFee: count * 21000n,
      blobFee: blobGasUsed,
    });
  });

  it("does not show a partial total when one receipt is missing", async () => {
    const { block } = await prepare();
    await ctx.prisma.transaction.update({
      where: { hash: block.transactions[0]!.hash },
      data: { gasUsed: null },
    });
    expect(
      (
        await createBlockCaller(ctx).getBlobTransactionFees({
          hash: block.hash,
        })
      ).totalFee
    ).toBeNull();
  });

  it("does not show a total when stored transactions do not cover the block", async () => {
    const { block, blobGasUsed } = await prepare();
    await ctx.prisma.block.update({
      where: { hash: block.hash },
      data: { blobGasUsed: (blobGasUsed + 131072n).toString() },
    });
    expect(
      (
        await createBlockCaller(ctx).getBlobTransactionFees({
          hash: block.hash,
        })
      ).totalFee
    ).toBeNull();
  });

  it("keeps zero execution fees distinct from missing fees", async () => {
    const { block, blobGasUsed } = await prepare();
    await ctx.prisma.block.update({
      where: { hash: block.hash },
      data: { baseFeePerGas: "0" },
    });
    await ctx.prisma.transaction.updateMany({
      where: { blockHash: block.hash },
      data: { effectiveGasPrice: "0" },
    });
    const fees = await createBlockCaller(ctx).getBlobTransactionFees({
      hash: block.hash,
    });
    expect(fees.totalFee).toBe(blobGasUsed);
    expect(fees.executionBaseFee).toBe(0n);
    expect(fees.priorityFee).toBe(0n);
  });
});
