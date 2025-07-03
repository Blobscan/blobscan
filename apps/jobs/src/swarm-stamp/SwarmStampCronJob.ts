import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";
import axios from "axios";

import { formatTtl } from "@blobscan/dates";
import { prisma } from "@blobscan/db";

import type { CommonCronJobConfig } from "../BaseCronJob";
import { BaseCronJob } from "../BaseCronJob";
import { SwarmNodeError } from "../errors";

type BatchData = {
  batchID: string;
  batchTTL: number;
};

export interface SwarmStampCronJobConfig extends CommonCronJobConfig {
  beeEndpoint: string;
  batchId: string;
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
      jobFn: async () => {
        let response: AxiosResponse<BatchData>;

        try {
          const url = `${beeEndpoint}/stamps/${batchId}`;

          response = await axios.get<BatchData>(url);
        } catch (err) {
          let cause = err;

          if (err instanceof AxiosError) {
            cause = new SwarmNodeError(err);
          }

          throw new Error(`Failed to fetch stamp batch "${batchId}"`, {
            cause,
          });
        }

        const { batchTTL } = response.data;

        await prisma.blobStoragesState.upsert({
          create: {
            swarmDataId: batchId,
            swarmDataTTL: batchTTL,
          },
          update: {
            swarmDataId: batchId,
            swarmDataTTL: batchTTL,
            updatedAt: new Date(),
          },
          where: {
            id: 1,
          },
        });

        const expiryDate = formatTtl(batchTTL);
        this.logger.info(
          `Swarm batch ID "${batchId}" updated. New expiry date: ${expiryDate}.`
        );
      },
    });
  }
}
