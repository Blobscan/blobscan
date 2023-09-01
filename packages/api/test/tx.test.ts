import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { AppRouter } from "../src/root";
import { getCaller } from "./helper";

type GetAllInput = inferProcedureInput<AppRouter["tx"]["getAll"]>;
type GetByHashInput = inferProcedureInput<AppRouter["tx"]["getByHash"]>;
type GetByAddressInput = inferProcedureInput<AppRouter["tx"]["getByAddress"]>;

describe("Transaction route", async () => {
  let caller;

  beforeAll(async () => {
    caller = await getCaller();
  });

  describe("getAll", () => {
    it("should get all", async () => {
      const result = await caller.tx.getAll({});
      expect(result).toMatchSnapshot();
    });

    it("should get all with pagination", async () => {
      const input: GetAllInput = {
        p: 2,
        ps: 2,
      };

      const result = await caller.tx.getAll(input);
      expect(result).toMatchSnapshot();
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
