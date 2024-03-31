import { Bee, BeeDebug } from "@ethersphere/bee-js";
import { vi } from "vitest";

import { SWARM_REFERENCE } from "../../test/fixtures";
import type { SwarmClient, SwarmStorageConfig } from "../storages";
import { SwarmStorage } from "../storages";

vi.mock("@ethersphere/bee-js", async () => {
  return {
    Bee: vi.fn().mockImplementation((endpoint) => {
      return {
        url: endpoint,
        checkConnection: vi
          .fn()
          .mockResolvedValueOnce({
            status: "ok",
          })
          .mockRejectedValueOnce(new Error("Bee is not healthy: not ok"))
          .mockResolvedValueOnce({
            status: "ok",
          }),
        downloadFile: vi.fn().mockImplementation((reference) => {
          if (reference === SWARM_REFERENCE) {
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
        uploadFile: vi.fn().mockResolvedValue({
          reference: "mock-reference",
        }),
      };
    }),
    BeeDebug: vi.fn().mockImplementation((endpoint) => {
      return {
        url: endpoint,
        getHealth: vi
          .fn()
          .mockResolvedValueOnce({
            status: "ok",
          })
          .mockResolvedValueOnce({
            status: "ok",
          })
          .mockResolvedValueOnce({
            status: "not ok",
          }),
        getAllPostageBatch: vi
          .fn()
          .mockResolvedValueOnce([
            {
              batchID: "mock-batch-id",
            },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
      };
    }),
  };
});

export class SwarmStorageMock extends SwarmStorage {
  constructor({ beeDebugEndpoint, beeEndpoint }: SwarmStorageConfig) {
    super({ beeDebugEndpoint, beeEndpoint });

    this._swarmClient = {
      bee: new Bee(beeEndpoint),
      beeDebug: beeDebugEndpoint ? new BeeDebug(beeDebugEndpoint) : undefined,
    };
  }

  get swarmClient(): SwarmClient {
    return this._swarmClient;
  }
}
