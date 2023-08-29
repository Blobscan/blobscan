import { afterEach, describe, expect, it, vi } from "vitest";

import { BlobStorageManager } from "./BlobStorageManager";
import {
  createOrLoadBlobStorageManager,
  resetBlobStorageManager,
} from "./index";
import { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";

vi.mock("./BlobStorageManager", async () => {
  const manager = await vi.importActual<BlobStorageManager>(
    "./BlobStorageManager"
  );
  return {
    BlobStorageManager: vi.fn().mockImplementation(() => manager),
  };
});

vi.mock("./storages", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const storages = await vi.importActual<typeof import("./storages")>(
    "./storages"
  );
  return {
    GoogleStorage: {
      tryCreateFromEnv: vi.fn().mockResolvedValue(storages.GoogleStorage),
    },
    SwarmStorage: {
      tryCreateFromEnv: vi.fn().mockResolvedValue(storages.SwarmStorage),
    },
    PostgresStorage: {
      tryCreateFromEnv: vi.fn().mockResolvedValue(storages.PostgresStorage),
    },
  };
});

describe("createOrLoadBlobStorageManager", () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetBlobStorageManager();
  });

  it("should initialize BlobStorageManager when it does not exist", async () => {
    await createOrLoadBlobStorageManager();

    expect(BlobStorageManager).toBeCalledTimes(1);
    expect(GoogleStorage.tryCreateFromEnv).toBeCalledTimes(1);
    expect(SwarmStorage.tryCreateFromEnv).toBeCalledTimes(1);
    expect(PostgresStorage.tryCreateFromEnv).toBeCalledTimes(1);
  });

  it("should return existing instance of BlobStorageManager if it exists", async () => {
    await createOrLoadBlobStorageManager(); // initialize
    await createOrLoadBlobStorageManager(); // return existing instance

    // BlobStorageManager should only be called once
    expect(BlobStorageManager).toBeCalledTimes(1);
    expect(GoogleStorage.tryCreateFromEnv).toBeCalledTimes(1);
    expect(SwarmStorage.tryCreateFromEnv).toBeCalledTimes(1);
    expect(PostgresStorage.tryCreateFromEnv).toBeCalledTimes(1);
  });
});
