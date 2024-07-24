import { TRPCError } from "@trpc/server";
import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { createBlobPropagator } from "@blobscan/blob-propagator/src/blob-propagator";
import type { Rollup } from "@blobscan/db";
import { env } from "@blobscan/env";

import { createTRPCContext } from "../src/context";
import type { ZodExpandEnum } from "../src/middlewares/withExpands";
import type { FiltersSchema } from "../src/middlewares/withFilters";
import type { WithPaginationSchema } from "../src/middlewares/withPagination";
import { DEFAULT_PAGE_LIMIT } from "../src/middlewares/withPagination";

type TRPCContext = ReturnType<ReturnType<Awaited<typeof createTRPCContext>>>;

type FilterAndPagination = Omit<FiltersSchema, "rollup"> & {
  rollup?: Lowercase<Rollup> | "null";
} & WithPaginationSchema;

type Entity = "address" | "block" | "transaction" | "blob";

export async function createTestContext({
  withAuth,
  withBlobPropagator = false,
}: Partial<{
  withAuth: boolean;
  withBlobPropagator: boolean;
}> = {}): TRPCContext {
  const req = {
    headers: {
      host: "localhost:3000",
    },
    url: "/api/trpc/test.testProcedure",
  } as NodeHTTPRequest;

  if (withAuth) {
    const token = jwt.sign("foobar", env.SECRET_KEY);
    req.headers.authorization = `Bearer ${token}`;
  }

  const res = {
    statusCode: 200,
  } as NodeHTTPResponse;

  const ctx = await createTRPCContext({
    scope: "rest-api",
  })({
    req,
    res,
  });

  if (withBlobPropagator) {
    ctx.blobPropagator = await createBlobPropagator(
      ctx.blobStorageManager,
      ctx.prisma
    );
  } else {
    ctx.blobPropagator = undefined;
  }

  return ctx;
}

export function runPaginationTestsSuite(
  entity: Entity,
  fetcher: (paginationInput: WithPaginationSchema) => Promise<unknown[]>
) {
  return describe(`when getting paginated ${entity} results`, () => {
    let input: WithPaginationSchema;

    it("should default to the first page when no page was specified", async () => {
      input = {
        ps: 2,
      };

      const result = await fetcher(input);

      expect(result).toMatchSnapshot();
    });

    it("should return the default amount of results when no limit was specified", async () => {
      input = {
        p: 1,
      };

      const result = await fetcher(input);
      const expectedResultsAmount = Math.min(DEFAULT_PAGE_LIMIT, result.length);

      expect(result.length).toBe(expectedResultsAmount);
    });

    it("should return the correct results when a specific page is requested", async () => {
      input = {
        p: 3,
        ps: 2,
      };

      const result = await fetcher(input);

      expect(result).toMatchSnapshot();
    });

    it("should return the correct results when a specific page size is requested", async () => {
      input = {
        ps: 3,
      };

      const result = await fetcher(input);

      expect(result.length).toBe(input.ps);
    });
  });
}

export function runFiltersTestsSuite(
  entity: Entity,
  fetcher: (getAllInput: Partial<FilterAndPagination>) => Promise<unknown[]>
) {
  return describe(`when getting filtered ${entity} results`, () => {
    it("should return the latest results when no sort was specified", async () => {
      const result = await fetcher({
        ps: 3,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the oldest results when ascending order is specified", async () => {
      const result = await fetcher({
        ps: 3,
        sort: "asc",
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to a provided rollup", async () => {
      const result = await fetcher({
        rollup: "optimism",
      });

      expect(result).toMatchSnapshot();
    });

    it("should only return the results that do not have a rollup when 'null' is provided", async () => {
      const result = await fetcher({
        rollup: "null",
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results starting from the block specificed", async () => {
      const result = await fetcher({
        startBlock: 1007,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results ending at the block specified without including it", async () => {
      const result = await fetcher({
        endBlock: 1002,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to the block range specified ", async () => {
      const result = await fetcher({
        startBlock: 1004,
        endBlock: 1006,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results starting from the date specified", async () => {
      const result = await fetcher({
        startDate: new Date("2023-08-31"),
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results ending at the date specified without including it", async () => {
      const result = await fetcher({
        endDate: new Date("2022-12-01"),
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to the date range specified", async () => {
      const result = await fetcher({
        startDate: new Date("2023-08-03"),
        endDate: new Date("2023-08-28"),
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results starting from the slot specified", async () => {
      const result = await fetcher({
        startSlot: 107,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results ending at the slot specified without including it", async () => {
      const result = await fetcher({
        endSlot: 102,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to the sender address specified", async () => {
      const result = await fetcher({
        from: "address1",
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to the receiver address specified", async () => {
      const result = await fetcher({
        to: "address2",
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to the sender and receiver addresses specified", async () => {
      const result = await fetcher({
        from: "address1",
        to: "address2",
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to reorged blocks when 'reorged' type is specified", async () => {
      const result = await fetcher({
        type: "reorged",
      });

      expect(result).toMatchSnapshot();
    });
  });
}

export function runExpandsTestsSuite(
  entity: Entity,
  allowedExpands: ZodExpandEnum[],
  fetcher: (
    input: WithPaginationSchema | { expand?: string }
  ) => Promise<unknown>
) {
  describe(`when getting expanded ${entity} results`, () => {
    if (allowedExpands.includes("block")) {
      it("should return the correct expanded block", async () => {
        const result = await fetcher({
          expand: "block",
          ps: 2,
        });

        expect(result).toMatchSnapshot();
      });
    }

    if (allowedExpands.includes("transaction")) {
      it("should return the correct expanded transaction", async () => {
        const result = await fetcher({ expand: "transaction", ps: 2 });

        expect(result).toMatchSnapshot();
      });
    }

    if (allowedExpands.includes("blob")) {
      it("should return the correct expanded blob", async () => {
        const result = await fetcher({ expand: "blob", ps: 2 });

        expect(result).toMatchSnapshot();
      });
    }

    if (allowedExpands.includes("blob_data")) {
      it("should return the correct expanded blob data", async () => {
        const result = await fetcher({ expand: "blob_data", ps: 2 });

        expect(result).toMatchSnapshot();
      });
    }

    it("should return the correct expanded results when multiple expands are requested", async () => {
      const result = await fetcher({ expand: allowedExpands.join(","), ps: 2 });

      expect(result).toMatchSnapshot();
    });
  });
}

export async function unauthorizedRPCCallTest(rpcCall: () => Promise<unknown>) {
  it("should fail when calling procedure without auth", async () => {
    await expect(rpcCall()).rejects.toThrow(
      new TRPCError({ code: "UNAUTHORIZED" })
    );
  });
}
