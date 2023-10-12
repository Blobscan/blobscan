import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../src/root";
import { appRouter } from "../src/root";
import { getContext } from "./helpers";

type GetAllInput = inferProcedureInput<AppRouter["blob"]["getAll"]>;
type GetByHashInput = inferProcedureInput<
  AppRouter["blob"]["getByVersionedHash"]
>;

vi.mock("@blobscan/blob-storage-manager/src/env", () => ({
  env: {
    CHAIN_ID: 7011893058,
    POSTGRES_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_PROJECT_ID: "blobscan-test-project",
    GOOGLE_STORAGE_BUCKET_NAME: "blobscan-test-bucket",
    GOOGLE_STORAGE_API_ENDPOINT: "http://localhost:4443",
  },
}));

describe("Blob route", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await getContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    it("should get all", async () => {
      const result = await caller.blob.getAll({});
      expect(result).toMatchSnapshot();
    });

    it("should get all with pagination", async () => {
      const input: GetAllInput = {
        p: 2,
        ps: 2,
      };

      const result = await caller.blob.getAll(input);
      expect(result).toMatchSnapshot();
    });
  });

  describe("getByVersionedHash", () => {
    it("should get by versioned hash", async () => {
      const input: GetByHashInput = {
        versionedHash: "blobHash004",
      };

      const result = await caller.blob.getByVersionedHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should get by versioned hash from POSTGRES", async () => {
      const input: GetByHashInput = {
        versionedHash: "blobHash005",
      };

      const result = await caller.blob.getByVersionedHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should get by versioned hash from GOOGLE", async () => {
      const input: GetByHashInput = {
        versionedHash: "blobHash001",
      };

      const result = await caller.blob.getByVersionedHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should error if no blob with hash", async () => {
      await expect(
        caller.blob.getByVersionedHash({
          versionedHash: "nonExistingHash",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: No blob with hash nonExistingHash found]"
      );
    });

    it("should error if no blob data found", async () => {
      await expect(
        caller.blob.getByVersionedHash({
          versionedHash: "blobHash003",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: Failed to get blob from any of the storages: ]"
      );
    });
  });
});
