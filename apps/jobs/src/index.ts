/* eslint-disable @typescript-eslint/no-misused-promises */
import "./instrumentation";
import * as Sentry from "@sentry/node";

import { getPrisma } from "@blobscan/db";
import { deprecatedEnvVarsInUse } from "@blobscan/env";
import { ErrorException } from "@blobscan/errors";
import { createLogger } from "@blobscan/logger";

import { createJobs } from "./setup";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const logger = createLogger("jobs");

const prisma = getPrisma();

async function exit(code: number) {
  await prisma.$disconnect().catch((err) => {
    logger.error(new ErrorException("Failed to disconnect Prisma", err));
  });
  await Sentry.flush(2000);

  process.exit(code);
}

async function main() {
  for (const { oldName, newName } of deprecatedEnvVarsInUse) {
    logger.warn(
      `The env variable ${oldName} is deprecated. Use ${newName} instead`
    );
  }

  const jobs = await createJobs(prisma);

  if (!jobs.length) {
    logger.warn("No jobs are enabled. Exiting");

    await exit(0);

    return;
  }

  for (const job of jobs) {
    job.start();
  }

  async function gracefulShutdown(signal: string) {
    logger.info(`Received ${signal}. Shutting down...`);

    await Promise.allSettled(jobs.map((job) => job.stop(SHUTDOWN_TIMEOUT_MS)));

    logger.info("Jobs process shut down successfully");

    await exit(0);
  }

  process.on("uncaughtException", async (err) => {
    const err_ = new ErrorException("Uncaught exception", err);

    logger.error(err_);
    Sentry.captureException(err_);

    await exit(1);
  });

  process.on("unhandledRejection", async (err) => {
    const cause = err instanceof Error ? err : new Error(err as string);
    const err_ = new ErrorException("Unhandled promise rejection", cause);

    logger.error(err_);
    Sentry.captureException(err_);

    await exit(1);
  });

  process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.once("SIGINT", () => gracefulShutdown("SIGINT"));
}

main().catch(async (err) => {
  Sentry.captureException(err);
  logger.error(err);

  await exit(1);
});
