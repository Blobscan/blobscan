import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";
import axios from "axios";

import { formatTtl } from "@blobscan/dates";
import { prisma } from "@blobscan/db";
import { createModuleLogger } from "@blobscan/logger";

import { SwarmNodeError } from "../errors";

const logger = createModuleLogger("swarm-stamp-syncer");

type SwarmStampSyncerConfig = {
  beeEndpoint: string;
  batchId: string;
};

export async function syncSwarmStamp({
  beeEndpoint,
  batchId,
}: SwarmStampSyncerConfig) {
  const { batchTTL } = await fetchBatchData(beeEndpoint, batchId);

  await prisma.blobStoragesState.upsert({
    create: {
      swarmDataId: batchId,
      swarmDataTTL: batchTTL,
    },
    update: {
      swarmDataTTL: batchTTL,
      updatedAt: new Date(),
    },
    where: {
      id: 1,
      swarmDataId: batchId,
    },
  });

  const expiryDate = formatTtl(batchTTL);
  logger.info(
    `Swarm batch ID "${batchId}" updated. New expiry date: ${expiryDate}.`
  );
}

type BatchData = {
  batchID: string;
  batchTTL: number;
};

async function fetchBatchData(
  beeEndpoint: string,
  batchId: string
): Promise<BatchData> {
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

  return response.data;
}
