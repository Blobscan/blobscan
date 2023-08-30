import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import type { AppRouter } from "../src/root";
import { getCaller } from "./helpers";

vi.mock("@blobscan/blob-storage-manager/src/env", () => ({
  env: {
    CHAIN_ID: 1,
    POSTGRES_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_PROJECT_ID: "blobscan",
    GOOGLE_STORAGE_BUCKET_NAME: "blobscan-test",
    GOOGLE_STORAGE_API_ENDPOINT: "http://localhost:8080",
  },
}));

describe("Blob route", async () => {
  const caller = await getCaller();

  describe("getAll", () => {
    it("should get all", async () => {
      const result = await caller.blob.getAll({});
      expect(result).toMatchSnapshot();
    });

    it("should get all with pagination", async () => {
      type Input = inferProcedureInput<AppRouter["blob"]["getAll"]>;
      const input: Input = {
        p: 2,
        ps: 2,
      };

      const result = await caller.blob.getAll(input);
      expect(result).toMatchSnapshot();
    });
  });

  describe("getByVersionedHash", () => {
    it("should get by versioned hash", async () => {
      type Input = inferProcedureInput<AppRouter["blob"]["getByVersionedHash"]>;
      const input: Input = {
        versionedHash: "blobHash004",
      };

      const result = await caller.blob.getByVersionedHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should get by versioned hash from POSTGRES", async () => {
      type Input = inferProcedureInput<AppRouter["blob"]["getByVersionedHash"]>;
      const input: Input = {
        versionedHash: "blobHash005",
      };

      const result = await caller.blob.getByVersionedHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should get by versioned hash from GOOGLE", async () => {
      type Input = inferProcedureInput<AppRouter["blob"]["getByVersionedHash"]>;
      const input: Input = {
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
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with hash nonExistingHash found`,
        })
      );
    });

    it("should error if no blob data found", async () => {
      await expect(
        caller.blob.getByVersionedHash({
          versionedHash: "blobHash003",
        })
      ).rejects.toThrow(
        new Error("Failed to get blob from any of the storages: ")
      );
    });
  });
});
