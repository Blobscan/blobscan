import type { Storage } from "@google-cloud/storage";
import type { StorageOptions } from "@google-cloud/storage";
import { vi } from "vitest";

import { FILE_URI } from "../../test/fixtures";
import { GoogleStorage } from "../storages";
import type {
  GoogleCredentials,
  GoogleStorageConfig,
} from "../storages/GoogleStorage";

vi.mock("@google-cloud/storage", async () => {
  return {
    Storage: vi.fn().mockImplementation((config: StorageOptions) => {
      return {
        projectId: config.projectId,
        apiEndpoint: config.apiEndpoint,
        getServiceAccount: vi.fn().mockReturnValue([
          {
            emailAddress: config.credentials
              ? (config.credentials as GoogleCredentials).client_email
              : undefined,
          },
        ]),
        getBuckets: vi.fn().mockResolvedValue([[{ name: "mock-bucket" }]]),
        bucket: vi.fn().mockReturnValue({
          file: vi.fn().mockImplementation((uri: string) => {
            return {
              download: vi.fn().mockImplementation(() => {
                if (uri === FILE_URI) {
                  return Buffer.from("mock-data");
                }
                throw new Error("File not found");
              }),
              save: vi.fn((data: string) => data),
            };
          }),
        }),
        createBucket: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

export class GoogleStorageMock extends GoogleStorage {
  constructor(config: GoogleStorageConfig) {
    super(config);
  }

  get bucketName(): string {
    return this._bucketName;
  }

  get storageClient(): Storage {
    return this._storageClient;
  }
}
