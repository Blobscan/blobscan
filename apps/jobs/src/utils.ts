export type Granularity = "minute" | "hour" | "day";

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

export function gracefulShutdown(closeOp: () => void | Promise<void>) {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}`);

    await closeOp();

    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
