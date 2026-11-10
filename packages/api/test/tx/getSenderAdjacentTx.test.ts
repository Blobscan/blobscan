import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import type { AdjacentDirection } from "../../src/utils";
import { createTestContext } from "../helpers";
import type { TxCaller } from "./caller";
import { createTransactionCaller } from "./caller";

describe("getSenderAdjacentTx", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  async function getAdjacentHash(hash: string, direction: AdjacentDirection) {
    const result = await txCaller.getSenderAdjacentTx({ hash, direction });

    return result?.hash ?? null;
  }

  describe("when the transaction is between two transactions of the sender", () => {
    it("should return the previous and next transactions of the sender", async () => {
      await expect(getAdjacentHash("txHash012", "prev")).resolves.toBe(
        "txHash007"
      );
      await expect(getAdjacentHash("txHash012", "next")).resolves.toBe(
        "txHash015"
      );
    });
  });

  describe("when the transaction is the first transaction of the sender", () => {
    it("should return null for the previous transaction", async () => {
      await expect(getAdjacentHash("txHash003", "prev")).resolves.toBeNull();
    });

    it("should return the next transaction of the sender", async () => {
      await expect(getAdjacentHash("txHash003", "next")).resolves.toBe(
        "txHash007"
      );
    });
  });

  describe("when the transaction is the last transaction of the sender", () => {
    it("should return the previous transaction of the sender", async () => {
      await expect(getAdjacentHash("txHash016", "prev")).resolves.toBe(
        "txHash006"
      );
    });

    it("should return null for the next transaction", async () => {
      await expect(getAdjacentHash("txHash016", "next")).resolves.toBeNull();
    });
  });

  describe("when transactions of the sender have the same block timestamp", () => {
    it("should order them by their index", async () => {
      await expect(getAdjacentHash("txHash005", "prev")).resolves.toBeNull();
      await expect(getAdjacentHash("txHash005", "next")).resolves.toBe(
        "txHash006"
      );
      await expect(getAdjacentHash("txHash006", "prev")).resolves.toBe(
        "txHash005"
      );
      await expect(getAdjacentHash("txHash006", "next")).resolves.toBe(
        "txHash016"
      );
    });
  });

  describe("when the next transaction of the sender is in a reorged block", () => {
    it("should ignore the reorged transaction", async () => {
      await expect(getAdjacentHash("txHash015", "prev")).resolves.toBe(
        "txHash012"
      );
      await expect(getAdjacentHash("txHash015", "next")).resolves.toBeNull();
    });
  });

  describe("when an expand is given", () => {
    it("should return the transaction in the format of getByHash", async () => {
      const expand = "block,blob";
      const adjacentTx = await txCaller.getSenderAdjacentTx({
        hash: "txHash012",
        direction: "next",
        expand,
      });
      const tx = await txCaller.getByHash({ hash: "txHash015", expand });

      expect(adjacentTx).toEqual(tx);
    });
  });

  describe("when the transaction does not exist", () => {
    it("should throw a not found error", async () => {
      await expect(
        txCaller.getSenderAdjacentTx({
          hash: "unknownTxHash",
          direction: "next",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "No transaction with hash 'unknownTxHash'.",
      });
    });
  });
});
