import { describe, expect, it, vi } from "vitest";

import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db/prisma/enums";

import type { ExtendedBlobDataStorageReference } from "../../src/routers/blob/helpers";
import { buildSignedUrlsMap } from "../../src/routers/blob/helpers";

function buildPrismaRef(
  overrides: Partial<ExtendedBlobDataStorageReference>
): ExtendedBlobDataStorageReference {
  return {
    blobStorage: BlobStorage.GOOGLE,
    dataReference: "data-ref",
    url: "https://storage.googleapis.com/bucket/data-ref",
    ...overrides,
  } as ExtendedBlobDataStorageReference;
}

function makeManager(
  perStorageReadUrl: Partial<
    Record<BlobStorage, (reference: string) => Promise<string | undefined>>
  >
): BlobStorageManager {
  return {
    getStorage: (name: BlobStorage) => {
      const fn = perStorageReadUrl[name];
      if (!fn) return undefined;
      return {
        getReadUrl: vi.fn(async (reference: string) => fn(reference)),
      };
    },
  } as unknown as BlobStorageManager;
}

describe("buildSignedUrlsMap", () => {
  it("returns an empty map when no references are passed", async () => {
    const manager = makeManager({});

    const result = await buildSignedUrlsMap([], manager);

    expect(result.size).toBe(0);
  });

  it("returns an empty map when no storage in the manager produces a URL", async () => {
    // S3 storage isn't registered → getStorage returns undefined.
    // GoogleStorage's default getReadUrl returns undefined when signed=false; we
    // simulate "registered but signing not supported" by returning undefined.
    const manager = makeManager({
      [BlobStorage.GOOGLE]: async () => undefined,
    });

    const result = await buildSignedUrlsMap(
      [
        buildPrismaRef({ dataReference: "ref-1" }),
        buildPrismaRef({
          blobStorage: BlobStorage.S3,
          dataReference: "ref-2",
        }),
      ],
      manager
    );

    expect(result.size).toBe(0);
  });

  it("maps signed URLs by dataReference", async () => {
    const manager = makeManager({
      [BlobStorage.GOOGLE]: async (reference) =>
        `https://signed/${reference}`,
    });

    const result = await buildSignedUrlsMap(
      [
        buildPrismaRef({ dataReference: "ref-1" }),
        buildPrismaRef({ dataReference: "ref-2" }),
      ],
      manager
    );

    expect(Object.fromEntries(result)).toEqual({
      "ref-1": "https://signed/ref-1",
      "ref-2": "https://signed/ref-2",
    });
  });

  it("only signs storages that are registered in the manager", async () => {
    const manager = makeManager({
      [BlobStorage.GOOGLE]: async (reference) =>
        `https://signed/${reference}`,
    });

    const result = await buildSignedUrlsMap(
      [
        buildPrismaRef({ dataReference: "gcs-ref" }),
        buildPrismaRef({
          blobStorage: BlobStorage.S3,
          dataReference: "s3-ref",
        }),
      ],
      manager
    );

    expect(Object.fromEntries(result)).toEqual({
      "gcs-ref": "https://signed/gcs-ref",
    });
  });

  it("survives a single signing failure and signs the rest", async () => {
    const manager = makeManager({
      [BlobStorage.GOOGLE]: async (reference) => {
        if (reference === "ref-bad") throw new Error("boom");
        return `https://signed/${reference}`;
      },
    });

    const result = await buildSignedUrlsMap(
      [
        buildPrismaRef({ dataReference: "ref-bad" }),
        buildPrismaRef({ dataReference: "ref-good" }),
      ],
      manager
    );

    expect(Object.fromEntries(result)).toEqual({
      "ref-good": "https://signed/ref-good",
    });
  });

  it("returns an empty map when every signing fails", async () => {
    const manager = makeManager({
      [BlobStorage.GOOGLE]: async () => {
        throw new Error("nope");
      },
    });

    const result = await buildSignedUrlsMap(
      [buildPrismaRef({ dataReference: "ref-1" })],
      manager
    );

    expect(result.size).toBe(0);
  });
});
