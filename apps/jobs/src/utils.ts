import dayjs from "@blobscan/dayjs";

import type { env } from "./env";

export type Granularity = "minute" | "hour" | "day";

export function formatDate(date: Date | string | dayjs.Dayjs) {
  return dayjs(date).format("YYYY-MM-DD");
}

export function determineGranularity(cronPattern: string): Granularity {
  switch (cronPattern) {
    case "0 * * * *":
      return "hour";
    case "0 0 * * *":
      return "day";
    case "* * * * *":
      return "minute";
    default:
      throw new Error(`Unsupported cron pattern: ${cronPattern}`);
  }
}

export function getNetworkDencunForkSlot(
  networkName: (typeof env)["NETWORK_NAME"]
): number {
  switch (networkName) {
    case "mainnet":
      return 8626176;
    case "holesky":
      return 950272;
    case "sepolia":
      return 4243456;
    case "gnosis":
      return 14237696;
    case "chiado":
      return 8265728;
    case "devnet":
      return 0;
  }
}

export function gracefulShutdown(teardownOp: () => void | Promise<void>) {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}`);

    await teardownOp();

    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
