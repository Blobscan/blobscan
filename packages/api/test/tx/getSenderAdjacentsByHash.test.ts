import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { TxCaller } from "./caller";
import { createTransactionCaller } from "./caller";

describe("getSenderAdjacentsByHash", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  describe("when the transaction is between two transactions of the sender", () => {
    it("should return the previous and next transactions of the sender", async () => {
      const result = await txCaller.getSenderAdjacentsByHash({
        hash: "txHash012",
      });

      expect(result).toEqual({
        prevTxHash: "txHash007",
        nextTxHash: "txHash015",
      });
    });
  });

  describe("when the transaction is the first transaction of the sender", () => {
    it("should not return a previous transaction", async () => {
      const result = await txCaller.getSenderAdjacentsByHash({
        hash: "txHash003",
      });

      expect(result).toEqual({
        prevTxHash: undefined,
        nextTxHash: "txHash007",
      });
    });
  });

  describe("when the transaction is the last transaction of the sender", () => {
    it("should not return a next transaction", async () => {
      const result = await txCaller.getSenderAdjacentsByHash({
        hash: "txHash016",
      });

      expect(result).toEqual({
        prevTxHash: "txHash006",
        nextTxHash: undefined,
      });
    });
  });

  describe("when transactions of the sender have the same block timestamp", () => {
    it("should order them by their index", async () => {
      const first = await txCaller.getSenderAdjacentsByHash({
        hash: "txHash005",
      });
      const second = await txCaller.getSenderAdjacentsByHash({
        hash: "txHash006",
      });

      expect(first).toEqual({
        prevTxHash: undefined,
        nextTxHash: "txHash006",
      });
      expect(second).toEqual({
        prevTxHash: "txHash005",
        nextTxHash: "txHash016",
      });
    });
  });

  describe("when the next transaction of the sender is in a reorged block", () => {
    it("should ignore the reorged transaction", async () => {
      const result = await txCaller.getSenderAdjacentsByHash({
        hash: "txHash015",
      });

      expect(result).toEqual({
        prevTxHash: "txHash012",
        nextTxHash: undefined,
      });
    });
  });

  describe("when the transaction does not exist", () => {
    it("should throw a not found error", async () => {
      await expect(
        txCaller.getSenderAdjacentsByHash({
          hash: "unknownTxHash",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "No transaction with hash 'unknownTxHash'.",
      });
    });
  });
});
