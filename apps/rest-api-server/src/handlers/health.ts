import type { RequestHandler } from "express";

import { logger } from "@blobscan/logger";

import { prisma } from "../clients/prisma";
import { redis } from "../clients/redis";

const READINESS_TIMEOUT_MS = 5_000;

type CheckStatus = "ok" | "error";
type ReadinessStatus = "ready" | "unavailable";

interface ReadinessResponse {
  status: ReadinessStatus;
  checks: {
    database: CheckStatus;
    redis: CheckStatus;
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    timeout.unref();
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

async function checkRedis(): Promise<void> {
  await redis.ping();
}

export const healthHandler: RequestHandler = function (_req, res) {
  res.status(200).json({ status: "ok" });
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const readyHandler: RequestHandler = async function (_req, res) {
  try {
    await respondReadiness(res);
  } catch (err) {
    logger.error(`Readiness check crashed: ${(err as Error).message}`);

    if (!res.headersSent) {
      res.status(503).json({ status: "unavailable" });
    }
  }
};

// Concurrent probes share one in-flight check so a degraded DB doesn't pile up
// probe queries and starve the connection pool.
let inFlightChecks: Promise<PromiseSettledResult<void>[]> | null = null;

function runChecks() {
  inFlightChecks ??= Promise.allSettled([
    withTimeout(checkDatabase(), READINESS_TIMEOUT_MS),
    withTimeout(checkRedis(), READINESS_TIMEOUT_MS),
  ]).finally(() => {
    inFlightChecks = null;
  });

  return inFlightChecks;
}

async function respondReadiness(res: Parameters<RequestHandler>[1]) {
  const [database, redisCheck] = (await runChecks()) as [
    PromiseSettledResult<void>,
    PromiseSettledResult<void>
  ];

  const checks: ReadinessResponse["checks"] = {
    database: database.status === "fulfilled" ? "ok" : "error",
    redis: redisCheck.status === "fulfilled" ? "ok" : "error",
  };
  const failedChecks = Object.entries(checks)
    .filter(([, status]) => status === "error")
    .map(([name]) => name);
  const isReady = failedChecks.length === 0;

  if (!isReady) {
    logger.warn(`Readiness check failed: ${failedChecks.join(", ")}`);
  }

  const response: ReadinessResponse = {
    status: isReady ? "ready" : "unavailable",
    checks,
  };

  res.status(isReady ? 200 : 503).json(response);
}
