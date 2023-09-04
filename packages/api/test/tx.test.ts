import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { AppRouter } from "../src/root";
import { appRouter } from "../src/root";
import { getContext } from "./helper";

type GetAllInput = inferProcedureInput<AppRouter["tx"]["getAll"]>;
type GetByHashInput = inferProcedureInput<AppRouter["tx"]["getByHash"]>;
type GetByAddressInput = inferProcedureInput<AppRouter["tx"]["getByAddress"]>;

describe("Transaction route", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await getContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    it("should get all", async () => {
      const result = await caller.tx.getAll({});
      const sortedResults = result.transactions.sort((a, b) => {
        if (a.hash < b.hash) return -1;
        if (a.hash > b.hash) return 1;

        return 0;
      });
      expect(sortedResults).toMatchSnapshot();
    });

    it("should get all with pagination", async () => {
      const input: GetAllInput = {
        p: 2,
        ps: 2,
      };

      const result = await caller.tx.getAll(input);
      const sortedResults = result.transactions.sort((a, b) => {
        if (a.hash < b.hash) return -1;
        if (a.hash > b.hash) return 1;

        return 0;
      });
      expect(sortedResults).toMatchSnapshot();
    });
  });

  describe("getByHash", () => {
    it("should get by hash", async () => {
      const input: GetByHashInput = {
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
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: No tx with hash 'nonExistingHash']"
      );
    });
  });

  describe("getByAddress", () => {
    it("should get by address", async () => {
      const input: GetByAddressInput = {
        address: "address2",
      };

      const result = await caller.tx.getByAddress(input);
      expect(result).toMatchSnapshot();
    });

    it("should get by address with pagination", async () => {
      const input: GetByAddressInput = {
        p: 1,
        ps: 1,
        address: "address4",
      };

      const result = await caller.tx.getByAddress(input);
      expect(result).toMatchSnapshot();
    });
  });
});
