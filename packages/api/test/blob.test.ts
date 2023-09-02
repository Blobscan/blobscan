import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { AppRouter } from "../src/root";
import { getCaller } from "./helper";

type GetAllInput = inferProcedureInput<AppRouter["blob"]["getAll"]>;
type GetByHashInput = inferProcedureInput<
  AppRouter["blob"]["getByVersionedHash"]
>;

describe("Blob route", async () => {
  let caller;

  beforeAll(async () => {
    caller = await getCaller();
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
