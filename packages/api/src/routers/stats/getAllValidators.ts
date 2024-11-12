import { z } from "@blobscan/zod";
import { logger } from "@blobscan/logger"

import { env } from "../../env"
import { BASE_PATH } from "./common";
import { publicProcedure } from "../../procedures";

export const inputSchema = z.void();

export const outputSchema = z.object({
  data: z.array(z.object({
    index: z.string(),
    balance: z.string(),
    status: z.string(),
    validator: z.object({
      pubkey: z.string(),
      withdrawal_credentials: z.string(),
      effective_balance: z.string(),
      slashed: z.boolean(),
      activation_eligibility_epoch: z.string(),
      activation_epoch: z.string(),
      exit_epoch: z.string(),
      withdrawable_epoch: z.string(),
    }),
  }))
});

async function getAllValidatorQuery() {
  try{
    const response = await fetch(env.BEACON_NODE_ENDPOINT + "/eth/v1/beacon/states/head/validators");
    const rawdata = await response.json();
    const data = rawdata.data;
    // logger.info(data);
    return data;
  } catch (error) {
    // Handle the error here
    logger.error("Error fetching validators:", error);
    return [];
  }
}

export const getAllValidators = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/validators`,
      tags: ["stats"],
      summary: "Get all validators.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async () => {
    const data = await getAllValidatorQuery();
    return { data:data };
  });