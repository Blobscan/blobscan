import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";
import axios from "axios";

import { formatTtl } from "@blobscan/dates";
import { prisma } from "@blobscan/db";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";
import { SwarmNodeError } from "../errors";

type BatchData = {
  batchID: string;
  batchTTL: number;
};

export interface SwarmStampSyncerConfig extends CommonSyncerConfig {
  beeEndpoint: string;
  batchId: string;
}

export class SwarmStampSyncer extends BaseSyncer {
  constructor({
    cronPattern,
    redisUriOrConnection,
    batchId,
    beeEndpoint,
  }: SwarmStampSyncerConfig) {
    const name = "swarm-stamp";
    super({
      name,
      cronPattern,
      redisUriOrConnection,
      syncerFn: async () => {
        let response: AxiosResponse<BatchData[]>;

        try {
          const url = `${beeEndpoint}/batches`;

          response = await axios.get<BatchData[]>(url);
        } catch (err) {
          let cause = err;

          if (err instanceof AxiosError) {
            cause = new SwarmNodeError(err);
          }

          throw new Error(`Failed to fetch stamp batch "${batchId}"`, {
            cause,
          });
        }

        const { batchTTL } =
          response.data.find((batch) => batch.batchID === batchId) ?? {};

        if (!batchTTL) {
          throw new Error(`Batch "${batchId}" not found`);
        }

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
