import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createBlockCaller } from "./caller";

describe("block transaction receipt expansion", () => {
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

  it("returns receipt fields with expanded transactions", async () => {
    const { block } = await prepare();
    const result = await createBlockCaller(ctx).getByBlockId({
      id: block.hash,
      expand: "transaction",
    });
    expect(result.transactions).toHaveLength(block.transactions.length);
    for (const tx of result.transactions) {
      expect(tx.gasUsed).toBe(21000n);
      expect(tx.effectiveGasPrice).toBe(3n);
    }
  });

  it("preserves missing receipt values in expanded transactions", async () => {
    const { block } = await prepare();
    await ctx.prisma.transaction.updateMany({
      where: { blockHash: block.hash },
      data: { gasUsed: null, effectiveGasPrice: null },
    });
    const result = await createBlockCaller(ctx).getByBlockId({
      id: block.hash,
      expand: "transaction",
    });
    for (const tx of result.transactions) {
      expect(tx.gasUsed).toBeNull();
      expect(tx.effectiveGasPrice).toBeNull();
    }
  });
});
