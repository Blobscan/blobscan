import { Bee, BeeDebug } from "@ethersphere/bee-js";
import { vi } from "vitest";

import { SWARM_REFERENCE } from "../../test/constants";
import type { SwarmClient, SwarmStorageConfig } from "../storages";
import { SwarmStorage } from "../storages";

vi.mock("@ethersphere/bee-js", async () => {
  return {
    Bee: vi.fn().mockImplementation((endpoint) => {
      return {
        url: endpoint,
        checkConnection: vi.fn(),
        downloadData: vi.fn().mockImplementation((reference) => {
          if (reference === SWARM_REFERENCE) {
            return Buffer.from("mock-data");
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
            status: "not ok",
          }),
        getAllPostageBatch: vi
          .fn()
          .mockResolvedValueOnce([
            {
              batchID: "mock-batch-id",
            },
          ])
          .mockResolvedValueOnce([
            {
              batchID: "mock-batch-id",
            },
          ])
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

  async getAvailableBatch(): Promise<string> {
    return super._getAvailableBatch();
  }
}
