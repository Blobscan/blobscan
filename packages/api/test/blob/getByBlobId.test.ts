import { beforeAll, describe, expect, it } from "vitest";

import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getByBlobId", () => {
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    blobCaller = createBlobCaller(await createTestContext());
  });

  it("should get a blob by versioned hash", async () => {
    const result = await blobCaller.getByBlobId({
      id: "blobHash004",
    });

    expect(result).toMatchSnapshot();
  });

  it("should get a blob by kzg commitment", async () => {
    const result = await blobCaller.getByBlobId({
      id: "commitment004",
    });

    expect(result).toMatchSnapshot();
  });

  it("should fail when trying to get a blob by a non-existent hash", async () => {
    await expect(
      blobCaller.getByBlobId({
        id: "nonExistingHash",
      })
    ).rejects.toMatchSnapshot();
  });
});
