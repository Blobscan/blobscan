import { Bee, BeeDebug } from "@ethersphere/bee-js";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";

interface SwarmStorageConfig extends BlobStorageConfig {
  beeEndpoint: string;
  beeDebugEndpoint?: string;
}

type SwarmClient = {
  bee: Bee;
  beeDebug?: BeeDebug;
};

export class SwarmStorage extends BlobStorage {
  #swarmClient: SwarmClient;

  constructor({ beeDebugEndpoint, beeEndpoint }: SwarmStorageConfig) {
    super();

    this.#swarmClient = {
      bee: new Bee(beeEndpoint),
      beeDebug: beeDebugEndpoint ? new BeeDebug(beeDebugEndpoint) : undefined,
    };
  }

  async healthCheck(): Promise<void> {
    const healthCheckOps = [];

    healthCheckOps.push(this.#swarmClient.bee.checkConnection());

    if (this.#swarmClient.beeDebug) {
      healthCheckOps.push(
        this.#swarmClient.beeDebug.getHealth().then((health) => {
          if (health.status !== "ok") {
            throw new Error(`Bee debug is not healthy: ${health.status}`);
          }
        })
      );
    }

    await Promise.all(healthCheckOps);
  }

  async getBlob(reference: string): Promise<string> {
    return (await this.#swarmClient.bee.downloadData(reference)).toString();
  }

  async storeBlob(
    chainId: number,
    versionedHash: string,
    data: string
  ): Promise<string> {
    const batchId = await this.#getAvailableBatch();
    const response = await this.#swarmClient.bee.uploadFile(
      batchId,
      data,
      this.buildBlobFileName(chainId, versionedHash),
      {
        pin: true,
        contentType: "text/plain",
      }
    );

    return response.reference.toString();
  }

  async #getAvailableBatch(): Promise<string> {
    if (!this.#swarmClient.beeDebug) {
      throw new Error("Bee debug endpoint required to get postage batches");
    }

    const [firstBatch] = await this.#swarmClient.beeDebug.getAllPostageBatch();

    if (!firstBatch?.batchID) {
      throw new Error("No postage batches available");
    }

    return firstBatch.batchID;
  }

  static tryGetConfigFromEnv(env: Environment): SwarmStorageConfig | undefined {
    if (!env.SWARM_STORAGE_ENABLED) {
      return;
    }

    if (!env.BEE_ENDPOINT) {
      console.warn("Swarm storage enabled but no bee endpoint was provided");
      return;
    }

    return {
      beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
      beeEndpoint: env.BEE_ENDPOINT,
    };
  }
}
