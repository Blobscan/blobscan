import { Bee, BeeDebug } from "@ethersphere/bee-js";

import { BlobStorage } from "../BlobStorage";

type SwarmStorageOptions = {
  beeEndpoint: string;
  beeDebugEndpoint: string;
};

type SwarmClient = {
  bee: Bee;
  beeDebug: BeeDebug;
};

export class SwarmStorage extends BlobStorage {
  #swarmClient: SwarmClient;

  constructor({ beeDebugEndpoint, beeEndpoint }: SwarmStorageOptions) {
    super();

    this.#swarmClient = {
      bee: new Bee(beeEndpoint),
      beeDebug: new BeeDebug(beeDebugEndpoint),
    };
  }

  async getBlob(reference: string): Promise<string> {
    return (await this.#swarmClient.bee.downloadData(reference)).toString();
  }

  async storeBlob(
    chainId: number,
    versionedHash: string,
    data: string,
  ): Promise<string> {
    const batchId = await this.#getAvailableBatch();
    const response = await this.#swarmClient.bee.uploadFile(
      batchId,
      data,
      this.buildBlobFileName(chainId, versionedHash),
      {
        pin: true,
        contentType: "text/plain",
      },
    );

    return response.reference.toString();
  }

  async #getAvailableBatch(): Promise<string> {
    const [firstBatch] = await this.#swarmClient.beeDebug.getAllPostageBatch();

    if (!firstBatch?.batchID) {
      throw new Error("No postage batches available");
    }

    return firstBatch.batchID;
  }
}
