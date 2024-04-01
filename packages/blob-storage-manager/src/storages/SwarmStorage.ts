import { Bee, BeeDebug } from "@ethersphere/bee-js";
import type { PostageBatch } from "@ethersphere/bee-js";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";
import { BlobStorageError } from "../errors";
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

  constructor({ beeDebugEndpoint, beeEndpoint, chainId }: SwarmStorageConfig) {
    super(BLOB_STORAGE_NAMES.SWARM, chainId);

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

  async getPostageBatch(batchLabel: string): Promise<PostageBatch | undefined> {
    const batches = await this.#getAllPostageBatch();

    return batches.find((b) => b.label === batchLabel);
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
    const file = await this._swarmClient.bee.downloadFile(reference);

    return file.data.text();
  }

  protected async _removeBlob(reference: string): Promise<void> {
    await this._swarmClient.bee.unpin(reference);
  }

  protected async _storeBlob(versionedHash: string, data: string) {
    const batchId = await this.#getAvailableBatch();
    const response = await this._swarmClient.bee.uploadFile(
      batchId,
      data,
      this.buildBlobFileName(versionedHash),
      {
        pin: true,
        contentType: "text/plain",
      }
    );

    return response.reference.toString();
  }

  async #getAllPostageBatch(): Promise<PostageBatch[]> {
    const beeDebug = this.getBeeDebug();

    return beeDebug.getAllPostageBatch();
  }

  async #getAvailableBatch(): Promise<string> {
    const [firstBatch] = await this.#getAllPostageBatch();

    if (!firstBatch?.batchID) {
      throw new Error("No postage batches available.");
    }

    return firstBatch.batchID;
  }

  protected getBeeDebug() {
    if (!this._swarmClient.beeDebug) {
      throw new Error("Bee debug endpoint required to get postage batches.");
    }

    return this._swarmClient.beeDebug;
  }

  static getConfigFromEnv(env: Partial<Environment>): SwarmStorageConfig {
    const baseConfig = super.getConfigFromEnv(env);

    if (!env.BEE_ENDPOINT) {
      throw new BlobStorageError(
        this.name,
        "No endpoint provided. You need to define BEE_ENDPOINT variable in order to use the Swarm storage"
      );
    }

    return {
      ...baseConfig,
      beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
      beeEndpoint: env.BEE_ENDPOINT,
    };
  }
}
