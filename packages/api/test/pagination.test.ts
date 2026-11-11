import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  createOpenApiHttpHandler,
  generateOpenApiDocument,
} from "trpc-to-openapi";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import "../../../apps/rest-api-server/src/bigint";
import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import { createAppRouter, openApiOverride } from "../src";
import { createTestContext } from "./helpers";

const router = createAppRouter();

describe("cursor pagination", () => {
  let ctx: TRPCContext;
  let caller: ReturnType<typeof router.createCaller>;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = router.createCaller(ctx);
  });

  it("rejects a cursor from a different resource", async () => {
    const { pagination } = await caller.block.getAll({ ps: 1 });
    await expect(
      caller.tx.getAll({ cursor: pagination.nextCursor! })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.blob.getAll({ cursor: pagination.nextCursor! })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it.each([
    ["asc", true],
    ["desc", true],
    ["asc", false],
    ["desc", false],
  ] as const)(
    "handles null transaction indexes and equal sort values in %s order (all null: %s)",
    async (sort, allNull) => {
      await ctx.prisma.transaction.updateMany({
        where: allNull ? {} : { index: 0 },
        data: { index: null },
      });
      const { transactions: expected } = await caller.tx.getAll({
        sort,
        ps: 100,
      });
      const hashes: string[] = [];
      const pages = [];
      let cursor: string | undefined;
      do {
        const page = await caller.tx.getAll({ sort, ps: 1, cursor });
        pages.push(page);
        hashes.push(...page.transactions.map(({ hash }) => hash));
        cursor = page.pagination.nextCursor ?? undefined;
        expect(pages.length).toBeLessThan(100);
      } while (cursor);
      expect(hashes).toEqual(expected.map(({ hash }) => hash));
      let page = pages.at(-1)!;
      for (let i = pages.length - 2; i >= 0; i--) {
        page = await caller.tx.getAll({
          sort,
          ps: 1,
          cursor: page.pagination.previousCursor!,
        });
        expect(page.transactions).toEqual(pages[i]!.transactions);
      }
    }
  );

  it("continues after the cursor record is removed", async () => {
    const { transactions: expected } = await caller.tx.getAll({ ps: 100 });
    const first = await caller.tx.getAll({ ps: 1 });
    const hash = first.transactions[0]!.hash;
    await ctx.prisma.$transaction([
      ctx.prisma.blobsOnTransactions.deleteMany({ where: { txHash: hash } }),
      ctx.prisma.transactionFork.deleteMany({ where: { hash } }),
      ctx.prisma.transaction.delete({ where: { hash } }),
    ]);
    const next = await caller.tx.getAll({
      ps: 100,
      cursor: first.pagination.nextCursor!,
    });
    expect(next.transactions.map(({ hash }) => hash)).toEqual(
      expected.slice(1).map(({ hash }) => hash)
    );
  });

  it("does not repeat records when a newer record is added", async () => {
    const first = await caller.block.getAll({ ps: 2 });
    const { blocks: expected } = await caller.block.getAll({ ps: 100 });
    await ctx.prisma.block.create({
      data: {
        ...fixtures.blocks[0]!,
        hash: "newBlock",
        number: 9999,
        slot: 9999,
        timestamp: new Date("2024-01-01"),
      },
    });
    await ctx.prisma.transaction.create({
      data: {
        ...fixtures.txs[0]!,
        hash: "newTx",
        blockHash: "newBlock",
        blockNumber: 9999,
        blockTimestamp: new Date("2024-01-01"),
      },
    });
    const next = await caller.block.getAll({
      ps: 100,
      cursor: first.pagination.nextCursor!,
    });
    expect(next.blocks.map(({ hash }) => hash)).toEqual(
      expected.slice(2).map(({ hash }) => hash)
    );
    expect((await caller.block.getAll({ ps: 1 })).blocks[0]!.hash).toBe(
      "newBlock"
    );
  });

  it("returns a recovery cursor when the remaining records are removed", async () => {
    const { blocks } = await caller.block.getAll({ ps: 100 });
    const first = await caller.block.getAll({ ps: blocks.length - 1 });
    const last = blocks.at(-1)!;
    await ctx.prisma.$transaction([
      ctx.prisma.blobsOnTransactions.deleteMany({
        where: { blockHash: last.hash },
      }),
      ctx.prisma.transactionFork.deleteMany({
        where: { blockHash: last.hash },
      }),
      ctx.prisma.transaction.deleteMany({ where: { blockHash: last.hash } }),
      ctx.prisma.block.delete({ where: { hash: last.hash } }),
    ]);
    const empty = await caller.block.getAll({
      ps: 2,
      cursor: first.pagination.nextCursor!,
    });
    expect(empty.blocks).toEqual([]);
    expect(empty.pagination.nextCursor).toBeNull();
    expect(empty.pagination.previousCursor).not.toBeNull();
    const previous = await caller.block.getAll({
      ps: 2,
      cursor: empty.pagination.previousCursor!,
    });
    expect(previous.blocks.map(({ hash }) => hash)).toEqual(
      blocks.slice(-3, -1).map(({ hash }) => hash)
    );
  });

  it("rejects an unsupported token version or incorrect sort values", async () => {
    const { pagination } = await caller.tx.getAll({ ps: 1 });
    const token = JSON.parse(
      Buffer.from(pagination.nextCursor!, "base64url").toString()
    );
    for (const change of [
      { version: 2 },
      { position: ["invalid-date", 1, "hash"] },
      { position: [] },
      { direction: "invalid" },
    ]) {
      const cursor = Buffer.from(
        JSON.stringify({ ...token, ...change })
      ).toString("base64url");
      await expect(caller.tx.getAll({ cursor })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  });

  describe("REST contract", () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      const handler = createOpenApiHttpHandler({
        router,
        createContext: () => ctx,
        options: { override: openApiOverride },
      });
      server = createServer((req, res) => {
        void handler(req, res);
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve)
      );
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Missing server address");
      baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
      if (!server) return;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    });

    it("documents cursors and bounded page sizes", () => {
      const document = generateOpenApiDocument(router, {
        title: "Pagination test",
        version: "1.0.0",
        baseUrl,
        options: { override: openApiOverride },
      });
      for (const path of ["/blocks", "/transactions", "/blobs"]) {
        const parameters = document.paths![path]!.get!.parameters;
        expect(parameters).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: "cursor" }),
            expect.objectContaining({
              name: "ps",
              schema: expect.objectContaining({ minimum: 1, maximum: 100 }),
            }),
          ])
        );
        expect(parameters).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ name: "p" })])
        );
      }
    });

    it.each(["blocks", "transactions", "blobs"])(
      "paginates /%s and rejects page numbers",
      async (resource) => {
        const response = await fetch(`${baseUrl}/${resource}?ps=1`);
        expect(response.status).toBe(200);
        const first = await response.json();
        expect(first.pagination.previousCursor).toBeNull();
        expect(first.pagination.nextCursor).toEqual(expect.any(String));
        const next = await fetch(
          `${baseUrl}/${resource}?ps=1&cursor=${first.pagination.nextCursor}`
        );
        expect(next.status).toBe(200);
        const second = await next.json();
        expect(second[resource]).not.toEqual(first[resource]);
        const previous = await fetch(
          `${baseUrl}/${resource}?ps=1&cursor=${second.pagination.previousCursor}`
        );
        expect((await previous.json())[resource]).toEqual(first[resource]);
        const legacy = await fetch(`${baseUrl}/${resource}?p=1`);
        expect(legacy.status).toBe(400);
        expect((await legacy.json()).message).toContain("p parameter");
      }
    );
  });
});
