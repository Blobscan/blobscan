import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { createBlobPropagator } from "@blobscan/blob-propagator/src/blob-propagator";

import { env } from "../src";
import { createTRPCContext } from "../src/context";
import type { PaginationInput } from "../src/middlewares/withPagination";
import { DEFAULT_PAGE_LIMIT } from "../src/middlewares/withPagination";

type TRPCContext = ReturnType<ReturnType<Awaited<typeof createTRPCContext>>>;

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
    ctx.blobPropagator = createBlobPropagator();
  }

  return ctx;
}

export function runPaginationTestsSuite(
  entity: string,
  fetcher: (paginationInput: PaginationInput) => Promise<unknown[]>
) {
  return describe(`when getting paginated ${entity} results`, () => {
    let input: PaginationInput;

    it("should return the correct number of results", async () => {
      input = {
        p: 1,
        ps: 2,
      };

      const result = await fetcher(input);

      expect(result).toMatchSnapshot();
    });

    it("should default to the first page when no page was specified", async () => {
      input = {
        ps: 2,
      };

      const result = await fetcher(input);

      expect(result).toMatchSnapshot();
    });

    it(`should return the default amount of results when no limit was specified`, async () => {
      input = {
        p: 1,
      };

      const result = await fetcher(input);
      const expectedResultsAmount = Math.min(DEFAULT_PAGE_LIMIT, result.length);

      expect(result.length).toBe(expectedResultsAmount);
    });
  });
}
