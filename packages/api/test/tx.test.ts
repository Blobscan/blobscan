import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import type { AppRouter } from "../src/root";
import { getCaller } from "./helpers";

describe("Transaction route", async () => {
  const caller = await getCaller();

  describe("getAll", () => {
    it("should get all", async () => {
      const result = await caller.tx.getAll({});
      expect(result).toMatchSnapshot();
    });

    it("should get all with pagination", async () => {
      type Input = inferProcedureInput<AppRouter["tx"]["getAll"]>;
      const input: Input = {
        p: 2,
        ps: 2,
      };

      const result = await caller.tx.getAll(input);
      expect(result).toMatchSnapshot();
    });
  });

  describe("getByHash", () => {
    it("should get by hash", async () => {
      type Input = inferProcedureInput<AppRouter["tx"]["getByHash"]>;
      const input: Input = {
        hash: "txHash001",
      };

      const result = await caller.tx.getByHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should error if no tx with hash", async () => {
      await expect(
        caller.tx.getByHash({
          hash: "nonExistingHash",
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No tx with hash 'nonExistingHash'`,
        })
      );
    });
  });

  describe("getByAddress", () => {
    it("should get by address", async () => {
      type Input = inferProcedureInput<AppRouter["tx"]["getByAddress"]>;
      const input: Input = {
        address: "address2",
      };

      const result = await caller.tx.getByAddress(input);
      expect(result).toMatchSnapshot();
    });

    it("should get by address with pagination", async () => {
      type Input = inferProcedureInput<AppRouter["tx"]["getByAddress"]>;
      const input: Input = {
        p: 1,
        ps: 1,
        address: "address4",
      };

      const result = await caller.tx.getByAddress(input);
      expect(result).toMatchSnapshot();
    });
  });
});
