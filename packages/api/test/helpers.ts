import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import type { TRPCContext } from "../src/context";
import { createTRPCContext } from "../src/context";
import type { PaginationInput } from "../src/middlewares/withPagination";
import { DEFAULT_PAGE_LIMIT } from "../src/middlewares/withPagination";

export async function createTestContext({
  withAuth,
}: Partial<{ withAuth: boolean }> = {}) {
  const token = jwt.sign("foobar", "supersecret");
  const req = {
    headers: {
      ...(withAuth ? { authorization: `Bearer ${token}` } : {}),
      host: "localhost:3000",
    },
    url: "/api/trpc/test.testProcedure",
  } as NodeHTTPRequest;
  const res = {
    statusCode: 200,
  } as NodeHTTPResponse;

  const ctx = (await createTRPCContext("rest-api")({
    req,
    res,
  })) as TRPCContext;

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
