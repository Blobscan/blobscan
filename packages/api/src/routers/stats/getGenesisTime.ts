import { z } from "@blobscan/zod";
import { logger } from "@blobscan/logger"

import { env } from "../../env";
import { BASE_PATH } from "./common";
import { publicProcedure } from "../../procedures";

export const inputSchema = z.void();

export const outputSchema = z.object({
  data: z.object({
    genesis_time: z.string(),
    genesis_fork_version: z.string(),
    genesis_validators_root: z.string(),
  }),
});

async function getGenesisTimeQuery() {
  try{
    const resp = await fetch(env.BEACON_NODE_ENDPOINT + "/eth/v1/beacon/genesis");
    const rawdata = await resp.json();

    return rawdata.data;
  } catch (error) {
    logger.error("Error fetching validators:", error);
    return [];
  }
}

export const getGenesisTime = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/genesis`,
      tags: ["stats"],
      summary: "Get all epoch genesis time.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async () => {
    const data = await getGenesisTimeQuery();
    return { data:data };
  });