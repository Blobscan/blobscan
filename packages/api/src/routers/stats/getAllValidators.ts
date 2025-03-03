import { z } from "@blobscan/zod";
import { logger } from "@blobscan/logger"

import { env } from "../../env"
import { BASE_PATH } from "./common";
import { publicProcedure } from "../../procedures";
import { Pool } from "pg";
//cd packages/api
//pnpm add --save-dev @types/pg 

const DATABASE_INFO = env.DATABASE_URL;

const parsedUrl = new URL(DATABASE_INFO);

const dbConfig = {
  user: parsedUrl.username,    
  password: parsedUrl.password, 
  host: parsedUrl.hostname,     
  port: parseInt(parsedUrl.port),  
  database: parsedUrl.pathname.slice(1),  
};

const pool = new Pool(dbConfig);

export const inputSchema = z.void();

export const outputSchema = z.object({
  data: z.array(z.object({
    index: z.string(),
    balance: z.string(),
    status: z.string(),
    validator: z.object({
      pubkey: z.string(),
      // withdrawal_credentials: z.string(),
      // effective_balance: z.string(),
      // slashed: z.boolean(),
      // activation_eligibility_epoch: z.string(),
      activation_epoch: z.string(),
      exit_epoch: z.string(),
      // withdrawable_epoch: z.string(),
    }),
    withdrawal_amount: z.string(),
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

async function getWithdrawalAmounts(indices: string[]) {
  try {
    const result = await pool.query(
      "SELECT validator_idx, withdrawal_amount FROM validator_withdrawal WHERE validator_idx = ANY($1)",
      [indices]
    );

    return new Map(result.rows.map(row => [row.validator_idx, row.withdrawal_amount]));
  } catch (error) {
    logger.error("Error fetching withdrawal amounts:", error);
    return new Map();
  }
}

async function enrichValidators(data: any[]) {
  const batchSize = 1000; 
  let enrichedData: any[] = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);  
    const validatorIndices = batch.map(v => v.index);
    
    const withdrawalAmounts = await getWithdrawalAmounts(validatorIndices);

    const batchResult = batch.map(validator => ({
      //..validator,
      index: validator.index,
      balance: validator.balance,
      status: validator.status,
      validator: {
      pubkey: validator.validator.pubkey,
      activation_epoch: validator.validator.activation_epoch,
      exit_epoch: validator.validator.exit_epoch
      },
      withdrawal_amount: withdrawalAmounts.get(validator.index) || "----",
    }));

    enrichedData = enrichedData.concat(batchResult);
  }

  return enrichedData;
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
    const enrichedData = await enrichValidators(data);
    return { data: enrichedData };
  });