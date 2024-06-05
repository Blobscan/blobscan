import type { Redis } from "ioredis";
import { prisma } from "@blobscan/db";
import { env } from "../env";
const axios = require('axios');
import { PeriodicUpdater } from "../PeriodicUpdater";
import { SwarmStampSyncerError } from "../errors";

export class SwarmStampUpdater extends PeriodicUpdater {
  constructor(
    redisUriOrConnection: string | Redis,
    beeEndpoint: string,
  ) {
    const name = "swarm-stamp";
    super({
      name,
      redisUriOrConnection,
      updaterFn: async () => {
        const batchId = env.SWARM_BATCH_ID;
        const url = `${beeEndpoint}/stamps/${batchId}`;
        const response = await axios.get(url);
        const data = response.data;

        if (response.status != 200) {
          throw new SwarmStampSyncerError(`Stamps endpoint returned status ${response.status} for batch id ${batchId}`);
        }

        await prisma.blobStoragesState.update({
          data: {
            swarmDataTTL: data.batchTTL,
          },
          where: {
            swarmDataId: batchId,
          },
        });

        this.logger.info(`Updated swarm stamp ${batchId}`);
      },
    });
  }
}
