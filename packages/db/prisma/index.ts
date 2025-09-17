import { PrismaClient } from "@prisma/client";

import { logger } from "@blobscan/logger";

import type { ExtensionConfig as CustomFieldsExtensionConfig } from "./extensions";
import {
  upsertManyExtension,
  createComputedFieldsExtension,
  statsExtension,
  helpersExtension,
} from "./extensions";
import { ethUsdPriceExtension } from "./extensions/eth-usd-price";

export type GetPrismaParams = {
  customFieldExtension: CustomFieldsExtensionConfig;
};

export function getPrisma(params?: GetPrismaParams) {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
  };

  let prisma_ = globalForPrisma.prisma;

  if (!prisma_) {
    const p = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? [
              { emit: "event", level: "query" },
              { emit: "event", level: "error" },
              { emit: "event", level: "warn" },
            ]
          : [
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ],
    });

    if (process.env.MODE !== "test") {
      p.$on("query", (e) => {
        logger.debug(`${e.query}\nDuration=${e.duration}ms`);
      });

      p.$on("error", (e) => {
        logger.error(e.message);
      });

      p.$on("warn", (e) => {
        logger.warn(e.message);
      });
    }

    prisma_ = p;
  }

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma_;

  const customFieldsExtension = createComputedFieldsExtension(
    params?.customFieldExtension
  );

  return prisma_
    .$extends(helpersExtension)
    .$extends(customFieldsExtension)
    .$extends(ethUsdPriceExtension)
    .$extends(upsertManyExtension)
    .$extends(statsExtension);
}

export type BlobscanPrismaClient = ReturnType<typeof getPrisma>;
