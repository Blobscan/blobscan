import { Bee, BeeDebug } from "@ethersphere/bee-js";
import { vi } from "vitest";

import { SWARM_REFERENCE } from "../../test/fixtures";
import type { SwarmClient, SwarmStorageConfig } from "../storages";
import { SwarmStorage } from "../storages";

vi.mock("@ethersphere/bee-js", async () => {
  const blobBatches: Record<string, { reference: string; data: string }[]> = {
    ["mock-batch-id"]: [],
  };

  return {
    Bee: vi.fn().mockImplementation((endpoint) => {
      return {
        url: endpoint,
        checkConnection: vi.fn().mockImplementation(() => {
          return {
            status: "ok",
          };
        }),
        downloadFile: vi.fn().mockImplementation((reference) => {
          const batch = blobBatches["mock-batch-id"];

          if (!batch) {
            throw new Error("Batch not found");
          }

          const file = batch.find((b) => b.reference === reference);

          if (file) {
            return {
              data: {
                text() {
                  return "mock-data";
                },
              },
            };
          }

          throw new Error("File not found");
        }),
        uploadFile: vi.fn().mockImplementation((batchId, blobData) => {
          const batch = blobBatches[batchId];
          if (batch) {
            batch.push({ data: blobData, reference: SWARM_REFERENCE });
          }

          return {
            reference: SWARM_REFERENCE,
          };
        }),
        unpin: vi.fn().mockImplementation((reference) => {
          const batch = blobBatches["mock-batch-id"];

          if (!batch) {
            throw new Error("Batch not found");
          }

          if (!batch.find((b) => b.reference === reference)) {
            throw new Error("File not found");
          }

          blobBatches["mock-batch-id"] = [];
        }),
      };
    }),
    BeeDebug: vi.fn().mockImplementation((endpoint) => {
      return {
        url: endpoint,
        getHealth: vi.fn().mockImplementation(() => {
          return Promise.resolve({
            status: "ok",
          });
        }),
        getAllPostageBatch: vi.fn().mockImplementation(() => {
          return [
            {
              batchID: "mock-batch-id",
            },
          ];
        }),
      };
    }),
  };
});

export class SwarmStorageMock extends SwarmStorage {
  constructor({ beeDebugEndpoint, beeEndpoint, chainId }: SwarmStorageConfig) {
    super({ beeDebugEndpoint, beeEndpoint, chainId });

    this._swarmClient = {
      bee: new Bee(beeEndpoint),
      beeDebug: beeDebugEndpoint ? new BeeDebug(beeDebugEndpoint) : undefined,
    };
  }

  get swarmClient(): SwarmClient {
    return this._swarmClient;
  }
}
