import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { AppRouter } from "../src/root";
import { appRouter } from "../src/root";
import { getContext } from "./helper";

describe("Block route", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await getContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    it("should get all", async () => {
      const result = await caller.block.getAll({});
      expect(result).toMatchSnapshot();
    });

    it("should get all with pagination", async () => {
      type Input = inferProcedureInput<AppRouter["block"]["getAll"]>;
      const input: Input = {
        p: 2,
        ps: 2,
      };

      const result = await caller.block.getAll(input);
      expect(result).toMatchSnapshot();
    });
  });

  describe("getByHash", () => {
    it("should get by hash", async () => {
      type Input = inferProcedureInput<AppRouter["block"]["getByHash"]>;
      const input: Input = {
        hash: "blockHash001",
      };

      const result = await caller.block.getByHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should error if no block with hash", async () => {
      await expect(
        caller.block.getByHash({
          hash: "nonExistingHash",
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with hash 'nonExistingHash'`,
        })
      );
    });
  });

  describe("getByBlockNumber", () => {
    it("should get by hash", async () => {
      type Input = inferProcedureInput<AppRouter["block"]["getByBlockNumber"]>;
      const input: Input = {
        number: 1002,
      };

      const result = await caller.block.getByBlockNumber(input);
      expect(result).toMatchSnapshot();
    });

    it("should error if no block with hash", async () => {
      await expect(
        caller.block.getByBlockNumber({
          number: 1004,
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with number '1004'`,
        })
      );
    });
  });
});
