import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { search } from "../../search";
import { searchRouter } from "../src/routers/search";
import { createTestContext } from "./helpers";

type Input = inferProcedureInput<typeof search>;

describe("Search route", async () => {
  let searchCaller: ReturnType<typeof searchRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await createTestContext();
    searchCaller = searchRouter.createCaller(ctx);
  });

  describe("byTerm", () => {
    it("should search by address", async () => {
      const input: Input = {
        query: "0xad01b55d7c3448b8899862eb335fbb17075d8de2",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({
        address: [{ id: "0xad01b55d7c3448b8899862eb335fbb17075d8de2" }],
      });
    });

    it("should search by commitment", async () => {
      const input: Input = {
        query:
          "0xb4f67eb0771fbbf1b06b88ce0e23383daf994320508d44dd30dbd507f598c0d9b3da5a152e41a0428375060c3803b983",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({
        blob: [
          {
            id: "0x010001c79d78a76fb9b4bab3896ee3ea32f3e2607da7801eb1a92da39d6c1368",
          },
        ],
      });
    });

    it("should search by blob hash", async () => {
      const input: Input = {
        query:
          "0x010001c79d78a76fb9b4bab3896ee3ea32f3e2607da7801eb1a92da39d6c1368",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({
        blob: [
          {
            id: "0x010001c79d78a76fb9b4bab3896ee3ea32f3e2607da7801eb1a92da39d6c1368",
          },
        ],
      });
    });

    it("should search by tx hash", async () => {
      const input: Input = {
        query:
          "0x5be77167b05f39ea8950f11b0da2bdfec6e04055030068b051ac5a43aaf251e9",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({
        transaction: [
          {
            id: "0x5be77167b05f39ea8950f11b0da2bdfec6e04055030068b051ac5a43aaf251e9",
          },
        ],
      });
    });

    it("should search by block number", async () => {
      const input: Input = {
        query: "1001",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({
        block: [
          {
            label: "1001",
            id: "blockHash001",
            reorg: false,
          },
        ],
      });
    });

    it("should search by slot number", async () => {
      const input: Input = {
        query: "101",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({
        slot: [
          {
            id: "blockHash001",
            label: "1001",
            reorg: false,
          },
        ],
      });
    });

    it("should return empty for unknown term", async () => {
      const input: Input = {
        query: "unknown",
      };

      const result = await searchCaller.byTerm(input);
      expect(result).toMatchObject({});
    });
  });
});
