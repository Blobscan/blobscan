import type { AxiosResponse } from "axios";
import axios, { AxiosError } from "axios";

import { formatTtl } from "@blobscan/dates";
import { prisma } from "@blobscan/db";

import { SwarmNodeError } from "./errors";
import type { SwarmStampJobResult, SwarmStampJob } from "./types";

type BatchDataGetResponse = {
  batchID: string;
  batchTTL: number;
};

export default async ({
  data: { batchId, beeEndpoint },
}: SwarmStampJob): Promise<SwarmStampJobResult> => {
  let response: AxiosResponse<BatchDataGetResponse>;

  try {
    const url = `${beeEndpoint}/stamps/${batchId}`;

    response = await axios.get<BatchDataGetResponse>(url);
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

  return {
    batchId,
    newExpirationDate: expiryDate,
  };
};
