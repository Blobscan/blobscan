import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import type { BlobPropagator } from "@blobscan/blob-propagator";
import { getChain } from "@blobscan/chains";
import type { DatePeriod } from "@blobscan/dayjs";
import dayjs, { toDailyDate } from "@blobscan/dayjs";
import { getPrisma } from "@blobscan/db";
import { RollupRegistry } from "@blobscan/rollups";
import { env, redis } from "@blobscan/test";

import type { TRPCContext } from "../src/context";
import type { WithCursorPaginationSchema } from "../src/middlewares/withCursorPagination";
import { DEFAULT_PAGE_LIMIT } from "../src/middlewares/withCursorPagination";
import type { ZodExpandEnum } from "../src/middlewares/withExpands";
import type { FiltersInputSchema } from "../src/middlewares/withFilters";
import type { ApiClient } from "../src/utils";

type FilterAndPagination = FiltersInputSchema & WithCursorPaginationSchema;

type Entity = "address" | "block" | "transaction" | "blob";

const prisma = getPrisma({
  customFieldExtension: {
    blobUrlField: {
      gcs: {
        bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
        apiBaseUrl: env.GOOGLE_STORAGE_API_ENDPOINT,
      },
      loadNetwork: {
        apiBaseUrl: env.WEAVEVM_STORAGE_API_BASE_URL,
      },
      postgres: {
        apiBaseUrl: env.BLOBSCAN_API_BASE_URL,
      },
      s3: {
        apiBaseUrl: env.S3_STORAGE_ENDPOINT,
        bucketName: env.S3_STORAGE_BUCKET_NAME,
      },
      ipfs: {
        gatewayUrl: env.IPFS_STORAGE_GATEWAY_URL,
      },
    },
  },
});

export async function createTestContext({
  apiClient,
  withBlobPropagator = false,
  withRedis = false,
}: Partial<{
  apiClient?: ApiClient;
  withBlobPropagator?: boolean;
  withRedis?: boolean;
}> = {}): Promise<TRPCContext> {
  const req = {
    headers: {
      host: "localhost:3000",
    },
    url: "/api/trpc/test.testProcedure",
  } as TRPCContext["req"];

  if (apiClient) {
    if (apiClient === "indexer") {
      const token = jwt.sign("foobar", env.SECRET_KEY);
      req.headers.authorization = `Bearer ${token}`;
    } else if (apiClient === "ipfs") {
      req.headers.authorization = `Bearer ${env.IPFS_API_KEY}`;
    } else if (apiClient === "load-network") {
      req.headers.authorization = `Bearer ${env.WEAVEVM_API_KEY}`;
    } else if (apiClient === "blob-data") {
      req.headers.authorization = `Bearer ${env.BLOB_DATA_API_KEY}`;
    } else if (apiClient === "admin") {
      req.headers.authorization = `Bearer ${env.ADMIN_API_KEY}`;
    }
  }

  const res = {
    statusCode: 200,
  } as TRPCContext["res"];

  const chain = getChain(env.CHAIN_ID);
  const rollupRegistry = new RollupRegistry({
    OPTIMISM: ["0x6887246668a3b87f54deb3b94ba47a6f63f32985"],
    ARBITRUM: ["0xc1b634853cb333d3ad8663715b08f41a3aec47cc"],
    BASE: ["0x5050f69a9786f081509234f1a7f4684b5e5b76c9"],
  });

  const ctx: TRPCContext = {
    apiClient,
    blobPropagator: undefined,
    blobStorageManager: undefined,
    chain,
    enableTracing: false,
    req,
    res,
    prisma,
    redis: undefined,
    rollupRegistry,
    scope: "rest-api",
  };

  if (withBlobPropagator) {
    ctx.blobPropagator = {
      propagateBlobs(_) {
        return Promise.resolve();
      },
    } as BlobPropagator;
  }

  if (withRedis) {
    ctx.redis = redis;
  }

  return ctx;
}

export function runPaginationTestsSuite(
  entity: Entity,
  fetcher: (paginationInput: FilterAndPagination) => Promise<{
    items: unknown[];
    totalItems?: number;
    pagination: { nextCursor: string | null; previousCursor: string | null };
  }>
) {
  return describe(`when getting paginated ${entity} results`, () => {
    let input: WithCursorPaginationSchema;

    it("should default to the first page when no page was specified", async () => {
      input = {
        ps: 2,
      };

      const { items } = await fetcher(input);

      expect(items).toMatchSnapshot();
    });

    it("should return the default amount of results when no limit was specified", async () => {
      input = {};

      const { items } = await fetcher(input);
      const expectedResultsAmount = Math.min(DEFAULT_PAGE_LIMIT, items.length);

      expect(items.length).toBe(expectedResultsAmount);
    });

    it("should return the correct results when a specific page is requested", async () => {
      const first = await fetcher({ ps: 2 });
      const second = await fetcher({
        ps: 2,
        cursor: first.pagination.nextCursor!,
      });
      const { items } = await fetcher({
        ps: 2,
        cursor: second.pagination.nextCursor!,
      });

      expect(items).toMatchSnapshot();
    });

    it("should return the correct results when a specific page size is requested", async () => {
      input = {
        ps: 3,
      };

      const { items } = await fetcher(input);

      expect(items.length).toBe(input.ps);
    });

    it.each([
      { sort: "asc" as const },
      { sort: "desc" as const },
      { from: "address1" },
      { address: "address1" },
      { to: "address2" },
      { type: "reorged" as const },
      { startBlock: 1002, endBlock: 1007 },
      { startSlot: 102, endSlot: 107 },
      { startEpoch: 3, endEpoch: 3 },
      { startDate: new Date("2023-08-01"), endDate: new Date("2023-09-01") },
    ])(
      "should traverse each result once in both directions for %j",
      async (filters) => {
        const expected = await fetcher({ ...filters, ps: 100 });
        const pages = [];
        let cursor: string | undefined;
        do {
          const page = await fetcher({ ...filters, ps: 2, cursor });
          pages.push(page);
          cursor = page.pagination.nextCursor ?? undefined;
          expect(pages.length).toBeLessThan(100);
        } while (cursor);

        expect(pages.flatMap(({ items }) => items)).toEqual(expected.items);
        expect(pages[0]!.pagination.previousCursor).toBeNull();
        expect(pages.at(-1)!.pagination.nextCursor).toBeNull();
        let page = pages.at(-1)!;
        for (let i = pages.length - 2; i >= 0; i--) {
          expect(page.pagination.previousCursor).not.toBeNull();
          page = await fetcher({
            ...filters,
            ps: 2,
            cursor: page.pagination.previousCursor!,
          });
          expect(page.items).toEqual(pages[i]!.items);
        }
        expect(page.pagination.previousCursor).toBeNull();
      }
    );

    it.each([0, -1, 1.5, 101])("should reject page size %s", async (ps) => {
      await expect(fetcher({ ps })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("should reject page numbers", async () => {
      await expect(
        fetcher({ p: 1 } as unknown as WithCursorPaginationSchema)
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("p parameter"),
      });
    });

    it.each(["", "invalid!", "eyJ2ZXJzaW9uIjoyfQ"])(
      "should reject invalid cursor %j",
      async (cursor) => {
        await expect(fetcher({ cursor })).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      }
    );

    it("should accept a cursor with different filters or order", async () => {
      const first = await fetcher({ ps: 1 });
      expect(first.pagination.nextCursor).not.toBeNull();
      for (const changed of [
        { sort: "asc" as const },
        { from: "address1" },
        { address: "address2" },
      ]) {
        await expect(
          fetcher({ ...changed, ps: 1, cursor: first.pagination.nextCursor! })
        ).resolves.toHaveProperty("pagination");
      }
    });

    it("should omit totals unless requested", async () => {
      expect((await fetcher({ ps: 1 })).totalItems).toBeUndefined();
    });

    it("should return the total number of items when count is provided", async () => {
      input = {
        count: true,
      };

      const { totalItems } = await fetcher(input);

      expect(totalItems).toMatchSnapshot();
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
        rollups: "optimism",
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results starting from the block specified", async () => {
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

    it("should return results up to and including the specified slot", async () => {
      const result = await fetcher({
        endSlot: 102,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results starting from the epoch specified", async () => {
      // epoch 4 starts at slot 128; all fixtures are in epoch 3 (slots 96–127)
      // so startEpoch=4 returns nothing, startEpoch=3 returns all — use 3
      const result = await fetcher({
        startEpoch: 3,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return results up to and including the specified epoch", async () => {
      // epoch 2 ends at slot 95; all fixtures start at slot 101, so endEpoch=2
      // returns nothing. Use endEpoch=3 to include all fixtures
      const result = await fetcher({
        endEpoch: 3,
      });

      expect(result).toMatchSnapshot();
    });

    it("should return the results corresponding to the epoch range specified", async () => {
      const result = await fetcher({
        startEpoch: 3,
        endEpoch: 3,
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
    input: WithCursorPaginationSchema | { expand?: string }
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

    it("should return the correct expanded results when multiple expands are requested", async () => {
      const result = await fetcher({ expand: allowedExpands.join(","), ps: 2 });

      expect(result).toMatchSnapshot();
    });
  });
}

export function unauthorizedRPCCallTest(rpcCall: () => Promise<unknown>) {
  it("should fail when calling procedure without auth", async () => {
    await expect(rpcCall()).rejects.toThrow(
      new TRPCError({ code: "UNAUTHORIZED" })
    );
  });
}

export function generateDailyCounts({ from, to }: DatePeriod, count: number) {
  const dailyCounts: {
    day: Date;
    count: number;
  }[] = [];
  const maxDays = 10;
  const startDate = from
    ? dayjs(from)
    : toDailyDate(dayjs(to).subtract(maxDays));
  const endDate = to ? dayjs(to) : toDailyDate(dayjs(from).add(maxDays));

  const days = endDate.diff(startDate, "days");

  for (let i = 0; i < days; i++) {
    const day = toDailyDate(startDate.add(i, "day")).toDate();

    dailyCounts.push({
      day,
      count,
    });
  }

  return dailyCounts;
}
