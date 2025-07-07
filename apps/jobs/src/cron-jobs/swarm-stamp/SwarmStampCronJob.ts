import { prisma } from "@blobscan/db";

import type { CommonCronJobConfig } from "../BaseCronJob";
import { BaseCronJob, CronJobError } from "../BaseCronJob";
import swarmStamp from "./processor";
import type { SwarmStampJobResult } from "./types";

export interface SwarmStampCronJobConfig extends CommonCronJobConfig {
  beeEndpoint: string;
  batchId?: string;
}

export class SwarmStampCronJob extends BaseCronJob {
  constructor({
    cronPattern,
    redisUriOrConnection,
    batchId,
    beeEndpoint,
  }: SwarmStampCronJobConfig) {
    const name = "swarm-stamp";
    super({
      name,
      cronPattern,
      redisUriOrConnection,
      processor: swarmStamp,
      jobData: {
        batchId,
        beeEndpoint,
      },
    });

    this.worker?.on("completed", (_, result) => {
      const { batchId, newExpirationDate } = result as SwarmStampJobResult;

      this.logger.info(
        `Swarm batch ID "${batchId}" updated. New expiry date: ${newExpirationDate}.`
      );
    });
  }

  async start() {
    const batchId = this.jobData?.batchId;

    if (!batchId) {
      const blobStorageState = await prisma.blobStoragesState.findUnique({
        where: {
          id: 1,
        },
      });

      if (!blobStorageState?.swarmDataId) {
        throw new CronJobError(this.name, "No swarm batch id found");
      }

      this.jobData = {
        ...(this.jobData ?? {}),
        batchId: blobStorageState.swarmDataId,
      };
    }

    return super.start();
  }
}
