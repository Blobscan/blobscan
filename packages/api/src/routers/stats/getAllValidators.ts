import { z } from "@blobscan/zod";
import { logger } from "@blobscan/logger"

import { env } from "../../env"
import { BASE_PATH } from "./common";
import { publicProcedure } from "../../procedures";
import { Pool } from "pg";

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

// export const inputSchema = z.void();
export const inputSchema = z.object({
  page: z.number().min(1).default(1),   
  limit: z.number().min(1).max(100).default(25), 
  pubkey: z.string().optional(),
});

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
  })),
  totalNum: z.number(),
});

type StatusData = {
  status: string;
  count: string;
};

function calculateCountTotal(data: StatusData[]): number {
  const statusesToInclude: string[] = ["active", "pending", "withdrawal", "exited"];
  let totalCount = 0;

  data.forEach(item => {
    if (statusesToInclude.includes(item.status)) {
      totalCount += parseInt(item.count);  
    }
  });

  return totalCount;
}

async function getAllValidatorQuery(page: number, limit: number) {
  try {
    const startIndex = (page - 1) * limit;  
    const endIndex = startIndex + limit;   

    let validators: any[] = [];
    
    for (let index = startIndex; index < endIndex; index++) {
      const response = await fetch(
        `${env.BEACON_NODE_ENDPOINT}/eth/v1/beacon/states/head/validators/${index}`
      );
      const rawdata = await response.json();
      const data = rawdata.data;

      if (data) {
        validators.push(data);  
      }
    }
    
    return validators;
  } catch (error) {
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

async function enrichValidators(page: number, limit: number) {
  const data = await getAllValidatorQuery(page, limit);
  const batchSize = 100;
  let enrichedData: any[] = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const validatorIndices = batch.map((v: { index: any; }) => v.index);

    const withdrawalAmounts = await getWithdrawalAmounts(validatorIndices);

    const batchResult = batch.map((validator: { index: any; balance: any; status: any; validator: { pubkey: any; activation_epoch: any; exit_epoch: any; }; }) => ({
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
      summary: "Get all validators with pagination.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ input }) => {
    const totalCount = await fetch(
      `${env.BEACON_NODE_ENDPOINT}/eth/v1/beacon/states/head/validator_count`
    );
    const rawdata = await totalCount.json();
    let totalNum = calculateCountTotal(rawdata.data);

    const { page, limit, pubkey } = input;
    let enrichedData: any[] = [];

    if (pubkey) {
      // 如果 pubkey 存在，查询指定的 validator
      logger.info(`Fetching validator for pubkey: ${pubkey}`);
      
      const response = await fetch(
        `${env.BEACON_NODE_ENDPOINT}/eth/v1/beacon/states/head/validators/${pubkey}`
      );
      const rawData = await response.json();
      const data = rawData.data;

      if (data) {
        const withdrawalAmounts = await getWithdrawalAmounts([data.index]);
        enrichedData.push({
          index: data.index,
          balance: data.balance,
          status: data.status,
          validator: {
            pubkey: data.validator.pubkey,
            activation_epoch: data.validator.activation_epoch,
            exit_epoch: data.validator.exit_epoch
          },
          withdrawal_amount: withdrawalAmounts.get(data.index) || "----",
        });
        totalNum=1;
      }
      return {data: enrichedData,totalNum};
    }
    else{
      logger.info(`page ${page} limit ${limit}`);
      enrichedData = await enrichValidators(page, limit);
      return {data: enrichedData,totalNum}
      ;
    }
    
  });
  

