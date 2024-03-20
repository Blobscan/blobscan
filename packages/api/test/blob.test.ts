/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import type { TRPCContext } from "../src/context";
import {
  createTestContext,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";

type GetByIdInput = inferProcedureInput<AppRouter["blob"]["getByBlobId"]>;

describe("Blob router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    runPaginationTestsSuite("blob", (paginationInput) =>
      caller.blob.getAll(paginationInput).then(({ blobs }) => blobs)
    );

    runFiltersTestsSuite("blob", (baseGetAllInput) =>
      caller.blob.getAll(baseGetAllInput).then(({ blobs }) => blobs)
    );
  });

  describe.each([
    { functionName: "getByBlobId" },
    { functionName: "getByBlobIdFull" },
  ])("$functionName", ({ functionName }) => {
    it("should get a blob by versioned hash", async () => {
      const input: GetByIdInput = {
        id: "blobHash004",
      };

      // @ts-ignore
      const result = await caller.blob[functionName](input);

      expect(result).toMatchSnapshot();
    });

    it("should get a blob by kzg commitment", async () => {
      const input: GetByIdInput = {
        id: "commitment004",
      };

      // @ts-ignore
      const result = await caller.blob[functionName](input);

      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a blob by a non-existent hash", async () => {
      await expect(
        // @ts-ignore
        caller.blob[functionName]({
          id: "nonExistingHash",
        })
      ).rejects.toMatchSnapshot();
    });

    it("should fail when getting a blob and the blob data is not available", async () => {
      await expect(
        // @ts-ignore
        caller.blob[functionName]({
          id: "blobHash003",
        })
      ).rejects.toMatchSnapshot();
    });
  });
});
