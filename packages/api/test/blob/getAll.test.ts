import { beforeAll, beforeEach, describe } from "vitest";

import type { TRPCContext } from "../../src";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getAll", () => {
  let blobCaller: BlobCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blobCaller = createBlobCaller(ctx);
  });

  beforeEach(async () => {
    await ctx.prisma.overallStats.aggregate();
  });

  runPaginationTestsSuite("blob", (paginationInput) =>
    blobCaller.getAll(paginationInput).then(({ blobs, totalBlobs }) => ({
      items: blobs,
      totalItems: totalBlobs,
    }))
  );

  runFiltersTestsSuite("blob", (baseGetAllInput) =>
    blobCaller.getAll(baseGetAllInput).then(({ blobs }) => blobs)
  );

  runExpandsTestsSuite("blob", ["block", "transaction"], (input) =>
    blobCaller.getAll(input).then(({ blobs }) => blobs)
  );
});
