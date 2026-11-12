import { beforeAll, beforeEach, describe } from "vitest";

import type { TRPCContext } from "../../src";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "../helpers";
import { aggregateMetrics } from "../metrics";
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
    await aggregateMetrics(ctx.prisma);
  });

  runPaginationTestsSuite("blob", (paginationInput) =>
    blobCaller
      .getAllByCursor(paginationInput)
      .then(({ blobs, totalBlobs, pagination }) => ({
        items: blobs,
        pagination,
        totalItems: totalBlobs,
      }))
  );

  runFiltersTestsSuite("blob", (baseGetAllInput) =>
    blobCaller.getAllByCursor(baseGetAllInput).then(({ blobs }) => blobs)
  );

  runExpandsTestsSuite("blob", ["block", "transaction"], (input) =>
    blobCaller.getAllByCursor(input).then(({ blobs }) => blobs)
  );
});
