import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { healthHandler, readyHandler } from "../src/handlers/health";

const { loggerWarnMock, pingMock, queryRawMock } = vi.hoisted(() => ({
  loggerWarnMock: vi.fn(),
  pingMock: vi.fn(),
  queryRawMock: vi.fn(),
}));

vi.mock("@blobscan/logger", () => ({
  logger: {
    warn: loggerWarnMock,
  },
}));

vi.mock("../src/clients/prisma", () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

vi.mock("../src/clients/redis", () => ({
  redis: {
    ping: pingMock,
  },
}));

function createResponse() {
  const status = vi.fn();
  const json = vi.fn();
  const response = { status, json } as unknown as Response;

  status.mockReturnValue(response);
  json.mockReturnValue(response);

  return { json, response, status };
}

const request = {} as Request;
const next = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("healthHandler", () => {
  it("reports liveness without checking dependencies", async () => {
    const { json, response, status } = createResponse();

    await healthHandler(request, response, next);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ status: "ok" });
    expect(queryRawMock).not.toHaveBeenCalled();
    expect(pingMock).not.toHaveBeenCalled();
  });
});

describe("readyHandler", () => {
  beforeEach(() => {
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);
    pingMock.mockResolvedValue("PONG");
  });

  it("reports readiness when Postgres and Redis are available", async () => {
    const { json, response, status } = createResponse();

    await readyHandler(request, response, next);

    expect(queryRawMock).toHaveBeenCalledOnce();
    expect(pingMock).toHaveBeenCalledOnce();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      status: "ready",
      checks: {
        database: "ok",
        redis: "ok",
      },
    });
  });

  it("reports unavailability when Postgres is down", async () => {
    const { json, response, status } = createResponse();
    queryRawMock.mockRejectedValueOnce(new Error("database unavailable"));

    await readyHandler(request, response, next);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      status: "unavailable",
      checks: {
        database: "error",
        redis: "ok",
      },
    });
    expect(loggerWarnMock).toHaveBeenCalledWith(
      "Readiness check failed: database"
    );
  });

  it("reports unavailability when Redis is down", async () => {
    const { json, response, status } = createResponse();
    pingMock.mockRejectedValueOnce(new Error("redis unavailable"));

    await readyHandler(request, response, next);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      status: "unavailable",
      checks: {
        database: "ok",
        redis: "error",
      },
    });
    expect(loggerWarnMock).toHaveBeenCalledWith(
      "Readiness check failed: redis"
    );
  });
});
