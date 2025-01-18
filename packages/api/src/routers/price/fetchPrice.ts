import IORedis from "ioredis";

import { env } from "@blobscan/env";
import { z } from "@blobscan/zod";

const priceSchema = z.object({
  usd: z.number(),
});

type Price = z.infer<typeof priceSchema>;

async function fetchPrice(coinId: string, apiKey: string): Promise<Price> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": apiKey,
      },
    }
  );

  const json = await response.json();

  return priceSchema.parse(json[coinId]);
}

const PRICE_EXPIRATION_SECONDS = 900; // 15 minutes
const redis = new IORedis(env.REDIS_URI, { maxRetriesPerRequest: null });

export async function getPrice(coinId: string): Promise<Price | null> {
  if (!env.COINGECKO_API_KEY) {
    return null;
  }

  const COIN_KEY = `price:${coinId}`;
  const cachedPrice = await redis.get(COIN_KEY);

  if (cachedPrice) {
    return JSON.parse(cachedPrice);
  }

  const fetchedPrice = await fetchPrice(coinId, env.COINGECKO_API_KEY);

  await redis.setex(
    COIN_KEY,
    PRICE_EXPIRATION_SECONDS,
    JSON.stringify(fetchedPrice)
  );

  return fetchedPrice;
}
