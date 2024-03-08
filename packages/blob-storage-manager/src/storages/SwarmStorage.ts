import { Bee, BeeDebug } from "@ethersphere/bee-js";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";
import { BLOB_STORAGE_NAMES } from "../utils";

export interface SwarmStorageConfig extends BlobStorageConfig {
  beeEndpoint: string;
  beeDebugEndpoint?: string;
}

export type SwarmClient = {
  bee: Bee;
  beeDebug?: BeeDebug;
};

export class SwarmStorage extends BlobStorage {
  _swarmClient: SwarmClient;

  protected constructor({ beeDebugEndpoint, beeEndpoint }: SwarmStorageConfig) {
    super(BLOB_STORAGE_NAMES.SWARM);

    try {
      this._swarmClient = {
        bee: new Bee(beeEndpoint),
        beeDebug: beeDebugEndpoint ? new BeeDebug(beeDebugEndpoint) : undefined,
      };
    } catch (err) {
      throw new Error("Failed to create swarm clients", {
        cause: err,
      });
    }
  }

  protected async _healthCheck() {
    const healthCheckOps = [];

    healthCheckOps.push(this._swarmClient.bee.checkConnection());

    if (this._swarmClient.beeDebug) {
      healthCheckOps.push(
        this._swarmClient.beeDebug.getHealth().then((health) => {
          if (health.status !== "ok") {
            throw new Error(`Bee debug is not healthy: ${health.status}`);
          }
        })
      );
    }

    await Promise.all(healthCheckOps);
  }

  protected async _getBlob(reference: string) {
    return (await this._swarmClient.bee.downloadData(reference)).toString();
  }

  protected async _storeBlob(
    chainId: number,
    versionedHash: string,
    data: string
  ) {
    const batchId = await this.#getAvailableBatch();
    const response = await this._swarmClient.bee.uploadFile(
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
    if (!this._swarmClient.beeDebug) {
      throw new Error("Bee debug endpoint required to get postage batches.");
    }

    const [firstBatch] = await this._swarmClient.beeDebug.getAllPostageBatch();

    if (!firstBatch?.batchID) {
      throw new Error("No postage batches available.");
    }

    return firstBatch.batchID;
  }

  static getConfigFromEnv(env: Partial<Environment>): SwarmStorageConfig {
    if (!env.BEE_ENDPOINT) {
      throw new Error("No config variables found: no bee endpoint provided");
    }

    return {
      beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
      beeEndpoint: env.BEE_ENDPOINT,
    };
  }
}
